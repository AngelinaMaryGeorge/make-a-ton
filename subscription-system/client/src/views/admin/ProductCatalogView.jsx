import React, { useState, useEffect } from 'react';
import { productService } from '../../api/productService';
import { Modal, LoadingBlock, EmptyState } from '../../components/common/UIComponents';
import { Package, Plus } from 'lucide-react';

export const ProductCatalogView = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddVariantOpen, setIsAddVariantOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [newProduct, setNewProduct] = useState({
    name: '', type: 'software', sales_price: '', cost_price: '', notes: ''
  });

  const [newVariant, setNewVariant] = useState({
    brand: 'Odoo', attribute_name: 'brand', attribute_value: 'Odoo', price_modifier: 560
  });

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts();
      if (res.success) setProducts(res.products);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadProducts(); }, []);

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
      if (res.success) { setIsAddVariantOpen(false); loadProducts(); }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding variant');
    }
  };

  const LABEL_STYLE = {
    display: 'block', fontSize: '0.8125rem', fontWeight: 600,
    color: '#cbd5e1', marginBottom: '0.4rem'
  };

  return (
    <div style={{ padding: '0 1rem 2rem 0.25rem' }}>

      {/* Header */}
      <div className="page-header animate-fade-in-up">
        <div>
          <h1 className="page-title">Product &amp; Variant Catalog</h1>
          <p className="page-subtitle">
            Software products, add-ons, and pricing modifiers (e.g. Odoo brand +$560)
          </p>
        </div>
        <button onClick={() => setIsAddProductOpen(true)} className="btn btn-primary">
          <Plus size={16} /><span>Add Product</span>
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <LoadingBlock message="Loading product catalog..." />
      ) : products.length === 0 ? (
        <div className="glass-panel">
          <EmptyState
            icon={Package}
            title="No products in catalog"
            description="Get started by adding your first product."
            action={
              <button onClick={() => setIsAddProductOpen(true)} className="btn btn-primary">
                <Plus size={15} /> Add First Product
              </button>
            }
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.1rem' }}>
          {products.map((product, idx) => (
            <div
              key={product.id}
              className="glass-panel glass-card-interactive animate-fade-in-up"
              style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animationDelay: `${idx * 0.05}s` }}
            >
              {/* Product Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '11px',
                    background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8',
                    flexShrink: 0
                  }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>{product.name}</h3>
                    <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 700 }}>
                      {product.type}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#38bdf8' }}>
                    ${product.sales_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                    Cost: ${product.cost_price?.toFixed(2)}
                  </div>
                </div>
              </div>

              {product.notes && (
                <p style={{ fontSize: '0.8125rem', color: '#94a3b8', lineHeight: 1.55 }}>{product.notes}</p>
              )}

              {/* Variants */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Variants
                  </span>
                  <button
                    onClick={() => { setSelectedProduct(product); setIsAddVariantOpen(true); }}
                    style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  >
                    <Plus size={12} /> Add
                  </button>
                </div>
                {product.variants?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {product.variants.map(v => (
                      <div
                        key={v.id}
                        style={{
                          padding: '0.28rem 0.65rem',
                          borderRadius: '0.375rem',
                          background: v.attribute_value === 'Odoo' ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.05)',
                          border: v.attribute_value === 'Odoo' ? '1px solid rgba(99,102,241,0.38)' : '1px solid rgba(255,255,255,0.08)',
                          fontSize: '0.75rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{v.attribute_value}</span>
                        <span style={{ color: v.price_modifier > 0 ? '#34d399' : '#64748b', fontWeight: 700 }}>
                          {v.price_modifier > 0 ? `+$${v.price_modifier}` : '+$0'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.75rem', color: '#475569', fontStyle: 'italic' }}>No variants added yet.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Add Product */}
      <Modal isOpen={isAddProductOpen} onClose={() => setIsAddProductOpen(false)} title="Add New Product">
        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={LABEL_STYLE}>Product Name</label>
            <input type="text" required className="form-input" placeholder="e.g. ERP Cloud Suite"
              value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={LABEL_STYLE}>Type</label>
              <select className="form-input" value={newProduct.type} onChange={e => setNewProduct({ ...newProduct, type: e.target.value })}>
                <option value="software">Software</option>
                <option value="add-on">Add-on</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div>
              <label style={LABEL_STYLE}>Sales Price ($)</label>
              <input type="number" step="0.01" required className="form-input" placeholder="1000.00"
                value={newProduct.sales_price} onChange={e => setNewProduct({ ...newProduct, sales_price: e.target.value })} />
            </div>
          </div>
          <div>
            <label style={LABEL_STYLE}>Cost Price ($)</label>
            <input type="number" step="0.01" className="form-input" placeholder="200.00"
              value={newProduct.cost_price} onChange={e => setNewProduct({ ...newProduct, cost_price: e.target.value })} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Notes / Description</label>
            <textarea rows={3} className="form-input" placeholder="Product tier, inclusions..."
              value={newProduct.notes} onChange={e => setNewProduct({ ...newProduct, notes: e.target.value })} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddProductOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Variant */}
      <Modal isOpen={isAddVariantOpen} onClose={() => setIsAddVariantOpen(false)} title={`Add Variant — ${selectedProduct?.name || ''}`}>
        <form onSubmit={handleAddVariant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={LABEL_STYLE}>Attribute Type</label>
            <input type="text" required className="form-input" placeholder="e.g. brand, tier, edition"
              value={newVariant.attribute_name} onChange={e => setNewVariant({ ...newVariant, attribute_name: e.target.value })} />
          </div>
          <div>
            <label style={LABEL_STYLE}>Attribute Value / Brand</label>
            <input type="text" required className="form-input" placeholder="e.g. Odoo"
              value={newVariant.attribute_value}
              onChange={e => {
                const val = e.target.value;
                setNewVariant({
                  ...newVariant, attribute_value: val, brand: val,
                  price_modifier: val.toLowerCase() === 'odoo' ? 560 : newVariant.price_modifier
                });
              }}
            />
          </div>
          <div>
            <label style={LABEL_STYLE}>Price Modifier ($)</label>
            <input type="number" step="0.01" required className="form-input" placeholder="560.00"
              value={newVariant.price_modifier} onChange={e => setNewVariant({ ...newVariant, price_modifier: parseFloat(e.target.value) || 0 })} />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.3rem' }}>
              Odoo brand adds +$560.00 to the product base sales price.
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddVariantOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Variant</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
