import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import ActivitySimulatorPage from './pages/ActivitySimulatorPage';
import StatsPage from './pages/StatsPage';
import SuspiciousPage from './pages/SuspiciousPage';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { user } = useSelector((state) => state.auth);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />
        <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/" replace />} />

        {/* Protected routes wrapped in MainLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/activity" element={<ActivitySimulatorPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/suspicious" element={<SuspiciousPage />} />
            {/* Admin-only */}
            <Route path="/users" element={<ProtectedRoute adminOnly />}>
              <Route index element={<UsersPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
