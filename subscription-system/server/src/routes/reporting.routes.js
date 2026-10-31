const express = require('express');
const router = express.Router();
const ReportingController = require('../controllers/reporting.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireStaff } = require('../middleware/rbac.middleware');

// Financial dashboard metrics (<2s response SLA)
router.get('/dashboard', authenticateToken, requireStaff, ReportingController.getDashboardMetrics);

module.exports = router;
