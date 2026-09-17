import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../features/auth/authSlice';
import { toggleTheme } from '../features/theme/themeSlice';
import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner';
import { Eye, EyeOff, Zap, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';

function LoginPage() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const { mode } = useSelector((s) => s.theme);
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  // Apply theme class to body globally (needed for unauthenticated pages since MainLayout isn't mounted yet)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill both fields');
    const res = await dispatch(loginUser(form));
    if (res.error) {
      toast.error(res.payload || 'Invalid email or password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', position: 'relative', padding: '1rem', overflow: 'hidden'
    }}>
      {/* Absolute Header for actions */}
      <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10 }}>
        <button
          onClick={() => dispatch(toggleTheme())}
          className="btn-icon"
          title={mode === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '8px' }}
        >
          {mode === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
      </div>

      {/* Background orbs */}
      <div className="auth-bg-orb" style={{ width: 420, height: 420, top: -80, right: -80, background: 'rgba(91,94,244,.08)' }} />
      <div className="auth-bg-orb" style={{ width: 320, height: 320, bottom: -60, left: -60, background: 'rgba(139,92,246,.07)' }} />

      <div style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}>
        {/* Card */}
        <div className="card" style={{ boxShadow: 'var(--shadow-lg)', padding: '2.25rem 2rem' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: 48, height: 48, borderRadius: 14, margin: '0 auto 1rem',
              background: 'linear-gradient(135deg, #5b5ef4, #7c7ff5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(91,94,244,.35)',
            }}>
              <Zap size={22} color="#fff" strokeWidth={2.5} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Sign in to continue to your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="form-input"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="form-input"
                  style={{ paddingRight: '2.75rem' }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="btn-icon"
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ marginTop: 4, width: '100%', padding: '0.75rem' }}
            >
              {loading ? <Spinner size="sm" /> : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '1.5rem' }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
