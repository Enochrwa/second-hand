const express = require('express');
const router = express.Router();

const {
  generateItemsInventoryReport,
  generateItemsByCategoryReport,
  getReports,
  getReportById, // Added getReportById
  updateReport
} = require('../controllers/reportController');

const { protect, authorize } = require('../middleware/auth');

// Protect all routes
router.use(protect);
router.use(authorize('admin'));

// Report routes
router.get('/items-inventory', generateItemsInventoryReport);
router.get('/items-by-category', generateItemsByCategoryReport);

// Routes for user-generated reports
router.get('/', getReports); // Route for getting all reports
router.get('/:id', getReportById); // Route for getting a single report by ID
router.put('/:id', updateReport); // Route for updating a report

module.exports = router;
