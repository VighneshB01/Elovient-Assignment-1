const express = require('express');
const router = express.Router();
const { getAnalytics, getMyStats } = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// Admin-wide analytics
router.get('/', protect, authorize('admin'), getAnalytics);
// Personal stats for any logged-in user
router.get('/me', protect, getMyStats);

module.exports = router;
