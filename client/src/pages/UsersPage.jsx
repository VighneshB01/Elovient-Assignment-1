import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUser, deleteUser } from '../features/users/userSlice';
import Spinner from '../components/Spinner';
import { Pencil, Trash2, X, Check, Search, Users as UsersIcon, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

function RoleBadge({ role }) {
  const isAdmin = role === 'admin';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 10px', borderRadius: 999,
      fontSize: '0.72rem', fontWeight: 600,
      background: isAdmin ? 'rgba(91,94,244,.1)' : 'rgba(100,116,139,.1)',
      color: isAdmin ? 'var(--accent)' : 'var(--text-secondary)',
      border: `1px solid ${isAdmin ? 'rgba(91,94,244,.2)' : 'rgba(100,116,139,.2)'}`,
    }}>
      {isAdmin ? <Shield size={10} /> : <User size={10} />}
      {role}
    </span>
  );
}

function UsersPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.users);
  const { user: currentUser } = useSelector((s) => s.auth);
  const [editId, setEditId] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [search, setSearch] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  useEffect(() => { dispatch(fetchUsers()); }, [dispatch]);

  const handleEdit = (u) => { setEditId(u._id); setEditRole(u.role); };
  const handleCancelEdit = () => { setEditId(null); setEditRole(''); };

  const handleSaveRole = async (id) => {
    const res = await dispatch(updateUser({ id, data: { role: editRole } }));
    if (res.error) toast.error('Failed to update role');
    else toast.success('Role updated');
    setEditId(null);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    const res = await dispatch(deleteUser(confirmDeleteId));
    if (res.error) toast.error('Failed to delete user');
    else toast.success('User deleted');
    setConfirmDeleteId(null);
  };

  const filtered = list.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase())
          || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Confirm delete dialog */}
      {confirmDeleteId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        }}>
          <div className="card" style={{ maxWidth: 380, width: '100%', margin: '1rem', padding: '2rem', textAlign: 'center' }}>
            <Trash2 size={32} color="var(--c-high)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>Delete this user?</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              This action is permanent and cannot be undone. All tasks created by this user will remain.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost">Cancel</button>
              <button
                onClick={handleDeleteConfirm}
                className="btn"
                style={{ background: 'var(--c-high)', color: '#fff' }}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>Users</h2>
          <p>{pagination?.total ?? list.length} registered users</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            id="users-search"
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.25rem', width: 230 }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <Spinner center size="lg" />
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <UsersIcon size={36} color="var(--accent)" style={{ opacity: 0.45 }} />
          <p>{search ? `No users matching "${search}"` : 'No users yet'}</p>
          <span>Users will appear here after they sign up.</span>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                {['User', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const isSelf = u._id === currentUser?._id;
                return (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="avatar avatar-sm"
                          style={{ background: u.role === 'admin' ? 'var(--accent)' : '#64748b', fontSize: '0.7rem' }}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>
                            {u.name}
                            {isSelf && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 500, marginLeft: 6 }}>
                                (you)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{u.email}</td>

                    <td>
                      {editId === u._id ? (
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="form-input"
                          style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }}
                        >
                          <option value="user">user</option>
                          <option value="admin">admin</option>
                        </select>
                      ) : (
                        <RoleBadge role={u.role} />
                      )}
                    </td>

                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {editId === u._id ? (
                          <>
                            <button onClick={() => handleSaveRole(u._id)} className="btn-icon" title="Save" style={{ color: 'var(--c-done)' }}>
                              <Check size={15} />
                            </button>
                            <button onClick={handleCancelEdit} className="btn-icon" title="Cancel">
                              <X size={15} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(u)}
                              className="btn-icon"
                              title="Edit role"
                              style={{ color: 'var(--accent)' }}
                              id={`edit-user-${u._id}`}
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => !isSelf && setConfirmDeleteId(u._id)}
                              disabled={isSelf}
                              className="btn-icon"
                              title={isSelf ? "Can't delete yourself" : 'Delete user'}
                              style={{ color: 'var(--c-high)', opacity: isSelf ? 0.3 : 1, cursor: isSelf ? 'not-allowed' : 'pointer' }}
                              id={`delete-user-${u._id}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
