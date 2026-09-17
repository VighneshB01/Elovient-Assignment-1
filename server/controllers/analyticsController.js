const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Task = require('../models/Task');

// Math helper to calculate MoM trend percentage
const calculateTrend = (thisMonth, total) => {
  const previousTotal = total - thisMonth;
  if (previousTotal === 0) return thisMonth > 0 ? '+100%' : '0%';
  const increase = (thisMonth / previousTotal) * 100;
  return increase > 0 ? `+${increase.toFixed(1)}%` : `${increase.toFixed(1)}%`;
};

/**
 * @desc    Get dashboard analytics stats
 * @route   GET /api/analytics
 * @access  Private/Admin
 *
 * Returns: total users, tasks by status, monthly task creation trend
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: 'done' });
  const inProgressTasks = await Task.countDocuments({ status: 'in-progress' });
  const todoTasks = await Task.countDocuments({ status: 'todo' });

  // Month boundary for trend calculations (30 days ago)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Growth metrics (created in the last 30 days)
  const usersThisMonth = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const tasksThisMonth = await Task.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });
  const completedThisMonth = await Task.countDocuments({ status: 'done', updatedAt: { $gte: thirtyDaysAgo } });

  const trends = {
    users: calculateTrend(usersThisMonth, totalUsers),
    tasks: calculateTrend(tasksThisMonth, totalTasks),
    completed: calculateTrend(completedThisMonth, completedTasks),
  };

  // Monthly task creation for the last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyTasks = await Task.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Monthly user registration for last 6 months
  const monthlyUsers = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  // Recent activity audit log
  const recentActivity = await Task.find()
    .sort({ updatedAt: -1 })
    .limit(5)
    .populate('createdBy', 'name avatar')
    .populate('assignedTo', 'name')
    .lean();

  res.json({
    success: true,
    data: {
      summary: { totalUsers, totalTasks, completedTasks, inProgressTasks, todoTasks, trends },
      monthlyTasks,
      monthlyUsers,
      recentActivity,
    },
  });
});

/**
 * @desc    Get personal stats for logged-in user
 * @route   GET /api/analytics/me
 * @access  Private
 */
const getMyStats = asyncHandler(async (req, res) => {
  const query = { $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }] };
  
  const total = await Task.countDocuments(query);
  const done = await Task.countDocuments({ ...query, status: 'done' });
  const inProgress = await Task.countDocuments({ ...query, status: 'in-progress' });
  const todo = await Task.countDocuments({ ...query, status: 'todo' });

  res.json({
    success: true,
    data: { total, done, inProgress, todo },
  });
});

module.exports = { getAnalytics, getMyStats };
