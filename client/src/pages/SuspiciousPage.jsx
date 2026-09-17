import { useState, useEffect, useCallback } from 'react';
import axiosInstance from '../api/axiosInstance';
import Spinner from '../components/Spinner';

function SuspiciousPage() {
  const [suspects, setSuspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSuspicious = useCallback(async () => {
    try {
      const res = await axiosInstance.get('/activity/suspicious');
      setSuspects(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load suspicious activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuspicious();
  }, [fetchSuspicious]);

  const reasonColor = (reason) => {
    if (reason === 'High frequency / Multiple IPs') return '#ef4444';
    if (reason === 'High frequency') return '#f59e0b';
    return '#8b5cf6';
  };

  if (loading) return <Spinner center />;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Suspicious Activity</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: 2 }}>
            Users with &gt;20 actions/min or &gt;2 distinct IPs in 5 minutes.
          </p>
        </div>
        <button className="btn btn-ghost" onClick={fetchSuspicious} style={{ fontSize: '0.82rem' }}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444', marginBottom: '1rem' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
          <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={fetchSuspicious}>
            Retry
          </button>
        </div>
      )}

      {!error && suspects.length === 0 && (
        <div className="card empty-state" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
          <p style={{ color: 'var(--text-secondary)' }}>No suspicious activity detected.</p>
        </div>
      )}

      {suspects.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-secondary)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    User ID
                  </th>
                  <th style={{ textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Reason
                  </th>
                  <th style={{ textAlign: 'right', padding: '0.75rem 1rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                {suspects.map((s, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-all' }}>
                      {s.userId}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.2rem 0.6rem',
                        borderRadius: 9999,
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: `${reasonColor(s.reason)}22`,
                        color: reasonColor(s.reason),
                      }}>
                        {s.reason}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {s.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuspiciousPage;
