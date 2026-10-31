const ProductModel = require('../models/product.model');
const PlanModel = require('../models/plan.model');

const ProductController = {
  /**
   * Get full product catalog with variants
   */
  async getProducts(req, res) {
    try {
      const products = await ProductModel.getAll();
      return res.status(200).json({ success: true, products });
    } catch (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Get single product details
   */
  async getProductById(req, res) {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.status(200).json({ success: true, product });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin: Create product
   */
  async createProduct(req, res) {
    try {
      const { name, type, sales_price, cost_price, variant_metadata, notes } = req.body;
      if (!name || sales_price === undefined) {
        return res.status(400).json({ success: false, message: 'Product name and sales price are required' });
      }

      const product = await ProductModel.create({
        name,
        type: type || 'software',
        sales_price: parseFloat(sales_price),
        cost_price: parseFloat(cost_price || 0),
        variant_metadata: variant_metadata || {},
        notes: notes || ''
      });

      return res.status(201).json({ success: true, message: 'Product created successfully', product });
    } catch (err) {
      console.error('Error creating product:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin: Add variant to product (e.g. Odoo brand +560)
   */
  async addVariant(req, res) {
    try {
      const productId = parseInt(req.params.id);
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const { brand, attribute_name, attribute_value, price_modifier } = req.body;
      const variant = await ProductModel.addVariant(productId, {
        brand,
        attribute_name,
        attribute_value,
        price_modifier
      });

      return res.status(201).json({ success: true, message: 'Variant added successfully', variant });
    } catch (err) {
      console.error('Error adding variant:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * Admin: Add recurring plan to product
   */
  async addPlan(req, res) {
    try {
      const productId = parseInt(req.params.id);
      const product = await ProductModel.findById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }

      const { name, billing_frequency, price, min_quantity, start_date, end_date, auto_close, allow_pause } = req.body;

      if (!billing_frequency) {
        return res.status(400).json({ success: false, message: 'Billing frequency (daily, weekly, monthly, yearly) is required' });
      }

      const plan = await PlanModel.create(productId, {
        name,
        billing_frequency,
        price,
        min_quantity: min_quantity !== undefined ? parseInt(min_quantity) : 1,
        start_date,
        end_date,
        auto_close: Boolean(auto_close),
        allow_pause: allow_pause !== undefined ? Boolean(allow_pause) : true
      });

      return res.status(201).json({ success: true, message: 'Plan added successfully', plan });
    } catch (err) {
      console.error('Error adding plan:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  /**
   * List all plans
   */
  async getPlans(req, res) {
    try {
      const plans = await PlanModel.getAll();
      return res.status(200).json({ success: true, plans });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = ProductController;
