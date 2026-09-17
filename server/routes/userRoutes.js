const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateUser, deleteUser, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// User self-profile updates
router.put('/profile', protect, updateProfile);

// All user management routes are admin-only
router.get('/', protect, authorize('admin'), getUsers);
router.get('/:id', protect, authorize('admin'), getUserById);
router.put('/:id', protect, authorize('admin'), updateUser);
router.delete('/:id', protect, authorize('admin'), deleteUser);

module.exports = router;
