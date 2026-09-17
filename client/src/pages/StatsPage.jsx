import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import Spinner from '../components/Spinner';

function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/activity/stats');
      setStats(res.data.data);
      setLastRefresh(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 5 seconds per spec
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return <Spinner center />;

  if (error) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="page-header">
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activity Stats</h1>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={fetchStats}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { totalActions, mostCommonAction, actionsPerMinute, mostActiveUser } = stats;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activity Stats</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
            Auto-refreshes every 5 seconds{lastRefresh && ` — last updated ${lastRefresh}`}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchStats} style={{ fontSize: '0.82rem' }}>
          Refresh now
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent)' }}>{totalActions}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Total Actions</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', wordBreak: 'break-word' }}>
            {mostCommonAction || '—'}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Most Common Action</div>
        </div>
        <div className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent)', wordBreak: 'break-word' }}>
            {mostActiveUser ? mostActiveUser.name : '—'}
          </div>
          {mostActiveUser && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
              {mostActiveUser.count} actions
            </div>
          )}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>Most Active User</div>
        </div>
      </div>

      {/* Actions per minute — last 10 minutes */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '1rem', color: 'var(--text-primary)' }}>
          Actions per Minute — Last 10 Minutes
        </div>
        {actionsPerMinute.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity in the last 10 minutes.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '0.4rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                    Minute (HH:MM)
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.4rem 0.75rem', color: 'var(--text-secondary)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
                    Actions
                  </th>
                  <th style={{ padding: '0.4rem 0.75rem', borderBottom: '1px solid var(--border)' }} />
                </tr>
              </thead>
              <tbody>
                {actionsPerMinute.map((row, i) => {
                  const maxCount = Math.max(...actionsPerMinute.map((r) => r.count));
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                        {row.minute}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 600, color: 'var(--accent)' }}>
                        {row.count}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', width: '40%' }}>
                        <div className="progress-bar" style={{ height: 6 }}>
                          <div style={{
                            height: '100%', borderRadius: 'inherit',
                            width: `${(row.count / maxCount) * 100}%`,
                            background: 'var(--accent)',
                          }} />
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
    </div>
  );
}

export default StatsPage;
