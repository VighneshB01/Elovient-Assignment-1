import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import CommandPalette from '../components/CommandPalette';
import { useSelector, useDispatch } from 'react-redux';
import { fetchTasks } from '../features/tasks/taskSlice';
import { addNotification } from '../features/notifications/notificationSlice';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';

// In dev the Vite proxy doesn't handle WebSocket upgrades,
// so we connect directly to the backend server.
// In production, set VITE_SOCKET_URL to your backend root (e.g. https://api.render.com)
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
  'http://localhost:5000';

const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false // We will connect it manually when the user logs in
});

function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (!user) return;
    
    // Explicitly connect for the user
    socket.connect();
    
    // Clear out any stale listeners to be absolutely bullet-proof
    socket.off('connect');
    socket.off('task_assigned');
    socket.off('task_updated');
    socket.offAny();

    socket.on('connect', () => {
      console.log('🔗 Connected to WebSocket successfully. Joining room:', user._id);
      socket.emit('join_user_room', user._id);
    });

    socket.onAny((eventName, ...args) => {
      console.log(`[Socket Dump] Natively intercepted: ${eventName}`, args);
    });

    socket.on('task_assigned', (task) => {
      console.log('⚡ Socket event received: task_assigned', task);
      toast('You have been assigned a new task: ' + task.title, { icon: '⚡', style: { background: 'var(--accent)', color: '#fff', border: 'none' } });
      dispatch(addNotification({ title: 'New Assignment', message: 'You were assigned: ' + task.title, defaultIcon: '⚡' }));
      dispatch(fetchTasks());
    });

    socket.on('task_updated', (task) => {
      console.log('🔄 Socket event received: task_updated', task);
      toast('A task assigned to you was updated: ' + task.title, { icon: '🔄', style: { background: 'var(--bg-card)', color: 'var(--text-primary)', border: '1px solid var(--accent)' } });
      dispatch(addNotification({ title: 'Task Updated', message: 'Update on task: ' + task.title, defaultIcon: '🔄' }));
      dispatch(fetchTasks()); 
    });

    // Cleanup: gracefully disconnect when component unmounts fully
    return () => {
      socket.off('connect');
      socket.off('task_assigned');
      socket.off('task_updated');
      socket.offAny();
      socket.disconnect();
    };
  }, [user, dispatch]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)' }}>
      <CommandPalette />
      
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 20,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      {/* Sidebar wrapper — fixed+sliding on mobile, sticky-column on desktop */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0,
        height: '100%',
        zIndex: 30,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s cubic-bezier(.22,1,.36,1)',

        // Desktop override via @media inline trick
      }} className="layout-sidebar-mobile">
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Desktop sidebar (always visible, takes up space in flex) */}
      <div className="layout-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Content column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main style={{
          flex: 1,
          padding: 'clamp(1rem, 3vw, 2rem)',
          overflowY: 'auto',
        }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        .layout-sidebar-mobile  { display: flex; }
        .layout-sidebar-desktop { display: none; }

        @media (min-width: 1024px) {
          .layout-sidebar-mobile  { display: none; }
          .layout-sidebar-desktop {
            display: flex;
            position: sticky;
            top: 0;
            height: 100vh;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
  );
}

export default MainLayout;
