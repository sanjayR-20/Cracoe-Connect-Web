import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/AdminPanel.css';
import { ArrowLeft, Lock, Unlock } from 'lucide-react';

export default function AdminPanelScreen() {
  const navigate = useNavigate();
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const users = useDataStore((state) => state.users);
  const updateUserPermission = useDataStore((state) => state.updateUserPermission);
  const getUser = useDataStore((state) => state.getUser);

  const currentUser = getCurrentUser();

  if (currentUser?.designation !== 'CEO') {
    return (
      <div className="admin-panel-container">
        <div className="access-denied">
          <Lock size={48} />
          <h2>Access Denied</h2>
          <p>Admin panel is only available for the CEO</p>
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const handlePermissionToggle = (userId, permissionKey) => {
    const user = getUser(userId);
    const currentValue = user.permissions[permissionKey];
    updateUserPermission(userId, permissionKey, !currentValue);
  };

  const permissionLabels = {
    canAssignTasks: 'Can Assign Tasks',
    canViewAdmin: 'Can View Admin',
    canManageTeam: 'Can Manage Team',
    canViewAllTasks: 'Can View All Tasks',
    canEditAllTasks: 'Can Edit All Tasks',
    canAnnounce: 'Can Announce',
    canSchedule: 'Can Schedule',
    canViewMeetingMinutes: 'Can View Meeting Minutes',
    canManageMeetingMinutes: 'Can Manage Meeting Minutes',
  };

  return (
    <div className="admin-panel-container">
      <header className="admin-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
        <h1>Admin Panel - Permission Management</h1>
      </header>

      <div className="admin-content">
        <div className="permissions-management">
          {users.map((user) => (
            <div key={user.id} className="user-permission-card">
              <div className="user-header">
                <div className="user-avatar">{user.name.charAt(0)}</div>
                <div className="user-name-role">
                  <h3>{user.name}</h3>
                  <p>{user.designation}</p>
                </div>
              </div>

              <div className="permissions-toggles">
                {Object.entries(permissionLabels).map(([key, label]) => (
                  <div key={key} className="permission-toggle">
                    <label>{label}</label>
                    <button
                      className={`toggle-switch ${user.permissions[key] ? 'active' : ''}`}
                      onClick={() => handlePermissionToggle(user.id, key)}
                    >
                      {user.permissions[key] ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
