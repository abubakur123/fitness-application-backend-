const Subscription = require('../models/subscription_model');
const Package = require('../models/package_model');
const User = require('../models/auth.model');
const mongoose = require('mongoose');

class SubscriptionService {
  // Create a new subscription AND update user document
  async createSubscription(subscriptionData) {
    try {
      // Verify package exists
      const packageDoc = await Package.findById(subscriptionData.package);
      if (!packageDoc) {
        throw new Error('Package not found');
      }

      // Calculate expiry date
      const startDate = subscriptionData.startDate || new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(expiryDate.getDate() + packageDoc.durationInDays);

      const subscription = new Subscription({
        ...subscriptionData,
        expiryDate,
        packagePrice: packageDoc.price,
        status: 'active' // Set to active upon creation
      });

      const savedSubscription = await subscription.save();
      
      // Update user document with subscription info
      await User.updateUserSubscription(subscriptionData.user, {
        subscriptionId: savedSubscription._id,
        status: 'active'
      });

      return savedSubscription;
    } catch (error) {
      throw error;
    }
  }

  // Get subscription by ID
  async getSubscriptionById(id) {
    return await Subscription.findById(id)
      .populate('user', 'email profileKey subscriptionStatus')
      .populate('package', 'name description duration price');
  }

  // Get subscription data by ID - Returns any subscription regardless of status
  async getSubscriptionByIdOnly(id) {
    try {
      // Validate ID
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Please provide a valid subscription ID');
      }

      // Find subscription without status filter
      const subscription = await Subscription.findById(id)
        .populate('user', 'email firstName lastName profileKey')
        .populate('package', 'name description durationInDays price features');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get additional details about the subscription
      const isActive = subscription.isActive ? subscription.isActive() : false;
      const remainingDays = subscription.getRemainingDays ? subscription.getRemainingDays() : 0;
      
      // Return complete subscription data
      return {
        id: subscription._id,
        user: {
          id: subscription.user?._id,
          email: subscription.user?.email,
          name: subscription.user?.firstName && subscription.user?.lastName 
            ? `${subscription.user.firstName} ${subscription.user.lastName}`
            : subscription.user?.email
        },
        package: subscription.package,
        paymentDetails: {
          method: subscription.paymentMethod,
          transactionId: subscription.transactionId,
          amountPaid: subscription.amountPaid,
          currency: subscription.currency,
          packagePrice: subscription.packagePrice
        },
        statusInfo: {
          currentStatus: subscription.status,
          isActive: isActive,
          isCancelled: subscription.status === 'cancelled',
          isExpired: subscription.status === 'expired',
          isPending: subscription.status === 'pending'
        },
        dates: {
          startDate: subscription.startDate,
          expiryDate: subscription.expiryDate,
          createdAt: subscription.createdAt,
          updatedAt: subscription.updatedAt,
          cancelledAt: subscription.cancelledAt
        },
        durationInfo: {
          remainingDays: remainingDays,
          isExpired: remainingDays <= 0 && subscription.status !== 'cancelled',
          isInGracePeriod: remainingDays < 0 && subscription.status === 'active'
        },
        metadata: subscription.metadata || {},
        isTrial: subscription.isTrial || false
      };
    } catch (error) {
      throw error;
    }
  }

  // OR for a simpler raw data version:
  async getRawSubscriptionById(id) {
    try {
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Please provide a valid subscription ID');
      }

      // Get raw subscription without any status filtering
      const subscription = await Subscription.findById(id)
        .populate('user', 'email firstName lastName')
        .populate('package', 'name price durationInDays')
        .lean(); // Returns plain JavaScript object

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Get all subscription details including calculated fields
  async getCompleteSubscriptionDetails(id) {
    try {
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('Please provide a valid subscription ID');
      }

      const subscription = await Subscription.findById(id)
        .populate('user', 'email firstName lastName phoneNumber')
        .populate('package', 'name description durationInDays price features category');

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate dynamic fields
      const now = new Date();
      const isActive = subscription.status === 'active' && subscription.expiryDate > now;
      const remainingDays = isActive 
        ? Math.ceil((subscription.expiryDate - now) / (1000 * 60 * 60 * 24))
        : 0;
      
      const isExpired = subscription.status === 'expired' || 
                        (subscription.status === 'active' && subscription.expiryDate <= now);
      
      // Build comprehensive response
      return {
        subscription: subscription.toObject(),
        calculatedFields: {
          isCurrentlyActive: isActive,
          remainingDays: remainingDays,
          isPastDue: subscription.expiryDate < now && subscription.status === 'active',
          isCancelled: subscription.status === 'cancelled',
          isExpired: isExpired,
          isPending: subscription.status === 'pending',
          daysSinceCreation: Math.floor((now - subscription.createdAt) / (1000 * 60 * 60 * 24)),
          daysSinceExpiry: subscription.expiryDate < now 
            ? Math.floor((now - subscription.expiryDate) / (1000 * 60 * 60 * 24))
            : 0
        },
        userInfo: {
          id: subscription.user?._id,
          email: subscription.user?.email,
          fullName: subscription.user?.firstName && subscription.user?.lastName 
            ? `${subscription.user.firstName} ${subscription.user.lastName}`
            : 'N/A'
        },
        packageInfo: {
          id: subscription.package?._id,
          name: subscription.package?.name,
          price: subscription.package?.price,
          duration: subscription.package?.durationInDays
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user's latest subscription (modified version)
  async getUserSubscription(userId) {
    try {
      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Please provide a valid user ID');
      }

      // Check if user exists
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        throw new Error('User not found. Please check the user ID');
      }

      // Get user info to check current subscription
      const user = await User.findById(userId);
      
      // Find the latest subscription (most recent one)
      const latestSubscription = await Subscription.findOne({ 
        user: userId 
      })
      .populate('package')
      .sort({ createdAt: -1 }); // Get the most recent subscription

      // If no subscription found at all
      if (!latestSubscription) {
        return {
          isFreeMode: true,
          message: 'User is in free mode (no subscription history)',
          subscriptionStatus: 'free',
          userId: userId,
          userEmail: user.email,
          profileKey: user.profileKey
        };
      }

      // Check if this is the current subscription
      const isCurrent = user.currentSubscription && 
                        user.currentSubscription.toString() === latestSubscription._id.toString();

      return {
        isFreeMode: latestSubscription.status !== 'active' || !latestSubscription.isActive(),
        isCurrentSubscription: isCurrent,
        subscription: {
          id: latestSubscription._id,
          isActive: latestSubscription.isActive(),
          status: latestSubscription.status,
          startDate: latestSubscription.startDate,
          expiryDate: latestSubscription.expiryDate,
          remainingDays: latestSubscription.getRemainingDays(),
          package: latestSubscription.package,
          paymentMethod: latestSubscription.paymentMethod,
          amountPaid: latestSubscription.amountPaid,
          transactionId: latestSubscription.transactionId,
          cancelledAt: latestSubscription.cancelledAt,
          createdAt: latestSubscription.createdAt,
          updatedAt: latestSubscription.updatedAt
        },
        packageDetails: latestSubscription.package,
        subscriptionStatus: latestSubscription.status,
        isCancelled: latestSubscription.status === 'cancelled',
        isExpired: latestSubscription.status === 'expired',
        isPending: latestSubscription.status === 'pending',
        userId: userId,
        userEmail: user.email,
        profileKey: user.profileKey
      };
    } catch (error) {
      if (error.message.includes('Please provide') || error.message.includes('User not found')) {
        throw error;
      }
      throw new Error(`Error fetching user subscription: ${error.message}`);
    }
  }

  // Get all subscriptions (with pagination)
  async getAllSubscriptions(page = 1, limit = 10, filter = {}) {
    const skip = (page - 1) * limit;
    
    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate('user', 'email profileKey')
        .populate('package', 'name duration price')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Subscription.countDocuments(filter)
    ]);

    return {
      subscriptions,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  // Cancel subscription AND update user document
  async cancelSubscription(id, userId = null) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const subscription = await Subscription.findById(id).session(session);
      
      if (!subscription) {
        await session.abortTransaction();
        throw new Error('Subscription not found');
      }

      // Check ownership if userId is provided
      if (userId && subscription.user.toString() !== userId.toString()) {
        await session.abortTransaction();
        throw new Error('You do not have permission to cancel this subscription');
      }

      // Check if subscription is already cancelled
      if (subscription.status === 'cancelled') {
        await session.abortTransaction();
        throw new Error('Subscription is already cancelled');
      }

      // Update subscription document
      subscription.status = 'cancelled';
      subscription.updatedAt = Date.now();
      
      if (subscription.schema.path('cancelledAt')) {
        subscription.cancelledAt = Date.now();
      }
      
      await subscription.save({ session });

      // Update user document
      const user = await User.findById(subscription.user).session(session);
      
      if (!user) {
        await session.abortTransaction();
        throw new Error(`User not found for subscription ${id}`);
      }

      // Clear current subscription if this is the current one
      if (user.currentSubscription && user.currentSubscription.toString() === id.toString()) {
        user.currentSubscription = null;
        user.subscriptionStatus = 'free';
      }
      
      user.updatedAt = Date.now();
      await user.save({ session });

      // Commit transaction
      await session.commitTransaction();
      
      console.log(`✓ Subscription ${id} cancelled successfully`);
      console.log(`✓ User ${user._id} status: ${user.subscriptionStatus}`);
      console.log(`✓ User currentSubscription: ${user.currentSubscription}`);

      return subscription;
      
    } catch (error) {
      await session.abortTransaction();
      console.error(`✗ Error cancelling subscription:`, error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Update subscription status AND update user document
  async updateSubscriptionStatus(id, status) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const updateData = {
        status,
        updatedAt: Date.now()
      };

      if (status === 'cancelled') {
        updateData.cancelledAt = Date.now();
      }

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        id,
        updateData,
        { new: true, session }
      );

      if (!updatedSubscription) {
        await session.abortTransaction();
        throw new Error('Subscription not found');
      }

      // Update user document based on status
      const user = await User.findById(updatedSubscription.user).session(session);
      
      if (!user) {
        await session.abortTransaction();
        throw new Error(`User not found for subscription ${id}`);
      }

      // Update current subscription status
      if (status === 'cancelled' || status === 'expired') {
        // Only clear if this is the current subscription
        if (user.currentSubscription && user.currentSubscription.toString() === id.toString()) {
          user.currentSubscription = null;
          user.subscriptionStatus = 'free';
        }
      } else if (status === 'active') {
        user.currentSubscription = updatedSubscription._id;
        user.subscriptionStatus = 'active';
      } else if (status === 'pending') {
        user.subscriptionStatus = 'pending';
      }
      
      user.updatedAt = Date.now();
      await user.save({ session });

      await session.commitTransaction();
      
      console.log(`✓ Subscription ${id} status: ${status}`);
      console.log(`✓ User ${user._id} status: ${user.subscriptionStatus}`);

      return updatedSubscription;
      
    } catch (error) {
      await session.abortTransaction();
      console.error(`✗ Error updating subscription status:`, error.message);
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Get expiring subscriptions
  async getExpiringSubscriptions(days = 7) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const expiringSubscriptions = await Subscription.find({
      status: 'active',
      expiryDate: { $lte: date, $gte: new Date() }
    })
    .populate('user', 'email')
    .populate('package', 'name');

    // Update subscriptions and users properly
    for (const subscription of expiringSubscriptions) {
      const expiryDate = new Date(subscription.expiryDate);
      const today = new Date();
      
      if (expiryDate <= today) {
        const session = await mongoose.startSession();
        session.startTransaction();
        
        try {
          // Update subscription status
          await Subscription.findByIdAndUpdate(
            subscription._id, 
            { status: 'expired', updatedAt: Date.now() },
            { session }
          );

          // Update user document
          const user = await User.findById(subscription.user).session(session);
          if (user) {
            // Only update if this is the current subscription
            if (user.currentSubscription && 
                user.currentSubscription.toString() === subscription._id.toString()) {
              user.currentSubscription = null;
              user.subscriptionStatus = 'free';
            }
            
            await user.save({ session });
          }
          
          await session.commitTransaction();
        } catch (error) {
          await session.abortTransaction();
          console.error(`Error expiring subscription ${subscription._id}:`, error);
        } finally {
          session.endSession();
        }
      }
    }

    return expiringSubscriptions;
  }

  // Verify subscription and user status are in sync
  async verifySubscriptionStatus(subscriptionId) {
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const user = await User.findById(subscription.user);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      subscription: {
        id: subscription._id,
        status: subscription.status,
        isActive: subscription.isActive ? subscription.isActive() : false
      },
      user: {
        id: user._id,
        subscriptionStatus: user.subscriptionStatus,
        currentSubscription: user.currentSubscription,
        hasActiveSubscription: user.subscriptionStatus === 'active'
      },
      statusMatch: (
        (subscription.status === 'active' && user.subscriptionStatus === 'active') ||
        (subscription.status === 'cancelled' && user.subscriptionStatus === 'free') ||
        (subscription.status === 'expired' && user.subscriptionStatus === 'free')
      )
    };
  }

  // Get user subscription history (from Subscription collection)
  async getUserSubscriptionHistory(userId) {
    try {
      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Please provide a valid user ID');
      }

      // Check if user exists
      const userExists = await User.exists({ _id: userId });
      if (!userExists) {
        throw new Error('User not found. Please check the user ID');
      }

      const subscriptions = await Subscription.find({ user: userId })
        .populate('package', 'name description')
        .sort({ createdAt: -1 });

      return {
        userId: userId,
        total: subscriptions.length,
        hasSubscriptions: subscriptions.length > 0,
        subscriptions: subscriptions.map(sub => ({
          id: sub._id,
          status: sub.status,
          startDate: sub.startDate,
          expiryDate: sub.expiryDate,
          package: sub.package,
          paymentMethod: sub.paymentMethod,
          amountPaid: sub.amountPaid,
          transactionId: sub.transactionId,
          isActive: sub.isActive(),
          remainingDays: sub.getRemainingDays(),
          createdAt: sub.createdAt,
          updatedAt: sub.updatedAt
        })),
        statusSummary: {
          active: subscriptions.filter(sub => sub.status === 'active').length,
          cancelled: subscriptions.filter(sub => sub.status === 'cancelled').length,
          expired: subscriptions.filter(sub => sub.status === 'expired').length,
          pending: subscriptions.filter(sub => sub.status === 'pending').length
        }
      };
    } catch (error) {
      if (error.message.includes('Please provide') || error.message.includes('User not found')) {
        throw error;
      }
      throw new Error(`Error fetching subscription history: ${error.message}`);
    }
  }

  // Check user subscription status
  async checkUserSubscription(userId) {
    try {
      // Validate userId
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Please provide a valid user ID');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found. Please check the user ID');
      }

      const activeSubscription = await Subscription.findOne({
        user: userId,
        status: 'active',
        expiryDate: { $gt: new Date() }
      });

      return {
        userId: userId,
        subscriptionStatus: user.subscriptionStatus,
        currentSubscription: user.currentSubscription,
        isPaidUser: user.isPaidUser(),
        hasActiveSubscription: !!activeSubscription,
        activeSubscription: activeSubscription,
        userExists: true
      };
    } catch (error) {
      if (error.message.includes('Please provide') || error.message.includes('User not found')) {
        throw error;
      }
      throw new Error(`Error checking user subscription: ${error.message}`);
    }
  }

  // Get subscription by transaction ID
  async getSubscriptionByTransactionId(transactionId) {
    return await Subscription.findOne({ transactionId })
      .populate('user', 'email')
      .populate('package', 'name duration price');
  }

  // Renew subscription (without payment processing)
  async renewSubscription(subscriptionId) {
    const oldSubscription = await Subscription.findById(subscriptionId);
    if (!oldSubscription) {
      throw new Error('Subscription not found');
    }

    const packageDoc = await Package.findById(oldSubscription.package);
    if (!packageDoc) {
      throw new Error('Package not found');
    }

    // Calculate new expiry date
    const newExpiryDate = new Date(oldSubscription.expiryDate);
    newExpiryDate.setDate(newExpiryDate.getDate() + packageDoc.durationInDays);

    // Create new subscription record (payment details will be added by payment service)
    const renewedSubscription = new Subscription({
      user: oldSubscription.user,
      package: oldSubscription.package,
      packagePrice: packageDoc.price,
      status: 'pending', // Will be updated to active after payment
      startDate: oldSubscription.expiryDate,
      expiryDate: newExpiryDate
    });

    return renewedSubscription;
  }
}

module.exports = new SubscriptionService();