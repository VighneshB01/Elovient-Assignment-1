import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTasks, createTask, updateTask, deleteTask, moveTaskLocally } from '../features/tasks/taskSlice';
import { fetchUsers } from '../features/users/userSlice';
import Spinner from '../components/Spinner';
import { Plus, Pencil, Trash2, X, CheckSquare, Calendar, Flag, User, LayoutDashboard, List } from 'lucide-react';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const STATUS_OPTS  = ['todo', 'in-progress', 'done'];
const PRIORITY_OPTS = ['low', 'medium', 'high'];
const EMPTY_FORM   = { title: '', description: '', status: 'todo', priority: 'medium', dueDate: '', assignedTo: '' };

/* ─ Modal ─ */
function TaskModal({ isOpen, onClose, onSubmit, initial, loading, users, currentUserRole }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(initial || EMPTY_FORM);
      setSubmitting(false);
    }
  }, [isOpen, initial]);

  if (!isOpen) return null;

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Guard against double-submit: lock the button immediately on first click.
  // This prevents React StrictMode or rapid clicks from firing two REST calls.
  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    const payload = { ...form };
    if (!payload.assignedTo) payload.assignedTo = null;
    onSubmit(payload);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {initial ? 'Edit Task' : 'New Task'}
          </h3>
          <button type="button" onClick={onClose} className="btn-icon" aria-label="Close"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
              Title <span style={{ color: 'var(--c-high)' }}>*</span>
            </label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="What needs to be done?" className="form-input" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Optional details..." className="form-input" style={{ resize: 'none' }} />
          </div>

          {currentUserRole === 'admin' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Assign To</label>
              <select name="assignedTo" value={form.assignedTo} onChange={handleChange} className="form-input">
                <option value="">Unassigned</option>
                {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
              </select>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-input">
                {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className="form-input">
                {PRIORITY_OPTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>Due Date</label>
            <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className="form-input" />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', paddingTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading || submitting} className="btn btn-primary" style={{ flex: 1 }}>
              {(loading || submitting) ? <Spinner size="sm" /> : initial ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─ Task Card ─ */
function TaskCard({ task, canEdit, onEdit, onDelete, currentUserRole }) {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'done';

  return (
    <div className="card task-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'grab' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <h3 style={{
          flex: 1, fontWeight: 600, fontSize: '0.9375rem', lineHeight: 1.35,
          color: 'var(--text-primary)', letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.title}
        </h3>
        {canEdit && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => onEdit(task)} className="btn-icon" title="Edit" style={{ color: 'var(--accent)' }}>
              <Pencil size={13} />
            </button>
            <button onClick={() => onDelete(task._id)} className="btn-icon" title="Delete" style={{ color: 'var(--c-high)' }}>
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p style={{
          fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {task.description}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 'auto' }}>
        <span className={`badge badge-${task.priority}`}>
          <Flag size={9} /> {task.priority}
        </span>
        {task.dueDate && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', color: isOverdue ? 'var(--c-high)' : 'var(--text-muted)',
            marginLeft: 'auto', fontWeight: isOverdue ? 600 : 400,
          }}>
            <Calendar size={11} />
            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {task.assignedTo?.name ? (
          <p style={{ fontSize: '0.72rem', color: 'var(--accent)' }}>
            <User size={10} style={{ marginRight: 4 }} /> Assigned to <strong>{task.assignedTo.name}</strong>
          </p>
        ) : (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Unassigned</p>
        )}
        {currentUserRole === 'admin' && task.createdBy?.name && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Created by {task.createdBy.name}</p>
        )}
      </div>
    </div>
  );
}

/* ─ Main Page ─ */
function TasksPage() {
  const dispatch = useDispatch();
  const { list: tasksList, loading: tasksLoading } = useSelector((s) => s.tasks);
  const { list: usersList } = useSelector((s) => s.users);
  const { user } = useSelector((s) => s.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [saving, setSaving]       = useState(false);
  const [viewMode, setViewMode]   = useState('board'); // 'board' | 'list'
  
  useEffect(() => { 
    dispatch(fetchTasks()); 
    if (user?.role === 'admin') dispatch(fetchUsers());
  }, [dispatch, user?.role]);

  const handleCreate = async (form) => {
    setSaving(true);
    const res = await dispatch(createTask(form));
    if (res.error) toast.error('Failed to create task');
    else toast.success('Task created!');
    setModalOpen(false);
    setSaving(false);
  };

  const handleEdit = async (form) => {
    setSaving(true);
    const res = await dispatch(updateTask({ id: editTask._id, data: form }));
    if (res.error) toast.error('Failed to update task');
    else toast.success('Task updated');
    setEditTask(null);
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const res = await dispatch(deleteTask(id));
    if (res.error) toast.error('Failed to delete task');
    else toast.success('Task deleted');
  };

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // 1. Optimistic synchronous visual update
    dispatch(moveTaskLocally({ id: draggableId, status: destination.droppableId }));
    
    // 2. Dispatch update to Backend asynchronously
    dispatch(updateTask({ id: draggableId, data: { status: destination.droppableId } }));
  };

  const renderKanbanBoard = () => (
    <DragDropContext onDragEnd={onDragEnd}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        {STATUS_OPTS.map((status) => {
          const colTasks = tasksList.filter(t => t.status === status);
          return (
            <div key={status} style={{ background: 'var(--bg-primary)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
                <h3 style={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.95rem' }}>{status.replace('-', ' ')}</h3>
                <span style={{ background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 'var(--r-full)', fontSize: '0.75rem', fontWeight: 600 }}>{colTasks.length}</span>
              </div>
              <Droppable droppableId={status}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      padding: '1rem',
                      minHeight: 180,
                      background: snapshot.isDraggingOver ? 'var(--accent-glow)' : 'transparent',
                      transition: 'background 0.2s ease',
                      display: 'flex', flexDirection: 'column', gap: '1rem',
                    }}
                  >
                    {colTasks.map((task, index) => {
                      const canEdit = 
                        (task.createdBy?._id === user?._id || task.createdBy === user?._id) || 
                        (task.assignedTo?._id === user?._id || task.assignedTo === user?._id) || 
                        user?.role === 'admin';
                      return (
                        <Draggable key={task._id} draggableId={task._id} index={index}>
                          {(provided, snap) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{ ...provided.draggableProps.style, opacity: snap.isDragging ? 0.9 : 1 }}
                            >
                              <TaskCard task={task} canEdit={canEdit} onEdit={setEditTask} onDelete={handleDelete} currentUserRole={user?.role} />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );

  const renderListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {tasksList.map((task) => {
        const canEdit = 
          (task.createdBy?._id === user?._id || task.createdBy === user?._id) || 
          (task.assignedTo?._id === user?._id || task.assignedTo === user?._id) || 
          user?.role === 'admin';
        return <TaskCard key={task._id} task={task} canEdit={canEdit} onEdit={setEditTask} onDelete={handleDelete} currentUserRole={user?.role} />;
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Tasks</h2>
          <p>{tasksList.length} task{tasksList.length !== 1 ? 's' : ''} total</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <div className="seg-control">
            <button onClick={() => setViewMode('board')} className={`seg-btn ${viewMode === 'board' ? 'active' : ''}`} title="Board View"><LayoutDashboard size={15} /></button>
            <button onClick={() => setViewMode('list')} className={`seg-btn ${viewMode === 'list' ? 'active' : ''}`} title="List View"><List size={15} /></button>
          </div>
          <button id="new-task-btn" onClick={() => setModalOpen(true)} className="btn btn-primary" style={{ gap: 6 }}>
            <Plus size={16} strokeWidth={2.5} /> New Task
          </button>
        </div>
      </div>

      {tasksLoading ? (
        <Spinner center size="lg" />
      ) : tasksList.length === 0 ? (
        <div className="card empty-state">
          <CheckSquare size={36} color="var(--accent)" style={{ opacity: 0.45 }} />
          <p>No tasks yet</p>
          <span>Click "New Task" to get started.</span>
        </div>
      ) : viewMode === 'board' ? (
        renderKanbanBoard()
      ) : (
        renderListView()
      )}

      {/* Modals */}
      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleCreate} loading={saving} users={usersList || []} currentUserRole={user?.role} />
      <TaskModal
        isOpen={!!editTask}
        onClose={() => setEditTask(null)}
        onSubmit={handleEdit}
        users={usersList || []}
        currentUserRole={user?.role}
        initial={editTask ? {
          title:       editTask.title,
          description: editTask.description || '',
          status:      editTask.status,
          priority:    editTask.priority,
          dueDate:     editTask.dueDate ? new Date(editTask.dueDate).toISOString().split('T')[0] : '',
          assignedTo:  editTask.assignedTo?._id || editTask.assignedTo || '',
        } : null}
        loading={saving}
      />
    </div>
  );
}

export default TasksPage;
