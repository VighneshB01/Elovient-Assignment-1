const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

const getTasks = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? {}
    : { $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }] };

  const tasks = await Task.find(filter)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 });

  res.json({ success: true, data: tasks });
});

const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, assignedTo, dueDate } = req.body;

  if (!title || !title.trim()) {
    res.status(400);
    throw new Error('Task title is required');
  }

  if (title.length > 200) {
    res.status(400);
    throw new Error('Task title must be under 200 characters');
  }

  const task = await Task.create({
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'todo',
    priority: priority || 'medium',
    assignedTo: assignedTo || null,
    dueDate: dueDate || null,
    createdBy: req.user._id,
  });

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

  // Only notify the assignee if it's a different person
  if (populatedTask.assignedTo &&
      populatedTask.assignedTo._id.toString() !== req.user._id.toString()) {
    req.io.to(populatedTask.assignedTo._id.toString()).emit('task_assigned', populatedTask);
  }

  res.status(201).json({ success: true, data: populatedTask });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isOwner    = task.createdBy.toString() === req.user._id.toString();
  const isAssignee = task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

  if (!isOwner && !isAssignee && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this task');
  }

  // Whitelist the fields that are actually allowed to be updated.
  // This prevents mass-assignment attacks where a user sends { createdBy: "x" }.
  const { title, description, status, priority, assignedTo, dueDate } = req.body;
  const allowedUpdates = {};
  if (title !== undefined)       allowedUpdates.title       = title.trim();
  if (description !== undefined) allowedUpdates.description = description.trim();
  if (status !== undefined)      allowedUpdates.status      = status;
  if (priority !== undefined)    allowedUpdates.priority    = priority;
  if (dueDate !== undefined)     allowedUpdates.dueDate     = dueDate || null;

  // Only admins and the creator can re-assign a task
  if (assignedTo !== undefined && (isOwner || req.user.role === 'admin')) {
    allowedUpdates.assignedTo = assignedTo || null;
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, allowedUpdates, {
    new: true,
    runValidators: true,
  })
    .populate('createdBy', 'name email')
    .populate('assignedTo', 'name email');

  // Notify the assignee only if the update wasn't made by the assignee themselves
  if (updated.assignedTo &&
      updated.assignedTo._id.toString() !== req.user._id.toString()) {
    req.io.to(updated.assignedTo._id.toString()).emit('task_updated', updated);
  }

  res.json({ success: true, data: updated });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const isOwner = task.createdBy.toString() === req.user._id.toString();
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to delete this task');
  }

  await Task.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Task deleted' });
});

module.exports = { getTasks, createTask, updateTask, deleteTask };
