const db = require('../config/db');

const ProductModel = {
  async getAll() {
    const productsRes = await db.query('SELECT * FROM products ORDER BY id ASC');
    const variantsRes = await db.query('SELECT * FROM product_variants ORDER BY id ASC');

    const variantsByProduct = {};
    for (const v of variantsRes.rows) {
      if (!variantsByProduct[v.product_id]) {
        variantsByProduct[v.product_id] = [];
      }
      variantsByProduct[v.product_id].push(v);
    }

    return productsRes.rows.map(p => ({
      ...p,
      sales_price: parseFloat(p.sales_price),
      cost_price: parseFloat(p.cost_price || 0),
      variants: variantsByProduct[p.id] || []
    }));
  },

  async findById(id) {
    const res = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const product = res.rows[0];
    const variantsRes = await db.query('SELECT * FROM product_variants WHERE product_id = $1', [id]);
    return {
      ...product,
      sales_price: parseFloat(product.sales_price),
      cost_price: parseFloat(product.cost_price || 0),
      variants: variantsRes.rows.map(v => ({
        ...v,
        price_modifier: parseFloat(v.price_modifier)
      }))
    };
  },

  async create({ name, type = 'software', sales_price, cost_price = 0, variant_metadata = '{}', notes = '' }) {
    const res = await db.query(
      `INSERT INTO products (name, type, sales_price, cost_price, variant_metadata, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, type, sales_price, cost_price, typeof variant_metadata === 'object' ? JSON.stringify(variant_metadata) : variant_metadata, notes]
    );
    const newId = res.lastID;
    return this.findById(newId);
  },

  async addVariant(productId, { attribute_name = 'brand', attribute_value, price_modifier = 0, brand = null }) {
    // Support { brand: 'Odoo', price_modifier: 560 } as requested in specs and postman
    const attrName = brand ? 'brand' : attribute_name;
    const attrVal = brand || attribute_value;
    
    // Automatic +560 adjustment for Odoo brand if price_modifier not explicitly given
    let modifier = parseFloat(price_modifier || 0);
    if (attrVal && attrVal.toLowerCase() === 'odoo' && modifier === 0) {
      modifier = 560.00;
    }

    const res = await db.query(
      `INSERT INTO product_variants (product_id, attribute_name, attribute_value, price_modifier)
       VALUES ($1, $2, $3, $4)`,
      [productId, attrName, attrVal, modifier]
    );
    return {
      id: res.lastID,
      product_id: productId,
      attribute_name: attrName,
      attribute_value: attrVal,
      price_modifier: modifier
    };
  },

  /**
   * Calculates effective price for a product with an optional variant
   */
  async calculatePrice(productId, variantId = null) {
    const product = await this.findById(productId);
    if (!product) return 0;

    let total = product.sales_price;
    if (variantId) {
      const variant = product.variants.find(v => v.id === parseInt(variantId));
      if (variant) {
        total += variant.price_modifier;
      }
    }
    return total;
  }
};

module.exports = ProductModel;
