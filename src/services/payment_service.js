const Subscription = require('../models/subscription_model');
const Package = require('..//models/package_model');
const User = require('../models/auth.model');
const subscriptionService = require('../services/subscription_service');

class PaymentService {
  // Process new payment for subscription
  async processPayment(paymentData) {
    try {
      const { userId, packageId, paymentMethod, amount, currency = 'USD', transactionId } = paymentData;
      
      // Verify package exists
      const packageDoc = await Package.findById(packageId);
      if (!packageDoc) {
        throw new Error('Package not found');
      }

      // Verify payment amount matches package price
      if (amount < packageDoc.price) {
        throw new Error(`Payment amount ${amount} is less than package price ${packageDoc.price}`);
      }

      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + packageDoc.durationInDays);

      // Create subscription
      const subscription = await subscriptionService.createSubscription({
        user: userId,
        package: packageId,
        paymentMethod: paymentMethod,
        transactionId: transactionId,
        amountPaid: amount,
        currency: currency,
        status: 'active',
        startDate: new Date(),
        expiryDate: expiryDate
      });

      // Process payment logic here (Stripe, PayPal, etc.)
      // This is where you would integrate with your payment gateway
      const paymentResult = await this.processWithPaymentGateway(paymentData);

      // Update subscription with payment gateway details
      subscription.paymentGatewayId = paymentResult.id;
      subscription.paymentStatus = paymentResult.status;
      await subscription.save();

      return {
        success: true,
        subscription: subscription,
        payment: paymentResult,
        message: 'Payment processed successfully'
      };
    } catch (error) {
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  // Process payment for subscription renewal
  async processRenewalPayment(subscriptionId, paymentData) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Renew subscription
      const renewedSubscription = await subscriptionService.renewSubscription(subscriptionId);
      
      // Add payment details
      renewedSubscription.paymentMethod = paymentData.paymentMethod;
      renewedSubscription.transactionId = paymentData.transactionId;
      renewedSubscription.amountPaid = paymentData.amountPaid;
      renewedSubscription.currency = paymentData.currency || subscription.currency;
      
      // Process payment
      const paymentResult = await this.processWithPaymentGateway(paymentData);

      // Update subscription with payment gateway details
      renewedSubscription.paymentGatewayId = paymentResult.id;
      renewedSubscription.paymentStatus = paymentResult.status;
      renewedSubscription.status = 'active'; // Mark as active after successful payment
      
      const savedRenewedSubscription = await renewedSubscription.save();

      // Update old subscription
      await Subscription.findByIdAndUpdate(subscriptionId, { 
        status: 'expired',
        updatedAt: Date.now()
      });

      // Update user document
      const user = await User.findById(subscription.user);
      if (user) {
        user.currentSubscription = savedRenewedSubscription._id;
        user.subscriptionStatus = 'active';
        await user.save();
      }

      return {
        success: true,
        subscription: savedRenewedSubscription,
        payment: paymentResult,
        message: 'Subscription renewed successfully'
      };
    } catch (error) {
      throw new Error(`Renewal payment failed: ${error.message}`);
    }
  }

  // Handle payment webhook from payment gateway
  async handlePaymentWebhook(webhookData) {
    try {
      const { 
        transactionId, 
        status, 
        amount, 
        userId, 
        packageId, 
        paymentMethod,
        paymentGateway,
        gatewayTransactionId 
      } = webhookData;
      
      // Find subscription by transaction ID
      let subscription = await subscriptionService.getSubscriptionByTransactionId(transactionId);
      
      if (!subscription) {
        // Create new subscription if payment successful and subscription doesn't exist
        if (status === 'success' && userId && packageId) {
          const paymentData = {
            userId,
            packageId,
            paymentMethod: paymentMethod || 'online',
            amount,
            transactionId,
            currency: webhookData.currency || 'USD'
          };
          
          return await this.processPayment(paymentData);
        }
        throw new Error('Subscription not found for this transaction');
      }
      
      // Update subscription status based on payment status
      let newStatus = subscription.status;
      let userStatus = user.subscriptionStatus;
      
      if (status === 'success') {
        newStatus = 'active';
        userStatus = 'active';
      } else if (status === 'failed') {
        newStatus = 'pending';
        userStatus = 'free';
      } else if (status === 'refunded') {
        newStatus = 'cancelled';
        userStatus = 'free';
      }
      
      // Update subscription
      subscription.status = newStatus;
      subscription.paymentStatus = status;
      subscription.updatedAt = Date.now();
      
      if (gatewayTransactionId) {
        subscription.paymentGatewayId = gatewayTransactionId;
      }
      
      const updatedSubscription = await subscription.save();
      
      // Update user document
      const user = await User.findById(subscription.user);
      if (user) {
        if (newStatus === 'active') {
          user.currentSubscription = updatedSubscription._id;
          user.subscriptionStatus = 'active';
        } else if (newStatus === 'cancelled' || newStatus === 'pending') {
          user.currentSubscription = null;
          user.subscriptionStatus = 'free';
        }
        await user.save();
      }
      
      return {
        success: true,
        subscription: updatedSubscription,
        webhookStatus: status,
        message: `Payment webhook processed: ${status}`
      };
    } catch (error) {
      throw error;
    }
  }

  // Refund payment
  async refundPayment(transactionId, refundAmount = null) {
    try {
      const subscription = await subscriptionService.getSubscriptionByTransactionId(transactionId);
      
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.paymentStatus === 'refunded') {
        throw new Error('Payment already refunded');
      }

      // Process refund with payment gateway
      const refundResult = await this.processRefundWithGateway(
        subscription.paymentGatewayId, 
        refundAmount || subscription.amountPaid
      );

      // Update subscription status
      subscription.status = 'cancelled';
      subscription.paymentStatus = 'refunded';
      subscription.updatedAt = Date.now();
      await subscription.save();

      // Update user document
      const user = await User.findById(subscription.user);
      if (user && user.currentSubscription && 
          user.currentSubscription.toString() === subscription._id.toString()) {
        user.currentSubscription = null;
        user.subscriptionStatus = 'free';
        await user.save();
      }

      return {
        success: true,
        refund: refundResult,
        subscription: {
          id: subscription._id,
          status: subscription.status,
          paymentStatus: subscription.paymentStatus
        },
        message: 'Refund processed successfully'
      };
    } catch (error) {
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  // Get payment details by transaction ID
  async getPaymentDetails(transactionId) {
    const subscription = await subscriptionService.getSubscriptionByTransactionId(transactionId);
    
    if (!subscription) {
      throw new Error('Payment not found');
    }

    return {
      transactionId: subscription.transactionId,
      amount: subscription.amountPaid,
      currency: subscription.currency,
      paymentMethod: subscription.paymentMethod,
      paymentStatus: subscription.paymentStatus,
      paymentGatewayId: subscription.paymentGatewayId,
      subscription: {
        id: subscription._id,
        status: subscription.status,
        user: subscription.user,
        package: subscription.package
      },
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt
    };
  }

  // Get user payment history
  async getUserPaymentHistory(userId) {
    const subscriptions = await Subscription.find({ user: userId })
      .populate('package', 'name price')
      .sort({ createdAt: -1 });

    return {
      total: subscriptions.length,
      payments: subscriptions.map(sub => ({
        transactionId: sub.transactionId,
        amount: sub.amountPaid,
        currency: sub.currency,
        paymentMethod: sub.paymentMethod,
        paymentStatus: sub.paymentStatus,
        date: sub.createdAt,
        subscription: {
          id: sub._id,
          status: sub.status,
          package: sub.package
        }
      }))
    };
  }

  // Private method to process payment with payment gateway
  async processWithPaymentGateway(paymentData) {
    // This is where you integrate with your actual payment gateway
    // For example: Stripe, PayPal, Razorpay, etc.
    
    // Mock implementation
    return {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      amount: paymentData.amount,
      currency: paymentData.currency,
      gateway: 'mock_gateway',
      timestamp: new Date()
    };
  }

  // Private method to process refund with payment gateway
  async processRefundWithGateway(paymentGatewayId, amount) {
    // Mock implementation
    return {
      id: `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      paymentId: paymentGatewayId,
      amount: amount,
      status: 'succeeded',
      timestamp: new Date()
    };
  }
}

module.exports = new PaymentService();