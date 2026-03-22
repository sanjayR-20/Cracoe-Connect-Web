import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/AdminPanel.css';
import { ArrowLeft, Lock, Unlock, ChevronDown, ChevronUp, Plus, Minus } from 'lucide-react';
import { extractWorkType, getWorkTypeLabel, WORK_TYPE_OPTIONS } from '../lib/workTypeUtils';

export default function AdminPanelScreen() {
  const navigate = useNavigate();
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const users = useDataStore((state) => state.users);
  const updateUserPermission = useDataStore((state) => state.updateUserPermission);
  const getUser = useDataStore((state) => state.getUser);
  const addUser = useDataStore((state) => state.addUser);
  const removeUser = useDataStore((state) => state.removeUser);
  const updateUserPoints = useDataStore((state) => state.updateUserPoints);
  const updateUserWorkType = useDataStore((state) => state.updateUserWorkType);

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
    workType: 'both',
    email: '',
    permissions: { ...defaultPermissions },
  });
  const [userError, setUserError] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);

  const currentUser = getCurrentUser();
  const isSharvesh =
    currentUser?.designation === 'CEO' ||
    currentUser?.username?.toLowerCase() === 'sharvesh' ||
    currentUser?.name === 'Sharvesh S';
  const isCEO = currentUser?.designation === 'CEO' || isSharvesh;
  const isCTO = currentUser?.designation === 'CTO';
  const hasAccess = isCEO || isCTO;

  if (!hasAccess) {
    return (
      <div className="admin-panel-container">
        <div className="access-denied">
          <Lock size={48} />
          <h2>Access Denied</h2>
          <p>Admin panel is only available for CEO and CTO</p>
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
      workType: newUser.workType,
      email: newUser.email.trim(),
      permissions: { ...newUser.permissions, workType: newUser.workType },
      profileCompleted: false,
      points: 0,
    };

    addUser(user);
    setNewUser({ 
      name: '', 
      username: '', 
      password: '', 
      designation: 'Developer', 
      workType: 'both',
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
        <h1>{isCEO ? 'Admin Panel - Permission Management' : 'Points Management'}</h1>
      </header>

      <div className="admin-content">
        {/* Add Employee section - CEO only */}
        {isCEO && (
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
                <option>Tester</option>
              </select>
              <select
                value={newUser.workType}
                onChange={(e) => setNewUser({ ...newUser, workType: e.target.value })}
              >
                {WORK_TYPE_OPTIONS.map((type) => (
                  <option key={`new-${type}`} value={type}>
                    {getWorkTypeLabel(type)}
                  </option>
                ))}
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
        )}

        <div className="permissions-management">
          {users.map((user) => {
            const showPoints = !['CEO', 'COO'].includes(user.designation);
            
            const handleAddPoints = async () => {
              try {
                await updateUserPoints(user.id, 10);
              } catch (error) {
                alert(error.message);
              }
            };

            const handleSubtractPoints = async () => {
              try {
                await updateUserPoints(user.id, -10);
              } catch (error) {
                alert(error.message);
              }
            };

            return (
              <div key={user.id} className="user-permission-card">
                <div className="user-header">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt={user.name} className="user-avatar-img" />
                  ) : (
                    <div className="user-avatar">{user.name.charAt(0)}</div>
                  )}
                  <div className="user-name-role">
                    <h3>{user.name}</h3>
                    <p>{user.designation}</p>
                    <span className={`work-type-chip ${extractWorkType(user)}`}>
                      {getWorkTypeLabel(extractWorkType(user))}
                    </span>
                  </div>
                  <div className="user-card-right">
                    {isCEO && (
                      <select
                        className="work-type-select"
                        value={extractWorkType(user)}
                        onChange={(event) => updateUserWorkType(user.id, event.target.value)}
                      >
                        {WORK_TYPE_OPTIONS.map((type) => (
                          <option key={`${user.id}-${type}`} value={type}>
                            {getWorkTypeLabel(type)}
                          </option>
                        ))}
                      </select>
                    )}
                    <button
                      className="view-profile-btn"
                      onClick={() => navigate(`/employee/${user.id}`)}
                    >
                      View Profile
                    </button>
                  </div>
                  {isCEO && user.designation !== 'CEO' && (
                    <button
                      className="remove-user-btn"
                      onClick={() => removeUser(user.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>

                {/* Points Management for non-CEO/COO */}
                {showPoints && (
                  <div className="points-management">
                    <span className="points-label">Points: {user.points || 0}</span>
                    <div className="points-controls">
                      <button className="points-btn subtract" onClick={handleSubtractPoints}>
                        <Minus size={16} />
                      </button>
                      <button className="points-btn add" onClick={handleAddPoints}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Permissions toggles - CEO only */}
                {isCEO && (
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
