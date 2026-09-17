const asyncHandler = require('express-async-handler');
const ActivityLog = require('../models/ActivityLog');

// In-memory store for replay-check: key = `${userId}:${action}`, value = timestamp (ms)
const replayStore = new Map();

// Per-user serialization mutex: ensures concurrent requests from the same user are
// processed one at a time, making the rate-limit count+insert effectively atomic
// for a single-instance deployment. Not distributed-safe across multiple processes.
const userLocks = new Map();

/**
 * Acquire a per-user lock. Returns a release function.
 * All callers for the same userId are queued and execute serially.
 */
function acquireLock(userId) {
  const key = userId.toString();
  const current = userLocks.get(key) || Promise.resolve();
  let release;
  const next = new Promise((resolve) => { release = resolve; });
  userLocks.set(key, current.then(() => next));
  return current.then(() => release);
}

// Extracts the client IP, accounting for proxies
const getIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

// POST /api/activity
const logActivity = asyncHandler(async (req, res) => {
  const { action, meta } = req.body;

  if (!action) {
    res.status(400);
    throw new Error('action is required');
  }

  const allowedActions = ['login', 'logout', 'view', 'click', 'custom'];
  if (!allowedActions.includes(action)) {
    res.status(400);
    throw new Error(`action must be one of: ${allowedActions.join(', ')}`);
  }

  const userId = req.user._id;
  const ipAddress = getIp(req);

  // Acquire per-user lock so concurrent requests are serialized.
  // This makes the count-then-insert check safe within a single process.
  const release = await acquireLock(userId);
  try {
    const serverTime = new Date();
    const windowStart = new Date(serverTime.getTime() - 10 * 1000);

    // Custom rate-limit: reject if 5 or more actions already exist in the last 10 seconds.
    // This enforces "no more than 5 actions per 10-second window" (6th is rejected).
    const actionsInLast10Sec = await ActivityLog.countDocuments({
      userId,
      createdAt: { $gt: windowStart },
    });

    if (actionsInLast10Sec >= 5) {
      return res.status(429).json({ success: false, message: 'Rate limit exceeded' });
    }

    // Insert only if the check passed — count is accurate because the lock
    // prevents another request for this user from interleaving here.
    await ActivityLog.create({
      userId,
      action,
      meta: meta || {},
      ipAddress,
    });

    res.status(201).json({
      success: true,
      serverTime: serverTime.toISOString(),
      actionsInLast10Sec: actionsInLast10Sec + 1,
    });
  } finally {
    release();
  }
});

// GET /api/activity/stats
const getStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  // 1. Total actions
  const totalActions = await ActivityLog.countDocuments();

  // 2. Most common action
  const actionFrequency = await ActivityLog.aggregate([
    { $group: { _id: '$action', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
  ]);
  const mostCommonAction = actionFrequency.length > 0 ? actionFrequency[0]._id : null;

  // 3. Actions per minute for the last 10 minutes
  // Each bucket is a 1-minute window
  const perMinuteBuckets = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: tenMinutesAgo } } },
    {
      $group: {
        _id: {
          year:   { $year: '$createdAt' },
          month:  { $month: '$createdAt' },
          day:    { $dayOfMonth: '$createdAt' },
          hour:   { $hour: '$createdAt' },
          minute: { $minute: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.hour': 1, '_id.minute': 1 } },
  ]);

  // Format into human-readable labels
  const actionsPerMinute = perMinuteBuckets.map((b) => {
    const label = `${String(b._id.hour).padStart(2, '0')}:${String(b._id.minute).padStart(2, '0')}`;
    return { minute: label, count: b.count };
  });

  // 4. Most active user
  const userFrequency = await ActivityLog.aggregate([
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 1 },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
  ]);

  const mostActiveUser = userFrequency.length > 0
    ? { userId: userFrequency[0]._id, name: userFrequency[0].user?.name || 'Unknown', count: userFrequency[0].count }
    : null;

  res.json({
    success: true,
    data: {
      totalActions,
      mostCommonAction,
      actionsPerMinute,
      mostActiveUser,
    },
  });
});

// GET /api/activity/suspicious
const getSuspicious = asyncHandler(async (req, res) => {
  const now = new Date();
  const oneMinuteAgo  = new Date(now.getTime() - 60 * 1000);
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  // Condition A: users with MORE THAN 20 actions in the last 1 minute
  const highFrequency = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: oneMinuteAgo } } },
    { $group: { _id: '$userId', count: { $sum: 1 } } },
    { $match: { count: { $gt: 20 } } },
  ]);

  // Condition B: users with MORE THAN 2 distinct IPs in the last 5 minutes
  const multipleIPs = await ActivityLog.aggregate([
    { $match: { createdAt: { $gte: fiveMinutesAgo } } },
    { $group: { _id: '$userId', ips: { $addToSet: '$ipAddress' } } },
    { $addFields: { ipCount: { $size: '$ips' } } },
    { $match: { ipCount: { $gt: 2 } } },
  ]);

  // Build lookup maps keyed by userId string
  const highFreqMap = new Map(highFrequency.map((u) => [u._id.toString(), u.count]));
  const multiIPMap  = new Map(multipleIPs.map((u)  => [u._id.toString(), u.ipCount]));

  // Union of all suspicious userIds
  const suspiciousUserIds = new Set([...highFreqMap.keys(), ...multiIPMap.keys()]);

  const results = Array.from(suspiciousUserIds).map((uid) => {
    const isHighFreq = highFreqMap.has(uid);
    const isMultiIP  = multiIPMap.has(uid);

    let reason;
    let count;

    if (isHighFreq && isMultiIP) {
      reason = 'High frequency / Multiple IPs';
      count  = highFreqMap.get(uid); // actions in 1-min window (per spec decision)
    } else if (isHighFreq) {
      reason = 'High frequency';
      count  = highFreqMap.get(uid);
    } else {
      reason = 'Multiple IPs';
      count  = multiIPMap.get(uid);
    }

    return { userId: uid, reason, count };
  });

  res.json(results);
});

// POST /api/activity/replay-check
const replayCheck = asyncHandler(async (req, res) => {
  const { action, clientTime } = req.body;

  if (!action || !clientTime) {
    res.status(400);
    throw new Error('action and clientTime are required');
  }

  const serverTime = new Date();
  const clientDate = new Date(clientTime);

  if (isNaN(clientDate.getTime())) {
    res.status(400);
    throw new Error('clientTime is not a valid ISO date');
  }

  // Rule 1: reject if |serverTime - clientTime| > 30 seconds (strictly greater than)
  const diffSeconds = Math.abs(serverTime.getTime() - clientDate.getTime()) / 1000;
  if (diffSeconds > 30) {
    return res.status(400).json({ allowed: false, reason: 'Time skew exceeds 30 seconds' });
  }

  // Rule 2: reject if same user + same action was seen within the last 3 seconds
  const userId = req.user._id.toString();
  const key = `${userId}:${action}`;
  const lastSeen = replayStore.get(key);

  if (lastSeen !== undefined) {
    const elapsed = (serverTime.getTime() - lastSeen) / 1000;
    if (elapsed < 3) {
      return res.status(400).json({ allowed: false, reason: 'Duplicate action within 3 seconds' });
    }
  }

  // Record this attempt
  replayStore.set(key, serverTime.getTime());

  res.json({ allowed: true, serverTime: serverTime.toISOString() });
});

module.exports = { logActivity, getStats, getSuspicious, replayCheck };
