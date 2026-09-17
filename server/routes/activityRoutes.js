const express = require('express');
const router = express.Router();
const { logActivity, getStats, getSuspicious, replayCheck } = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, logActivity);
router.get('/stats', protect, getStats);
router.get('/suspicious', protect, getSuspicious);
router.post('/replay-check', protect, replayCheck);

module.exports = router;
