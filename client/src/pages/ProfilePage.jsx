import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Check, User, Camera, Lock, Mail, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosInstance from '../api/axiosInstance';
import Spinner from '../components/Spinner';
import { updateUserProfile } from '../features/auth/authSlice';

// Resize + compress an image File to a base64 string via an offscreen canvas.
// Keeps avatars small enough for MongoDB (< 100 KB target).
function resizeImageToBase64(file, maxSize = 256) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale  = Math.min(maxSize / img.width, maxSize / img.height, 1);
        canvas.width  = Math.round(img.width  * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function ProfilePage() {
  const dispatch  = useDispatch();
  const { user }  = useSelector((s) => s.auth);
  const [loading, setLoading]   = useState(false);
  const [preview, setPreview]   = useState(user?.avatar || '');
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name:            user?.name || '',
    avatar:          user?.avatar || '',
    password:        '',
    confirmPassword: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Handle local file selection: compress → set as preview + form value
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return toast.error('Please select an image file');
    }
    if (file.size > 5 * 1024 * 1024) {
      return toast.error('Image must be under 5 MB');
    }

    try {
      const base64 = await resizeImageToBase64(file, 256);
      setPreview(base64);
      setForm((prev) => ({ ...prev, avatar: base64 }));
    } catch {
      toast.error('Failed to process image');
    }

    // Reset the input so the same file can be re-selected if needed
    e.target.value = '';
  };

  // Handle URL input changes
  const handleAvatarUrlChange = (e) => {
    setPreview(e.target.value);
    setForm((prev) => ({ ...prev, avatar: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password && form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (!form.name.trim()) {
      return toast.error('Name cannot be empty');
    }

    setLoading(true);
    try {
      const payload = { name: form.name.trim(), avatar: form.avatar };
      if (form.password) payload.password = form.password;

      const res = await axiosInstance.put('/users/profile', payload);

      dispatch(updateUserProfile({
        name:   res.data.data.name,
        avatar: res.data.data.avatar,
      }));

      setForm((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const avatarLetter = user?.name?.charAt(0).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 600 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <h2>Profile Settings</h2>
        <p>Manage your account settings and preferences.</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        aria-label="Upload avatar image"
      />

      <div className="card" style={{ padding: 0 }}>

        {/* Avatar section */}
        <div style={{
          background: 'var(--bg-primary)', padding: '2rem',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
        }}>
          {/* Clickable avatar */}
          <div
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload a new photo"
            style={{ position: 'relative', marginBottom: '1rem', cursor: 'pointer' }}
          >
            {preview ? (
              <img
                src={preview}
                alt="Avatar"
                style={{
                  width: 88, height: 88, borderRadius: '50%', objectFit: 'cover',
                  border: '3px solid var(--bg-card)', boxShadow: 'var(--shadow-sm)',
                  transition: 'opacity 0.2s',
                }}
                onError={() => setPreview('')}
              />
            ) : (
              <div className="avatar" style={{ width: 88, height: 88, fontSize: '2.2rem', background: 'var(--accent)' }}>
                {avatarLetter}
              </div>
            )}

            {/* Camera overlay */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              background: 'rgba(0,0,0,0.38)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              opacity: 0, transition: 'opacity 0.18s',
            }}
              className="avatar-overlay"
            >
              <Upload size={18} color="#fff" />
              <span style={{ fontSize: '0.6rem', color: '#fff', fontWeight: 600 }}>UPLOAD</span>
            </div>

            {/* Camera badge bottom-right */}
            <div style={{
              position: 'absolute', bottom: 2, right: -2,
              background: 'var(--accent)', padding: 6, borderRadius: '50%',
              border: '2px solid var(--bg-card)', display: 'flex',
            }}>
              <Camera size={12} color="#fff" />
            </div>
          </div>

          <h3 style={{ fontWeight: 600, fontSize: '1.1rem' }}>{user?.name}</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{user?.role?.toUpperCase()}</p>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-ghost"
            style={{ marginTop: '0.75rem', fontSize: '0.8rem', gap: 6, padding: '6px 14px' }}
          >
            <Upload size={14} /> Upload Photo
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                <User size={14} /> Full Name
              </label>
              <input name="name" value={form.name} onChange={handleChange} required className="form-input" />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                value={user?.email}
                disabled
                readOnly
                className="form-input"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="Email cannot be changed"
              />
            </div>
          </div>

          {/* Avatar URL (alternative to file upload) */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
              <Camera size={14} /> Avatar URL <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>(or upload above)</span>
            </label>
            <input
              type="url"
              name="avatarUrl"
              value={form.avatar?.startsWith('data:') ? '' : form.avatar}
              onChange={handleAvatarUrlChange}
              placeholder="https://example.com/photo.jpg"
              className="form-input"
            />
          </div>

          {/* Password change */}
          <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem -2rem', padding: '1.5rem 2rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Change Password</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                  <Lock size={14} /> New Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Leave blank to keep current"
                  className="form-input"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6 }}>
                  <Lock size={14} /> Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className="form-input"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? <Spinner size="sm" /> : <><Check size={16} strokeWidth={3} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>

      {/* Hover overlay style */}
      <style>{`
        [title="Click to upload a new photo"]:hover .avatar-overlay {
          opacity: 1 !important;
        }
      `}</style>
    </div>
  );
}

export default ProfilePage;
