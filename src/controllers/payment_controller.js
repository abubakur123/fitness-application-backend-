const paymentService = require('../services/payment_service');

class PaymentController {
  // Process new payment
  async processPayment(req, res) {
    try {
      const paymentData = {
        ...req.body,
        userId: req.body.userId || req.user?.userId
      };

      // Validate required fields
      if (!paymentData.userId || !paymentData.packageId || !paymentData.amount) {
        return res.status(400).json({
          success: false,
          message: 'userId, packageId, and amount are required'
        });
      }

      const result = await paymentService.processPayment(paymentData);
      
      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Process subscription renewal payment
  async processRenewalPayment(req, res) {
    try {
      const { id } = req.params;
      const paymentData = {
        ...req.body,
        userId: req.user?.userId // Get user ID from authenticated user
      };

      const result = await paymentService.processRenewalPayment(id, paymentData);
      
      res.status(200).json({
        success: true,
        message: 'Subscription renewed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Handle payment webhook
  async handlePaymentWebhook(req, res) {
    try {
      const webhookData = req.body;
      
      // Verify webhook signature (implement based on your payment gateway)
      const isValidWebhook = await this.verifyWebhookSignature(req);
      if (!isValidWebhook) {
        return res.status(401).json({
          success: false,
          message: 'Invalid webhook signature'
        });
      }

      const result = await paymentService.handlePaymentWebhook(webhookData);
      
      res.status(200).json({
        success: true,
        message: 'Payment webhook processed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Refund payment
  async refundPayment(req, res) {
    try {
      const { transactionId } = req.params;
      const { refundAmount } = req.body;
      
      const result = await paymentService.refundPayment(transactionId, refundAmount);
      
      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get payment details
  async getPaymentDetails(req, res) {
    try {
      const { transactionId } = req.params;
      
      const paymentDetails = await paymentService.getPaymentDetails(transactionId);
      
      res.status(200).json({
        success: true,
        data: paymentDetails
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get user payment history
  async getUserPaymentHistory(req, res) {
    try {
      const userId = req.params.userId || req.user?.userId;
      
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const paymentHistory = await paymentService.getUserPaymentHistory(userId);
      
      res.status(200).json({
        success: true,
        data: paymentHistory
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Private method to verify webhook signature
  async verifyWebhookSignature(req) {
    // Implement based on your payment gateway's webhook verification
    // For example, Stripe: stripe.webhooks.constructEvent()
    // For PayPal: verify PayPal signature
    
    // For now, return true (implement actual verification in production)
    return true;
  }
}

module.exports = new PaymentController();