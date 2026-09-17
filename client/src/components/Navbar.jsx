import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toggleTheme } from '../features/theme/themeSlice';
import { markAllAsRead } from '../features/notifications/notificationSlice';
import { Menu, Bell, Sun, Moon, Check, CheckCircle2, Search } from 'lucide-react';

function Navbar({ onMenuClick }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { mode } = useSelector((s) => s.theme);
  const { user } = useSelector((s) => s.auth);
  const { list: notifications, unreadCount } = useSelector((s) => s.notifications);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close the notification dropdown when clicking anywhere outside it.
  // Uses capture phase (true) so it fires before Kanban drag handlers can swallow the event.
  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [showDropdown]);

  return (
    <header
      id="main-navbar"
      style={{
        position: 'sticky', top: 0, zIndex: 10,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.25rem',
        height: 60,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuClick}
        className="btn-icon"
        aria-label="Open menu"
        id="mobile-menu-btn"
        style={{ display: 'none' }}
      >
        <Menu size={20} />
      </button>

      {/* Greeting — desktop */}
      <div className="navbar-greeting" style={{ flexShrink: 0 }}>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Good {getGreeting()},{' '}
          <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{user?.name?.split(' ')[0]}</span>
        </p>
      </div>

      {/* Search trigger */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem' }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="search-trigger"
          title="Search tasks (Cmd+K)"
        >
          <Search size={14} style={{ color: 'var(--text-muted)' }} />
          <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Search tasks...</span>
          <span className="search-shortcut">Cmd K</span>
        </button>
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 0 }}>
        {/* Theme toggle */}
        <button
          id="theme-toggle-btn"
          onClick={() => dispatch(toggleTheme())}
          className="btn-icon"
          title={mode === 'light' ? 'Dark mode' : 'Light mode'}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Notification bell + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="btn-icon"
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: 3, right: 3, padding: '0 4px', height: 14, minWidth: 14,
                background: 'var(--c-high)', color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid var(--bg-secondary)',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showDropdown && (
            <div style={{
              position: 'absolute', top: '120%', right: -10, width: 340,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', zIndex: 50,
              overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => dispatch(markAllAsRead())}
                    className="btn-icon"
                    style={{ padding: 4, height: 'auto', fontSize: '0.75rem', color: 'var(--accent)' }}
                  >
                    <Check size={12} style={{ marginRight: 4 }} /> Mark all read
                  </button>
                )}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                    <CheckCircle2 size={24} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    No new notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid var(--border)',
                      background: n.read ? 'transparent' : 'var(--accent-glow)',
                      display: 'flex', gap: 12, alignItems: 'flex-start',
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.read ? 'transparent' : 'var(--accent)', marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{n.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</p>
                        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          {new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar — click to go to Profile */}
        <div
          className="avatar avatar-sm"
          style={{ marginLeft: 4, cursor: 'pointer' }}
          title={`${user?.name} — Go to profile`}
          onClick={() => navigate('/profile')}
          role="button"
          aria-label="Go to profile"
        >
          {user?.avatar
            ? <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : user?.name?.charAt(0).toUpperCase()
          }
        </div>
      </div>

      <style>{`
        @media (max-width: 1023px) {
          #mobile-menu-btn { display: inline-flex !important; }
          .navbar-greeting { display: none; }
          .search-shortcut { display: none !important; }
        }
        .search-trigger {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--r-sm);
          padding: 6px 12px;
          width: 100%;
          max-width: 240px;
          cursor: text;
          transition: border var(--t-fast), box-shadow var(--t-fast);
        }
        .search-trigger:hover {
          border-color: var(--accent);
          box-shadow: 0 0 0 2px var(--accent-glow);
        }
        .search-shortcut {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.05em;
        }
      `}</style>
    </header>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

export default Navbar;
