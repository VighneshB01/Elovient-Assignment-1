import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Users, CheckSquare, Clock, TrendingUp, Download, Activity } from 'lucide-react';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import axiosInstance from '../api/axiosInstance';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function buildMonthGrid(data, key) {
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const found = data.find((m) => m._id.year === year && m._id.month === month);
    result.push({ name: MONTH_NAMES[month - 1], [key]: found ? found.count : 0 });
  }
  return result;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 14px', fontSize: '0.8rem',
        boxShadow: 'var(--shadow-md)',
      }}>
        <p style={{ fontWeight: 700, marginBottom: 4, color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((p) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>
      {children}
    </h3>
  );
}

function DashboardPage() {
  const { user } = useSelector((s) => s.auth);
  const { mode } = useSelector((s) => s.theme);
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [myStats, setMyStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (isAdmin) {
          const { data } = await axiosInstance.get('/analytics');
          setStats(data.data);
        } else {
          const { data } = await axiosInstance.get('/analytics/me');
          setMyStats(data.data);
        }
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [isAdmin]);

  const handleExportCSV = () => {
    if (!stats) return;
    const { summary } = stats;
    const csvContent = "Metric,Value\n" +
      `Total Users,${summary.totalUsers}\n` +
      `Total Tasks,${summary.totalTasks}\n` +
      `Todo Tasks,${summary.todoTasks}\n` +
      `In Progress Tasks,${summary.inProgressTasks}\n` +
      `Completed Tasks,${summary.completedTasks}\n`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'activity_analytics.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const gridColor = mode === 'dark' ? '#1f2937' : '#e4e7ed';
  const textColor = mode === 'dark' ? '#6b7280' : '#9ca3af';

  if (loading) return <Spinner center size="lg" />;

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>{isAdmin ? 'Platform Overview' : 'My Dashboard'}</h2>
        </div>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #ef4444' }}>
          <p style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div className="page-header" style={{ marginBottom: 0 }}>
          <h2>{isAdmin ? 'Platform Overview' : 'My Dashboard'}</h2>
          <p>{isAdmin ? 'Platform-wide analytics and activity' : 'Your personal task summary'}</p>
        </div>
        
        {isAdmin && stats && (
          <button onClick={handleExportCSV} className="btn btn-ghost" style={{ gap: 6 }}>
            <Download size={15} /> Export CSV
          </button>
        )}
      </div>

      {/* ── Admin Dashboard ── */}
      {isAdmin && stats && (
        <>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '1rem' }}>
            <StatCard title="Total Users"   value={stats.summary.totalUsers}      icon={Users}       color="indigo" trend={stats.summary.trends.users} />
            <StatCard title="Total Tasks"   value={stats.summary.totalTasks}      icon={CheckSquare} color="violet" trend={stats.summary.trends.tasks} />
            <StatCard title="Completed"     value={stats.summary.completedTasks}  icon={TrendingUp}  color="emerald" trend={stats.summary.trends.completed} />
            <StatCard title="In Progress"   value={stats.summary.inProgressTasks} icon={Clock}       color="amber" />
          </div>

          {/* Charts row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {/* Area chart — task activity */}
            <div className="card">
              <SectionTitle>Task Activity — Last 6 Months</SectionTitle>
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={buildMonthGrid(stats.monthlyTasks, 'tasks')}>
                  <defs>
                    <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#5b5ef4" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#5b5ef4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="tasks" name="Tasks" stroke="#5b5ef4" strokeWidth={2.5}
                    fill="url(#taskGrad)" dot={{ r: 3.5, fill: '#5b5ef4', strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: '#5b5ef4' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Bar chart — new users */}
            <div className="card">
              <SectionTitle>New Users — Last 6 Months</SectionTitle>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={buildMonthGrid(stats.monthlyUsers, 'users')} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: textColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" name="Users" fill="#7c7ff5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Task status breakdown */}
          <div className="card">
            <SectionTitle>Task Status Breakdown</SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
              {[
                { label: 'To Do',       value: stats.summary.todoTasks,       color: 'var(--c-todo)' },
                { label: 'In Progress', value: stats.summary.inProgressTasks, color: 'var(--c-progress)' },
                { label: 'Done',        value: stats.summary.completedTasks,  color: 'var(--c-done)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{value}</span>
                </div>
              ))}
            </div>
            {stats.summary.totalTasks > 0 && (
              <div className="progress-bar" style={{ marginTop: '1rem' }}>
                <div style={{ height: '100%', display: 'flex', borderRadius: 999 }}>
                  {[
                    { pct: (stats.summary.todoTasks / stats.summary.totalTasks) * 100,       color: 'var(--c-todo)' },
                    { pct: (stats.summary.inProgressTasks / stats.summary.totalTasks) * 100, color: 'var(--c-progress)' },
                    { pct: (stats.summary.completedTasks / stats.summary.totalTasks) * 100,  color: 'var(--c-done)' },
                  ].map(({ pct, color }, i) => (
                    <div key={i} style={{
                      width: `${pct}%`, background: color, height: 6,
                      borderRadius: i === 0 ? '999px 0 0 999px' : i === 2 ? '0 999px 999px 0' : 0,
                      transition: 'width 0.8s cubic-bezier(.22,1,.36,1)',
                    }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity Log */}
          {stats.recentActivity && stats.recentActivity.length > 0 && (
            <div className="card">
              <SectionTitle>Global Activity Log</SectionTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {stats.recentActivity.map((task) => (
                  <div key={task._id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)'
                    }}>
                      <Activity size={16} />
                    </div>
                    <div style={{ flex: 1, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                        <strong>{task.createdBy?.name || 'System'}</strong> updated task <strong>{task.title}</strong>
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Status changed to "{task.status}" • {new Date(task.updatedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── User Dashboard ── */}
      {!isAdmin && myStats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <StatCard title="My Tasks"    value={myStats.total}      icon={CheckSquare} color="indigo" />
            <StatCard title="To Do"       value={myStats.todo}       icon={Clock}       color="amber" />
            <StatCard title="In Progress" value={myStats.inProgress} icon={TrendingUp}  color="violet" />
            <StatCard title="Done"        value={myStats.done}       icon={CheckSquare} color="emerald" />
          </div>

          {myStats.total > 0 && (
            <div className="card">
              <SectionTitle>Completion Rate</SectionTitle>
              <p style={{ fontSize: '3rem', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--text-primary)', lineHeight: 1 }}>
                {Math.round((myStats.done / myStats.total) * 100)}<span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>%</span>
              </p>
              <div className="progress-bar" style={{ marginTop: '1rem' }}>
                <div className="progress-fill" style={{
                  width: `${(myStats.done / myStats.total) * 100}%`,
                  background: 'linear-gradient(90deg, #5b5ef4, #10b981)',
                }} />
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                {myStats.done} of {myStats.total} tasks completed
              </p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {!isAdmin && !myStats?.total && !loading && (
        <div className="card empty-state">
          <CheckSquare size={36} color="var(--accent)" style={{ opacity: 0.5 }} />
          <p>No tasks yet</p>
          <span>Create your first task to see your dashboard come alive.</span>
        </div>
      )}

      {/* No data for admin */}
      {isAdmin && !stats && !loading && (
        <div className="card empty-state">
          <TrendingUp size={36} color="var(--accent)" style={{ opacity: 0.5 }} />
          <p>No analytics data yet</p>
          <span>Data will appear once users and tasks are created.</span>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
