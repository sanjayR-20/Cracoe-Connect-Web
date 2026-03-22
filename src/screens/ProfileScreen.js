import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/ProfileScreen.css';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const currentUser = useDataStore((state) => state.getCurrentUser());
  const updateUserProfile = useDataStore((state) => state.updateUserProfile);
  const changePassword = useDataStore((state) => state.changePassword);

  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editData, setEditData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const photoInputRef = useRef(null);

  if (!currentUser) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>User not found</p>
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditData({
      name: currentUser.name || '',
      email: currentUser.email || '',
      profilePhoto: currentUser.profilePhoto || '',
      phone: currentUser.phone || '',
      location: currentUser.location || '',
      shortBio: currentUser.shortBio || '',
      education: currentUser.education || '',
      github: currentUser.github || '',
      linkedin: currentUser.linkedin || '',
      skills: currentUser.skills || [],
      interests: currentUser.interests || [],
      experience: currentUser.experience || ''
    });
    setIsEditing(true);
    setError('');
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setEditData((prev) => ({
        ...prev,
        profilePhoto: String(reader.result || ''),
      }));
      setError('');
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      await updateUserProfile(currentUser.id, editData);
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setError('');
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
      setIsChangingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      alert('Password changed successfully');
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const formatSkills = (skills) => {
    if (!skills || skills.length === 0) return 'Not specified';
    return Array.isArray(skills) ? skills.join(', ') : skills;
  };

  const formatInterests = (interests) => {
    if (!interests || interests.length === 0) return 'Not specified';
    return Array.isArray(interests) ? interests.join(', ') : interests;
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <div className="profile-header">
        <div className="header-left">
          <h1>Profile</h1>
        </div>
        <div className="header-actions">
          <button className="btn-back" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          {!isEditing && !isChangingPassword && (
            <>
              <button className="btn-edit" onClick={handleEdit}>
                ✏️ Edit Profile
              </button>
              <button className="btn-password" onClick={() => setIsChangingPassword(true)}>
                🔒 Change Password
              </button>
            </>
          )}
          {isEditing && (
            <>
              <button className="btn-save" onClick={handleSave} disabled={loading}>
                {loading ? '⏳' : '💾'} Save
              </button>
              <button className="btn-cancel" onClick={handleCancel}>
                ✖️ Cancel
              </button>
            </>
          )}
          {isChangingPassword && (
            <>
              <button className="btn-save" onClick={handlePasswordChange} disabled={loading}>
                {loading ? '⏳' : '🔒'} Update Password
              </button>
              <button className="btn-cancel" onClick={() => setIsChangingPassword(false)}>
                ✖️ Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '16px 24px',
          color: 'var(--vibrant-red)',
          background: 'var(--red-10)',
          borderRadius: 'var(--radius-small)',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {/* Content */}
      <div className="profile-content">
        {/* Lanyard Section */}
        <div className="lanyard-section">
          <div className="lanyard-container">
            <div className="id-card">
              <div className="card-header">
                <div className="company-logo">CRACOE</div>
              </div>
              <div className="card-body">
                <div className="profile-photo">
                  {currentUser.profilePhoto ? (
                    <img src={currentUser.profilePhoto} alt="Profile" />
                  ) : (
                    <div className="photo-placeholder">
                      {getInitials(currentUser.name)}
                    </div>
                  )}
                </div>
                <div className="card-info">
                  <h3>{currentUser.name}</h3>
                  <p>{currentUser.designation}</p>
                  <div className="employee-id">ID: {currentUser.id.slice(-8).toUpperCase()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="profile-details">
          {/* Basic Information */}
          <div className="detail-section">
            <div className="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
              <h2>Basic Information</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label>Profile Photo</label>
                {isEditing ? (
                  <div className="photo-edit-row">
                    <div className="photo-edit-preview">
                      {editData.profilePhoto ? (
                        <img src={editData.profilePhoto} alt="Profile preview" />
                      ) : (
                        <div className="photo-preview-placeholder">
                          {getInitials(editData.name || currentUser.name)}
                        </div>
                      )}
                    </div>
                    <div className="photo-edit-controls">
                      <input
                        type="url"
                        className="edit-input"
                        value={editData.profilePhoto || ''}
                        onChange={(e) => setEditData({ ...editData, profilePhoto: e.target.value })}
                        placeholder="Paste image URL or upload below"
                      />
                      <input
                        ref={photoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{ display: 'none' }}
                      />
                      <button
                        type="button"
                        className="btn-upload-photo"
                        onClick={() => photoInputRef.current?.click()}
                      >
                        Upload Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <span>{currentUser.profilePhoto ? 'Photo added' : 'No photo uploaded'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.name}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    className="edit-input"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.email}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    className="edit-input"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.phone || 'Not provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.location || 'Not specified'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Designation</label>
                <span>{currentUser.designation}</span>
              </div>
              <div className="detail-item">
                <label>Points</label>
                <span className="points-display">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {currentUser.points || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="detail-section">
            <div className="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 0 0-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
              </svg>
              <h2>Professional Details</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-item full-width">
                <label>Bio</label>
                {isEditing ? (
                  <textarea
                    className="edit-textarea"
                    value={editData.shortBio}
                    onChange={(e) => setEditData({...editData, shortBio: e.target.value})}
                    placeholder="Tell us about yourself..."
                  />
                ) : (
                  <span>{currentUser.shortBio || 'No bio provided'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Education</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={editData.education}
                    onChange={(e) => setEditData({...editData, education: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.education || 'Not specified'}</span>
                )}
              </div>
              <div className="detail-item">
                <label>Experience</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={editData.experience}
                    onChange={(e) => setEditData({...editData, experience: e.target.value})}
                  />
                ) : (
                  <span>{currentUser.experience || 'Not specified'}</span>
                )}
              </div>
              <div className="detail-item full-width">
                <label>Skills</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={Array.isArray(editData.skills) ? editData.skills.join(', ') : editData.skills}
                    onChange={(e) => setEditData({...editData, skills: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="JavaScript, React, Node.js..."
                  />
                ) : (
                  <span>{formatSkills(currentUser.skills)}</span>
                )}
              </div>
              <div className="detail-item full-width">
                <label>Interests</label>
                {isEditing ? (
                  <input
                    type="text"
                    className="edit-input"
                    value={Array.isArray(editData.interests) ? editData.interests.join(', ') : editData.interests}
                    onChange={(e) => setEditData({...editData, interests: e.target.value.split(',').map(s => s.trim())})}
                    placeholder="Technology, Sports, Music..."
                  />
                ) : (
                  <span>{formatInterests(currentUser.interests)}</span>
                )}
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="detail-section">
            <div className="section-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H8C6.34 1 5 2.34 5 4v16c0 1.66 1.34 3 3 3h8c1.66 0 3-1.34 3-3V4c0-1.66-1.34-3-3-3zM14 21h-4v-1h4v1zm1.25-3H8.75V4h6.5v14z"/>
              </svg>
              <h2>Social Links</h2>
            </div>
            <div className="detail-grid">
              <div className="detail-item">
                <label>GitHub</label>
                {isEditing ? (
                  <input
                    type="url"
                    className="edit-input"
                    value={editData.github}
                    onChange={(e) => setEditData({...editData, github: e.target.value})}
                    placeholder="https://github.com/username"
                  />
                ) : (
                  <span>
                    {currentUser.github ? (
                      <a href={currentUser.github} target="_blank" rel="noopener noreferrer">
                        {currentUser.github}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </span>
                )}
              </div>
              <div className="detail-item">
                <label>LinkedIn</label>
                {isEditing ? (
                  <input
                    type="url"
                    className="edit-input"
                    value={editData.linkedin}
                    onChange={(e) => setEditData({...editData, linkedin: e.target.value})}
                    placeholder="https://linkedin.com/in/username"
                  />
                ) : (
                  <span>
                    {currentUser.linkedin ? (
                      <a href={currentUser.linkedin} target="_blank" rel="noopener noreferrer">
                        {currentUser.linkedin}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Password Change Form */}
          {isChangingPassword && (
            <div className="detail-section">
              <div className="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                </svg>
                <h2>Change Password</h2>
              </div>
              <div className="password-form">
                <input
                  type="password"
                  className="edit-input"
                  placeholder="Current Password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                />
                <input
                  type="password"
                  className="edit-input"
                  placeholder="New Password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                />
                <input
                  type="password"
                  className="edit-input"
                  placeholder="Confirm New Password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                />
              </div>
            </div>
          )}

          {/* Permissions */}
          {currentUser.permissions && (
            <div className="detail-section">
              <div className="section-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
                <h2>Permissions</h2>
              </div>
              <div className="permissions-grid">
                <div className="permission-item">
                  <span className="permission-name">Assign Tasks</span>
                  <span className={`permission-status ${currentUser.permissions.canAssignTask ? 'granted' : 'denied'}`}>
                    {currentUser.permissions.canAssignTask ? 'Granted' : 'Denied'}
                  </span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Make Announcements</span>
                  <span className={`permission-status ${currentUser.permissions.canAnnounce ? 'granted' : 'denied'}`}>
                    {currentUser.permissions.canAnnounce ? 'Granted' : 'Denied'}
                  </span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Add Users</span>
                  <span className={`permission-status ${currentUser.permissions.canAddUser ? 'granted' : 'denied'}`}>
                    {currentUser.permissions.canAddUser ? 'Granted' : 'Denied'}
                  </span>
                </div>
                <div className="permission-item">
                  <span className="permission-name">Remove Users</span>
                  <span className={`permission-status ${currentUser.permissions.canRemoveUser ? 'granted' : 'denied'}`}>
                    {currentUser.permissions.canRemoveUser ? 'Granted' : 'Denied'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileScreen;
