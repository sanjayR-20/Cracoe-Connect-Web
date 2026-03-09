import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/AdminPanel.css';
import { ArrowLeft, Lock, Unlock, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminPanelScreen() {
  const navigate = useNavigate();
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const users = useDataStore((state) => state.users);
  const updateUserPermission = useDataStore((state) => state.updateUserPermission);
  const getUser = useDataStore((state) => state.getUser);
  const addUser = useDataStore((state) => state.addUser);
  const removeUser = useDataStore((state) => state.removeUser);

  const defaultPermissions = {
    canAssignTasks: false,
    canViewAdmin: false,
    canManageTeam: false,
    canViewAllTasks: false,
    canEditAllTasks: false,
    canAnnounce: false,
    canSchedule: false,
    canViewMeetingMinutes: false,
    canManageMeetingMinutes: false,
  };

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    password: '',
    designation: 'Developer',
    email: '',
    permissions: { ...defaultPermissions },
  });
  const [userError, setUserError] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);

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

  const handleAddUser = () => {
    setUserError('');
    if (!newUser.name.trim() || !newUser.username.trim() || !newUser.password.trim()) {
      setUserError('Name, username, and password are required.');
      return;
    }
    if (!newUser.email.trim()) {
      setUserError('Email is required.');
      return;
    }
    const exists = users.some((u) => u.username.toLowerCase() === newUser.username.toLowerCase());
    if (exists) {
      setUserError('Username already exists.');
      return;
    }

    const user = {
      id: `user_${Date.now()}`,
      name: newUser.name.trim(),
      username: newUser.username.trim().toLowerCase(),
      password: newUser.password.trim(),
      designation: newUser.designation,
      email: newUser.email.trim(),
      permissions: newUser.permissions,
      profileCompleted: false,
      points: 0,
    };

    addUser(user);
    setNewUser({ 
      name: '', 
      username: '', 
      password: '', 
      designation: 'Developer', 
      email: '',
      permissions: { ...defaultPermissions },
    });
    setShowPermissions(false);
  };

  const handleNewUserPermissionToggle = (permissionKey) => {
    setNewUser({
      ...newUser,
      permissions: {
        ...newUser.permissions,
        [permissionKey]: !newUser.permissions[permissionKey],
      },
    });
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
        <div className="add-employee">
          <h2>Add Employee</h2>
          <div className="add-employee-form">
            <input
              type="text"
              placeholder="Full Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <select
              value={newUser.designation}
              onChange={(e) => setNewUser({ ...newUser, designation: e.target.value })}
            >
              <option>CEO</option>
              <option>COO</option>
              <option>CTO</option>
              <option>CFO</option>
              <option>Manager</option>
              <option>Marketing Lead</option>
              <option>Developer</option>
            </select>

            {/* Permission Selection Section */}
            <div className="permission-selection">
              <button 
                type="button" 
                className="permission-toggle-btn"
                onClick={() => setShowPermissions(!showPermissions)}
              >
                Set Permissions {showPermissions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              
              {showPermissions && (
                <div className="new-user-permissions">
                  {Object.entries(permissionLabels).map(([key, label]) => (
                    <div key={key} className="permission-checkbox">
                      <label>
                        <input
                          type="checkbox"
                          checked={newUser.permissions[key]}
                          onChange={() => handleNewUserPermissionToggle(key)}
                        />
                        {label}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button className="btn-primary" onClick={handleAddUser}>
              Add Employee
            </button>
          </div>
          {userError && <div className="error-message">{userError}</div>}
        </div>

        <div className="permissions-management">
          {users.map((user) => (
            <div key={user.id} className="user-permission-card">
              <div className="user-header">
                <div className="user-avatar">{user.name.charAt(0)}</div>
                <div className="user-name-role">
                  <h3>{user.name}</h3>
                  <p>{user.designation}</p>
                </div>
                {user.designation !== 'CEO' && (
                  <button
                    className="remove-user-btn"
                    onClick={() => removeUser(user.id)}
                  >
                    Remove
                  </button>
                )}
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
