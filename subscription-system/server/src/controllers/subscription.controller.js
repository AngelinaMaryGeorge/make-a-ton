const SubscriptionModel = require('../models/subscription.model');

const SubscriptionController = {
  /**
   * Get all subscriptions (Admin & Staff)
   */
  async getSubscriptions(req, res) {
    try {
      const { status, customer_id } = req.query;
      const subscriptions = await SubscriptionModel.getAll({ status, customer_id });
      return res.status(200).json({ success: true, subscriptions });
    } catch (err) {
      console.error('Error getting subscriptions:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Customer Portal: Get subscriptions for authenticated customer
   */
  async getMySubscriptions(req, res) {
    try {
      const customerId = req.user.id;
      const subscriptions = await SubscriptionModel.getAll({ customer_id: customerId });
      return res.status(200).json({ success: true, subscriptions });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single subscription by ID
   */
  async getSubscriptionById(req, res) {
    try {
      const sub = await SubscriptionModel.findById(req.params.id);
      if (!sub) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      // Customer can only view their own
      if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      return res.status(200).json({ success: true, subscription: sub });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Create new subscription (Admin/Staff for customer, or Customer for self)
   */
  async createSubscription(req, res) {
    try {
      const isCustomer = req.user.role === 'customer';
      const customer_id = isCustomer ? req.user.id : (req.body.customer_id || req.user.id);
      const { plan_id, status = isCustomer ? 'Active' : 'Draft', start_date, expiry_date, payment_terms = 'Net 30', notes, items } = req.body;
      const effectiveStartDate = start_date || new Date().toISOString().split('T')[0];

      if (!customer_id || !plan_id) {
        return res.status(400).json({ success: false, message: 'Customer and Plan are required' });
      }

      const subscription = await SubscriptionModel.create({
        customer_id,
        plan_id,
        status,
        start_date: effectiveStartDate,
        expiry_date,
        payment_terms,
        notes,
        items: items || []
      });

      return res.status(201).json({ success: true, message: 'Subscription created', subscription });
    } catch (err) {
      console.error('Error creating subscription:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Update subscription status (Draft -> Quotation -> Confirmed -> Active -> Paused -> Closed)
   * Supports actions: pause, resume, close early, renew
   */
  async updateStatus(req, res) {
    try {
      const subId = parseInt(req.params.id);
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required' });
      }

      // Check permission if customer: customer can only request pause or close if permitted
      if (req.user.role === 'customer') {
        const existing = await SubscriptionModel.findById(subId);
        if (!existing || existing.customer_id !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Access denied' });
        }
        if (!['Paused', 'Closed', 'Active'].includes(status)) {
          return res.status(403).json({ success: false, message: 'Customers can only pause, resume, or close their subscriptions' });
        }
        if (status === 'Paused' && !existing.allow_pause) {
          return res.status(400).json({ success: false, message: 'This subscription plan does not allow pausing' });
        }
      }

      await SubscriptionModel.updateStatus(subId, status);
      const updated = await SubscriptionModel.findById(subId);
      return res.status(200).json({ success: true, message: `Status updated to ${status}`, subscription: updated });
    } catch (err) {
      console.error('Error updating status:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Renew Subscription
   */
  async renewSubscription(req, res) {
    try {
      const subId = parseInt(req.params.id);
      const sub = await SubscriptionModel.findById(subId);
      if (!sub) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      // Customer can only renew their own
      if (req.user.role === 'customer' && sub.customer_id !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // Extend expiry date by 1 year
      const currentExpiry = sub.expiry_date ? new Date(sub.expiry_date) : new Date();
      currentExpiry.setFullYear(currentExpiry.getFullYear() + 1);
      const newExpiryStr = currentExpiry.toISOString().split('T')[0];

      await SubscriptionModel.updateStatus(subId, 'Active');
      await require('../config/db').query(
        'UPDATE subscriptions SET expiry_date = $1 WHERE id = $2',
        [newExpiryStr, subId]
      );

      const updated = await SubscriptionModel.findById(subId);
      return res.status(200).json({ success: true, message: 'Subscription renewed successfully for another year', subscription: updated });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = SubscriptionController;
