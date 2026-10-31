import React, { useState, useEffect } from 'react';
import { productService } from '../../api/productService';
import { Modal, StatusBadge } from '../../components/common/UIComponents';
import { Package, Plus, Layers, Tag, Check, Sparkles } from 'lucide-react';

export const ProductCatalogView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: '',
    type: 'software',
    sales_price: '',
    cost_price: '',
    notes: ''
  });

  // New variant form
  const [newVariant, setNewVariant] = useState({
    brand: 'Odoo',
    attribute_name: 'brand',
    attribute_value: 'Odoo',
    price_modifier: 560
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts();
      if (res.success) {
        setProducts(res.products);
      }
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await productService.createProduct(newProduct);
      if (res.success) {
        setIsAddProductOpen(false);
        setNewProduct({ name: '', type: 'software', sales_price: '', cost_price: '', notes: '' });
        loadProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await productService.addVariant(selectedProduct.id, newVariant);
      if (res.success) {
        setIsAddVariantOpen(false);
        loadProducts();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding variant');
    }
  };

  return (
    <div style={{ padding: '0 1rem 2rem 1rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Product & Variant Catalog</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Configure software products, add-ons, and pricing modifiers (e.g. Odoo brand +$560)
          </p>
        </div>
        <button
          onClick={() => setIsAddProductOpen(true)}
          className="btn btn-primary"
        >
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: '#94a3b8' }}>Loading catalog...</div>
      ) : products.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <Package size={48} color="#6366f1" style={{ margin: '0 auto 1rem auto' }} />
          <h3>No products in catalog</h3>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Get started by adding your first product.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {products.map((product) => (
            <div key={product.id} className="glass-panel glass-card-interactive" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#818cf8'
                    }}>
                      <Package size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>{product.name}</h3>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {product.type}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                      ${product.sales_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Cost: ${product.cost_price?.toFixed(2)}
                    </div>
                  </div>
                </div>

                {product.notes && (
                  <p style={{ fontSize: '0.8125rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
                    {product.notes}
                  </p>
                )}

                {/* Variants List */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Brand & Feature Variants
                    </span>
                    <button
                      onClick={() => {
                        setSelectedProduct(product);
                        setIsAddVariantOpen(true);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#818cf8',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Plus size={14} /> Add Variant
                    </button>
                  </div>

                  {product.variants && product.variants.length > 0 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {product.variants.map((v) => (
                        <div
                          key={v.id}
                          style={{
                            padding: '0.3rem 0.6rem',
                            borderRadius: '0.375rem',
                            backgroundColor: v.attribute_value === 'Odoo' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                            border: v.attribute_value === 'Odoo' ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem'
                          }}
                        >
                          <span style={{ color: '#cbd5e1', fontWeight: 600 }}>{v.attribute_value}</span>
                          <span style={{ color: v.price_modifier > 0 ? '#34d399' : '#94a3b8', fontWeight: 700 }}>
                            {v.price_modifier > 0 ? `+$${v.price_modifier}` : '+$0'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                      No variants added yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Product */}
      <Modal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        title="Add New Product"
      >
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Product Name
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. ERP Cloud Suite"
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Type
              </label>
              <select
                className="form-input"
                value={newProduct.type}
                onChange={(e) => setNewProduct({ ...newProduct, type: e.target.value })}
              >
                <option value="software">Software</option>
                <option value="add-on">Add-on</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                Sales Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                className="form-input"
                placeholder="1000.00"
                value={newProduct.sales_price}
                onChange={(e) => setNewProduct({ ...newProduct, sales_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Cost Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              className="form-input"
              placeholder="200.00"
              value={newProduct.cost_price}
              onChange={(e) => setNewProduct({ ...newProduct, cost_price: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Notes / Description
            </label>
            <textarea
              rows={3}
              className="form-input"
              placeholder="Details about product tier, inclusions..."
              value={newProduct.notes}
              onChange={(e) => setNewProduct({ ...newProduct, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddProductOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Product
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Variant (with +560 Odoo support) */}
      <Modal
        isOpen={isAddVariantOpen}
        onClose={() => setIsAddVariantOpen(false)}
        title={`Add Variant to ${selectedProduct?.name || 'Product'}`}
      >
        <form onSubmit={handleAddVariant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Attribute Type
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. brand, tier, edition"
              value={newVariant.attribute_name}
              onChange={(e) => setNewVariant({ ...newVariant, attribute_name: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Attribute Value / Brand
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Odoo"
              value={newVariant.attribute_value}
              onChange={(e) => {
                const val = e.target.value;
                const isOdoo = val.toLowerCase() === 'odoo';
                setNewVariant({
                  ...newVariant,
                  attribute_value: val,
                  brand: val,
                  price_modifier: isOdoo ? 560 : newVariant.price_modifier
                });
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Price Modifier ($)
            </label>
            <input
              type="number"
              step="0.01"
              required
              className="form-input"
              placeholder="560.00"
              value={newVariant.price_modifier}
              onChange={(e) => setNewVariant({ ...newVariant, price_modifier: parseFloat(e.target.value) || 0 })}
            />
            <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
              Choosing the Odoo brand adds +$560.00 to the product base sales price.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddVariantOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Variant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
