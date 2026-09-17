import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const ACTIONS = ['login', 'logout', 'view', 'click', 'custom'];

function ActivitySimulatorPage() {
  const [serverTime, setServerTime] = useState(null);
  const [clientTime, setClientTime] = useState(new Date().toISOString());
  const [timeDiff, setTimeDiff] = useState(null);
  const [rateLimited, setRateLimited] = useState(false);
  const [actionsInWindow, setActionsInWindow] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [replayResult, setReplayResult] = useState(null);
  const [replayAction, setReplayAction] = useState('click');
  const [loading, setLoading] = useState(false);
  const [replayLoading, setReplayLoading] = useState(false);
  const [error, setError] = useState(null);

  // Keep clientTime ticking
  useEffect(() => {
    const interval = setInterval(() => setClientTime(new Date().toISOString()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Update time diff whenever serverTime or clientTime changes
  useEffect(() => {
    if (!serverTime) return;
    const diff = Math.abs(new Date(serverTime) - new Date(clientTime));
    setTimeDiff((diff / 1000).toFixed(1));
  }, [serverTime, clientTime]);

  const logAction = async (action) => {
    setLoading(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await axiosInstance.post('/activity', { action });
      const data = res.data;
      setServerTime(data.serverTime);
      setActionsInWindow(data.actionsInLast10Sec);
      setRateLimited(false);
      setLastResult({ type: 'success', action, message: `"${action}" logged. ${data.actionsInLast10Sec}/5 actions used in last 10s.` });
    } catch (err) {
      if (err.response?.status === 429) {
        setRateLimited(true);
        setLastResult({ type: 'error', action, message: 'Rate limit exceeded — more than 5 actions in 10 seconds. Wait before trying again.' });
      } else {
        setError(err.response?.data?.message || 'Request failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Re-enable buttons after 10 seconds when rate-limited
  useEffect(() => {
    if (!rateLimited) return;
    const timer = setTimeout(() => {
      setRateLimited(false);
      setActionsInWindow(0);
    }, 10000);
    return () => clearTimeout(timer);
  }, [rateLimited]);

  const runReplayCheck = async () => {
    setReplayLoading(true);
    setReplayResult(null);
    try {
      const res = await axiosInstance.post('/activity/replay-check', {
        action: replayAction,
        clientTime: new Date().toISOString(),
      });
      const data = res.data;
      setServerTime(data.serverTime);
      setReplayResult({ type: 'success', message: `Allowed. Server time: ${data.serverTime}` });
    } catch (err) {
      const body = err.response?.data;
      if (body?.allowed === false) {
        setReplayResult({ type: 'error', message: `Rejected: ${body.reason}` });
      } else {
        setReplayResult({ type: 'error', message: err.response?.data?.message || 'Request failed' });
      }
    } finally {
      setReplayLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="page-header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>Activity Simulator</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Log real activities against the backend. Rate limit: max 5 actions per 10 seconds.
        </p>
      </div>

      {/* Time info */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Client Time</div>
            <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{clientTime}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Server Time (last response)</div>
            <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
              {serverTime || '—'}
            </div>
          </div>
        </div>
        {timeDiff !== null && (
          <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: Number(timeDiff) > 30 ? '#ef4444' : 'var(--text-secondary)' }}>
            Δ {timeDiff}s between client and server
            {Number(timeDiff) > 30 && ' — exceeds 30s replay threshold'}
          </div>
        )}
      </div>

      {/* Rate limit status */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Actions in last 10s
          </span>
          <span style={{
            fontSize: '0.85rem', fontWeight: 700,
            color: rateLimited ? '#ef4444' : actionsInWindow >= 4 ? '#f59e0b' : '#10b981',
          }}>
            {actionsInWindow} / 5 {rateLimited && '— RATE LIMITED'}
          </span>
        </div>
        <div className="progress-bar" style={{ height: 6 }}>
          <div style={{
            height: '100%',
            borderRadius: 'inherit',
            width: `${Math.min((actionsInWindow / 5) * 100, 100)}%`,
            background: rateLimited ? '#ef4444' : actionsInWindow >= 4 ? '#f59e0b' : 'var(--accent)',
            transition: 'width 0.3s, background 0.3s',
          }} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Log Activity</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {ACTIONS.map((action) => (
            <button
              key={action}
              className="btn btn-primary"
              style={{ minWidth: 90, opacity: rateLimited || loading ? 0.5 : 1 }}
              disabled={rateLimited || loading}
              onClick={() => logAction(action)}
            >
              {action}
            </button>
          ))}
        </div>
        {rateLimited && (
          <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: '#ef4444' }}>
            Buttons disabled — rate limit hit. They will re-enable in ~10 seconds.
          </p>
        )}
      </div>

      {/* Last activity result */}
      {lastResult && (
        <div className="card" style={{
          marginBottom: '1.25rem', padding: '1rem 1.25rem',
          borderLeft: `4px solid ${lastResult.type === 'success' ? '#10b981' : '#ef4444'}`,
        }}>
          <span style={{ fontSize: '0.85rem', color: lastResult.type === 'success' ? '#10b981' : '#ef4444' }}>
            {lastResult.message}
          </span>
        </div>
      )}
      {error && (
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', borderLeft: '4px solid #ef4444' }}>
          <span style={{ fontSize: '0.85rem', color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {/* Replay check */}
      <div className="card" style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>Replay Check</div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Validates client time against server time (±30s) and detects duplicate actions within 3 seconds.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={replayAction}
            onChange={(e) => setReplayAction(e.target.value)}
            className="form-input"
            style={{ width: 'auto', minWidth: 120 }}
          >
            {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            className="btn btn-primary"
            onClick={runReplayCheck}
            disabled={replayLoading}
            style={{ opacity: replayLoading ? 0.6 : 1 }}
          >
            {replayLoading ? 'Checking…' : 'Check Replay'}
          </button>
        </div>
        {replayResult && (
          <div style={{
            marginTop: '0.75rem', padding: '0.75rem 1rem',
            borderLeft: `4px solid ${replayResult.type === 'success' ? '#10b981' : '#ef4444'}`,
            background: 'var(--bg-secondary)', borderRadius: 6,
          }}>
            <span style={{ fontSize: '0.85rem', color: replayResult.type === 'success' ? '#10b981' : '#ef4444' }}>
              {replayResult.message}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivitySimulatorPage;
