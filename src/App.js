import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDataStore } from './store/dataStore';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import EmployeeDetailScreen from './screens/EmployeeDetailScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import VideoMeetScreen from './screens/VideoMeetScreen';
import ProfileSetupScreen from './screens/ProfileSetupScreen';
import ProfileScreen from './screens/ProfileScreen';
import './styles/index.css';

function ProtectedRoute({ children }) {
  const currentUserId = useDataStore((state) => state.currentUserId);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const location = useLocation();

  if (!currentUserId) {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to={`/?redirect=${encodeURIComponent(redirectTarget)}`} replace />;
  }

  const currentUser = getCurrentUser();
  const isMeetRoute = location.pathname.startsWith('/video-meet');
  
  // Check if profile is completed, redirect to profile setup if not
  // CEO (admin) is always considered to have completed profile.
  // Meeting links should still open directly after login, so skip this redirect for /video-meet.
  if (currentUser && !currentUser.profileCompleted && currentUser.designation !== 'CEO' && !isMeetRoute) {
    return <Navigate to="/profile-setup" replace />;
  }

  return children;
}

function ProfileSetupRoute({ children }) {
  const currentUserId = useDataStore((state) => state.currentUserId);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);

  if (!currentUserId) {
    return <Navigate to="/" replace />;
  }

  const currentUser = getCurrentUser();
  
  // If profile is already completed, redirect to dashboard
  if (currentUser && currentUser.profileCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  const initializeFromSupabase = useDataStore((state) => state.initializeFromSupabase);
  const supabaseLoading = useDataStore((state) => state.supabaseLoading);

  useEffect(() => {
    // Request notification permission on app load
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    initializeFromSupabase();
  }, [initializeFromSupabase]);

  if (supabaseLoading && !useDataStore.getState().currentUserId) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route
          path="/profile-setup"
          element={
            <ProfileSetupRoute>
              <ProfileSetupScreen />
            </ProfileSetupRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/:employeeId"
          element={
            <ProtectedRoute>
              <EmployeeDetailScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-task"
          element={
            <ProtectedRoute>
              <CreateTaskScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPanelScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/video-meet"
          element={
            <ProtectedRoute>
              <VideoMeetScreen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileScreen />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
