const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/product.routes');
const quoteRoutes = require('./routes/quote.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const invoiceRoutes = require('./routes/invoice.routes');
const discountRoutes = require('./routes/discount.routes');
const reportingRoutes = require('./routes/reporting.routes');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request performance logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (duration > 500) {
      console.warn(`[Slow Request Warning] ${req.method} ${req.originalUrl} took ${duration}ms`);
    }
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString(), platform: 'Brightloop Subscription Core' });
});

// Mount routes under /api
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/reports', reportingRoutes);

// Also mount routes without /api prefix for 100% Postman compatibility (where base_url may omit /api)
app.use('/auth', authRoutes);
app.use('/products', productRoutes);
app.use('/quotes', quoteRoutes);
app.use('/subscriptions', subscriptionRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/discounts', discountRoutes);
app.use('/reports', reportingRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
