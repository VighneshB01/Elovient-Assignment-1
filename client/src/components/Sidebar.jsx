import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import { LayoutDashboard, CheckSquare, Users, LogOut, X, Zap, User, Activity, BarChart2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/',          label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { to: '/tasks',     label: 'Tasks',      icon: CheckSquare },
  { to: '/activity',  label: 'Simulator',  icon: Activity },
  { to: '/stats',     label: 'Stats',      icon: BarChart2 },
  { to: '/suspicious',label: 'Suspicious', icon: AlertTriangle },
  { to: '/profile',   label: 'Profile',    icon: User },
];

const adminItems = [
  { to: '/users', label: 'Users', icon: Users },
];

function Sidebar({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <nav className="sidebar" aria-label="Main navigation">
      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 16px 18px',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #5b5ef4, #7c7ff5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(91,94,244,.45)',
          }}>
            <Zap size={16} color="#fff" strokeWidth={2.5} />
          </div>
          <span style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
            Elovient Assignment
          </span>
        </div>
        <button
          onClick={onClose}
          className="btn-icon"
          style={{ color: 'var(--text-sidebar-muted)' }}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Nav links */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <p style={{
          fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: 'var(--text-sidebar-muted)',
          padding: '4px 8px 8px',
        }}>
          Menu
        </p>

        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            onClick={() => onClose?.()}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            style={{ marginBottom: 2 }}
          >
            {/* Fixed: strokeWidth must be a number, not a render function */}
            <Icon size={17} strokeWidth={1.9} />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <p style={{
              fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', color: 'var(--text-sidebar-muted)',
              padding: '16px 8px 8px',
            }}>
              Admin
            </p>
            {adminItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => onClose?.()}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                style={{ marginBottom: 2 }}
              >
                <Icon size={17} strokeWidth={1.9} />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </div>

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: 'var(--bg-sidebar-2)',
          marginBottom: 6,
        }}>
        <div
          className="avatar avatar-sm"
          onClick={() => navigate('/profile')}
          style={{ fontSize: '0.7rem', cursor: 'pointer', flexShrink: 0, overflow: 'hidden' }}
          title="Go to profile"
        >
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </p>
            <p style={{ color: 'var(--text-sidebar-muted)', fontSize: '0.72rem', textTransform: 'capitalize' }}>
              {user?.role}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="nav-item btn-icon"
          style={{ width: '100%', color: '#ef4444', gap: 10, padding: '8px 12px', borderRadius: 8 }}
          id="logout-btn"
        >
          <LogOut size={16} />
          <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </nav>
  );
}

export default Sidebar;
