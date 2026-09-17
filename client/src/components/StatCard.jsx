/**
 * StatCard — compact metric card with icon, value, label and optional trend.
 */
function StatCard({ title, value, icon: Icon, color = 'indigo', trend, positive = true }) {
  const colorMap = {
    indigo:  { bg: 'rgba(91,94,244,.1)',   icon: '#5b5ef4', dot: '#5b5ef4'  },
    emerald: { bg: 'rgba(16,185,129,.1)',  icon: '#10b981', dot: '#10b981'  },
    amber:   { bg: 'rgba(245,158,11,.1)',  icon: '#f59e0b', dot: '#f59e0b'  },
    violet:  { bg: 'rgba(139,92,246,.1)',  icon: '#8b5cf6', dot: '#8b5cf6'  },
    rose:    { bg: 'rgba(239,68,68,.1)',   icon: '#ef4444', dot: '#ef4444'  },
    cyan:    { bg: 'rgba(6,182,212,.1)',   icon: '#06b6d4', dot: '#06b6d4'  },
  };

  const c = colorMap[color] || colorMap.indigo;

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* subtle accent stripe */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${c.dot}, transparent)`,
        borderRadius: '12px 12px 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '0.25rem 0 0' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {title}
          </p>
          <p style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>
            {value ?? '–'}
          </p>
          {trend && (
            <p style={{
              fontSize: '0.78rem', fontWeight: 600, marginTop: '0.6rem',
              color: positive ? 'var(--c-done)' : 'var(--c-high)',
            }}>
              {positive ? '↑' : '↓'} {trend} vs last month
            </p>
          )}
        </div>
        <div style={{
          width: 46, height: 46, borderRadius: 12, flexShrink: 0,
          background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={c.icon} />
        </div>
      </div>
    </div>
  );
}

export default StatCard;
