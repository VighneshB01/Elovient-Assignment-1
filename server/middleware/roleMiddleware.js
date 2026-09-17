// Role-based access control middleware.
// Must always be used AFTER the protect middleware (which populates req.user).
//
// Usage: router.get('/admin-only', protect, authorize('admin'), controller)
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Role '${req.user.role}' is not authorized to access this route`);
    }
    next();
  };
};

module.exports = { authorize };
