import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDataStore } from './store/dataStore';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import EmployeeDetailScreen from './screens/EmployeeDetailScreen';
import CreateTaskScreen from './screens/CreateTaskScreen';
import AdminPanelScreen from './screens/AdminPanelScreen';
import VideoMeetScreen from './screens/VideoMeetScreen';
import './styles/index.css';

function ProtectedRoute({ children }) {
  const currentUserId = useDataStore((state) => state.currentUserId);

  if (!currentUserId) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const initializeFromSupabase = useDataStore((state) => state.initializeFromSupabase);

  useEffect(() => {
    // Request notification permission on app load
    if ('Notification' in window) {
      Notification.requestPermission();
    }
    initializeFromSupabase();
  }, [initializeFromSupabase]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginScreen />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
