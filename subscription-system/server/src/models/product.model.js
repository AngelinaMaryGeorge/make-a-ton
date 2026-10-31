const db = require('../config/db');

function parseVariants(variantMetadata) {
  if (!variantMetadata) return [];
  let parsed = variantMetadata;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (e) {
      return [];
    }
  }
  if (Array.isArray(parsed)) {
    return parsed.map((v, idx) => ({
      id: idx + 1,
      attribute_name: 'brand',
      attribute_value: v.brand || v.attribute_value || 'Variant',
      price_modifier: parseFloat(v.price_modifier || 0)
    }));
  }
  if (typeof parsed === 'object') {
    return Object.entries(parsed).map(([key, val], idx) => ({
      id: idx + 1,
      attribute_name: 'brand',
      attribute_value: key,
      price_modifier: parseFloat(val.price_modifier || (key.toLowerCase() === 'odoo' ? 560 : 0))
    }));
  }
  return [];
}

const ProductModel = {
  async getAll() {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('products')
        .select('*')
        .order('id', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []).map(p => ({
        ...p,
        sales_price: parseFloat(p.sales_price),
        cost_price: parseFloat(p.cost_price || 0),
        variants: parseVariants(p.variant_metadata)
      }));
    }

    const res = await db.query('SELECT * FROM products ORDER BY id ASC');
    return res.rows.map(p => ({
      ...p,
      sales_price: parseFloat(p.sales_price),
      cost_price: parseFloat(p.cost_price || 0),
      variants: parseVariants(p.variant_metadata)
    }));
  },

  async findById(id) {
    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error || !data) return null;
      return {
        ...data,
        sales_price: parseFloat(data.sales_price),
        cost_price: parseFloat(data.cost_price || 0),
        variants: parseVariants(data.variant_metadata)
      };
    }

    const res = await db.query('SELECT * FROM products WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const p = res.rows[0];
    return {
      ...p,
      sales_price: parseFloat(p.sales_price),
      cost_price: parseFloat(p.cost_price || 0),
      variants: parseVariants(p.variant_metadata)
    };
  },

  async create({ name, type = 'software', sales_price, cost_price = 0, variant_metadata = [], notes = '' }) {
    const defaultVariants = Array.isArray(variant_metadata) ? variant_metadata : [];

    if (db.isSupabase()) {
      const { data, error } = await db.getSupabase()
        .from('products')
        .insert([{
          name,
          type,
          sales_price: parseFloat(sales_price),
          cost_price: parseFloat(cost_price || 0),
          variant_metadata: defaultVariants,
          notes
        }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return {
        ...data,
        sales_price: parseFloat(data.sales_price),
        cost_price: parseFloat(data.cost_price || 0),
        variants: parseVariants(data.variant_metadata)
      };
    }

    const res = await db.query(
      `INSERT INTO products (name, type, sales_price, cost_price, variant_metadata, notes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [name, type, sales_price, cost_price, JSON.stringify(defaultVariants), notes]
    );
    return this.findById(res.lastID);
  },

  async addVariant(productId, { brand, attribute_value, price_modifier }) {
    const product = await this.findById(productId);
    if (!product) throw new Error('Product not found');

    const brandName = brand || attribute_value || 'Odoo';
    let modifier = parseFloat(price_modifier || 0);
    if (brandName.toLowerCase() === 'odoo' && modifier === 0) {
      modifier = 560.00;
    }

    const currentVariants = parseVariants(product.variant_metadata);
    const updatedVariants = [
      ...currentVariants.map(v => ({ brand: v.attribute_value, price_modifier: v.price_modifier })),
      { brand: brandName, price_modifier: modifier }
    ];

    if (db.isSupabase()) {
      const { error } = await db.getSupabase()
        .from('products')
        .update({ variant_metadata: updatedVariants })
        .eq('id', productId);
      if (error) throw new Error(error.message);
    } else {
      await db.query(
        'UPDATE products SET variant_metadata = $1 WHERE id = $2',
        [JSON.stringify(updatedVariants), productId]
      );
    }

    return {
      product_id: productId,
      attribute_name: 'brand',
      attribute_value: brandName,
      price_modifier: modifier
    };
  },

  async calculatePrice(productId, variantNameOrId = null) {
    const product = await this.findById(productId);
    if (!product) return 0;
    let total = product.sales_price;
    if (variantNameOrId) {
      const variant = product.variants.find(v => 
        v.id === parseInt(variantNameOrId) || 
        v.attribute_value.toLowerCase() === String(variantNameOrId).toLowerCase()
      );
      if (variant) total += variant.price_modifier;
    }
    return total;
  }
};

module.exports = ProductModel;
