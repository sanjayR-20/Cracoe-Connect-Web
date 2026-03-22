import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import TaskItem from '../components/TaskItem';
import '../styles/EmployeeDetail.css';
import { ArrowLeft, Mail, Briefcase } from 'lucide-react';
import { extractWorkType, getWorkTypeLabel, WORK_TYPE_OPTIONS } from '../lib/workTypeUtils';

export default function EmployeeDetailScreen() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { getUser, getTasksForUser, updateTask, getCurrentUser, updateUserByAdmin } = useDataStore((state) => ({
    getUser: state.getUser,
    getTasksForUser: state.getTasksForUser,
    updateTask: state.updateTask,
    getCurrentUser: state.getCurrentUser,
    updateUserByAdmin: state.updateUserByAdmin,
  }));

  const employee = getUser(employeeId);
  const employeeTasks = getTasksForUser(employeeId);
  const currentUser = getCurrentUser();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState(null);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const isSharveshAdmin = useMemo(() => {
    const username = String(currentUser?.username || '').trim().toLowerCase();
    const name = String(currentUser?.name || '').trim().toLowerCase();
    return currentUser?.designation === 'CEO' || username === 'sharvesh' || name === 'sharvesh s';
  }, [currentUser]);

  const canCompleteTask = (task) => {
    if (!currentUser) return false;
    if (task.status === 'Completed') return false;

    const isOwner = task.assignedToId.includes(currentUser.id) && currentUser.id === employeeId;
    const isAdmin = isSharveshAdmin || ['Shree Vardhan'].includes(currentUser.name);

    return isOwner || isAdmin;
  };

  const permissionEntries = useMemo(() => {
    return Object.entries(employee?.permissions || {}).filter(([, value]) => typeof value === 'boolean');
  }, [employee]);

  const beginEditProfile = () => {
    if (!employee) return;
    setSaveError('');
    setSaveSuccess('');
    setEditData({
      name: employee.name || '',
      email: employee.email || '',
      designation: employee.designation || 'Team Member',
      workType: extractWorkType(employee),
      phone: employee.phone || '',
      location: employee.location || '',
      shortBio: employee.shortBio || '',
    });
    setIsEditingProfile(true);
  };

  const cancelEditProfile = () => {
    setIsEditingProfile(false);
    setEditData(null);
    setSaveError('');
  };

  const saveProfileChanges = async () => {
    if (!employee || !editData) return;

    if (!editData.name.trim()) {
      setSaveError('Name is required.');
      return;
    }
    if (!editData.email.trim()) {
      setSaveError('Email is required.');
      return;
    }

    try {
      await updateUserByAdmin(employee.id, {
        name: editData.name.trim(),
        email: editData.email.trim(),
        designation: editData.designation.trim(),
        workType: editData.workType,
        phone: editData.phone.trim(),
        location: editData.location.trim(),
        shortBio: editData.shortBio.trim(),
      });
      setSaveSuccess('User profile updated successfully.');
      setSaveError('');
      setIsEditingProfile(false);
    } catch (error) {
      setSaveError(error?.message || 'Unable to update profile.');
    }
  };

  if (!employee) {
    return (
      <div className="employee-detail-container">
        <p>Employee not found</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="employee-detail-container">
      <header className="detail-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
      </header>

      <div className="detail-content">
        <div className="employee-header">
          {employee.profilePhoto ? (
            <img src={employee.profilePhoto} alt={employee.name} className="employee-avatar-img" />
          ) : (
            <div className="employee-avatar">{employee.name.charAt(0)}</div>
          )}
          <div className="employee-info">
            <h1>{employee.name}</h1>
            <p className="designation">{employee.designation}</p>
            <div className={`employee-work-type ${extractWorkType(employee)}`}>
              {getWorkTypeLabel(extractWorkType(employee))}
            </div>
            <div className="contact-info">
              <div className="info-item">
                <Mail size={16} />
                <span>{employee.email}</span>
              </div>
              <div className="info-item">
                <Briefcase size={16} />
                <span>{employee.designation}</span>
              </div>
            </div>
          </div>
        </div>

        {isSharveshAdmin && (
          <div className="admin-edit-section">
            <div className="admin-edit-header">
              <h3>Sharvesh Controls</h3>
              {!isEditingProfile ? (
                <button className="btn-edit-profile" onClick={beginEditProfile}>
                  Edit This User
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-save-profile" onClick={saveProfileChanges}>
                    Save Changes
                  </button>
                  <button className="btn-cancel-profile" onClick={cancelEditProfile}>
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {saveError && <div className="admin-edit-error">{saveError}</div>}
            {saveSuccess && <div className="admin-edit-success">{saveSuccess}</div>}

            {isEditingProfile && editData && (
              <div className="admin-edit-grid">
                <label>
                  Name
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(event) => setEditData({ ...editData, name: event.target.value })}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(event) => setEditData({ ...editData, email: event.target.value })}
                  />
                </label>
                <label>
                  Designation
                  <input
                    type="text"
                    value={editData.designation}
                    onChange={(event) => setEditData({ ...editData, designation: event.target.value })}
                  />
                </label>
                <label>
                  Work Type
                  <select
                    value={editData.workType}
                    onChange={(event) => setEditData({ ...editData, workType: event.target.value })}
                  >
                    {WORK_TYPE_OPTIONS.map((workType) => (
                      <option key={`worktype-${workType}`} value={workType}>
                        {getWorkTypeLabel(workType)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Phone
                  <input
                    type="text"
                    value={editData.phone}
                    onChange={(event) => setEditData({ ...editData, phone: event.target.value })}
                  />
                </label>
                <label>
                  Location
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(event) => setEditData({ ...editData, location: event.target.value })}
                  />
                </label>
                <label className="full-width">
                  Short Bio
                  <textarea
                    rows={3}
                    value={editData.shortBio}
                    onChange={(event) => setEditData({ ...editData, shortBio: event.target.value })}
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <div className="permissions-section">
          <h3>Permissions</h3>
          <div className="permissions-grid">
            {permissionEntries.map(([key, value]) => (
              <div key={key} className="permission-item">
                <span className="permission-name">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                <span className={`permission-value ${value ? 'allowed' : 'denied'}`}>
                  {value ? 'Allowed' : 'Denied'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="tasks-section">
          <h3>Assigned Tasks ({employeeTasks.length})</h3>
          {employeeTasks.length === 0 ? (
            <p className="no-tasks">No tasks assigned</p>
          ) : (
            <div className="tasks-list">
              {employeeTasks.map((task) => (
                <div key={task.id} className="task-item-wrapper">
                  <TaskItem task={task} />
                  {canCompleteTask(task) && (
                    <button
                      className="btn-complete-task"
                      onClick={() => updateTask(task.id, { status: 'Completed' })}
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}