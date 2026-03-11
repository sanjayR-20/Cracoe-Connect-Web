import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/ProfileScreen.css';
import { 
  ArrowLeft, 
  Camera, 
  User, 
  MapPin, 
  Globe, 
  Languages, 
  BookOpen, 
  Mail, 
  Phone, 
  Github, 
  Linkedin, 
  Briefcase, 
  Code, 
  Heart, 
  Award,
  Lock,
  Eye,
  EyeOff,
  Save,
  Edit2
} from 'lucide-react';

export default function ProfileScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const updateUserProfile = useDataStore((state) => state.updateUserProfile);
  const changePassword = useDataStore((state) => state.changePassword);

  const currentUser = getCurrentUser();

  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [profile, setProfile] = useState({
    profilePhoto: currentUser?.profilePhoto || '',
    name: currentUser?.name || '',
    location: currentUser?.location || '',
    gender: currentUser?.gender || '',
    nationality: currentUser?.nationality || '',
    knownLanguages: currentUser?.knownLanguages?.join(', ') || '',
    shortBio: currentUser?.shortBio || '',
    education: currentUser?.education || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    github: currentUser?.github || '',
    linkedin: currentUser?.linkedin || '',
    skills: currentUser?.skills?.join(', ') || '',
    projectsDone: currentUser?.projectsDone?.join(', ') || '',
    interests: currentUser?.interests?.join(', ') || '',
    experience: currentUser?.experience || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handlePhotoClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!profile.name.trim()) newErrors.name = 'Name is required';
    if (!profile.email.trim()) newErrors.email = 'Email is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    const profileData = {
      profilePhoto: profile.profilePhoto,
      name: profile.name.trim(),
      location: profile.location.trim(),
      gender: profile.gender,
      nationality: profile.nationality.trim(),
      knownLanguages: profile.knownLanguages.split(',').map((l) => l.trim()).filter(Boolean),
      shortBio: profile.shortBio.trim(),
      education: profile.education.trim(),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
      github: profile.github.trim(),
      linkedin: profile.linkedin.trim(),
      skills: profile.skills.split(',').map((s) => s.trim()).filter(Boolean),
      projectsDone: profile.projectsDone.split(',').map((p) => p.trim()).filter(Boolean),
      interests: profile.interests.split(',').map((i) => i.trim()).filter(Boolean),
      experience: profile.experience.trim(),
      profileCompleted: true,
    };

    try {
      await updateUserProfile(currentUser.id, profileData);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
    } catch (error) {
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setErrors({});

    if (!passwordData.currentPassword) {
      setErrors({ password: 'Current password is required' });
      return;
    }

    if (!passwordData.newPassword) {
      setErrors({ password: 'New password is required' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrors({ password: 'New password must be at least 6 characters' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'New passwords do not match' });
      return;
    }

    setLoading(true);

    try {
      await changePassword(currentUser.id, passwordData.currentPassword, passwordData.newPassword);
      setSuccessMessage('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setErrors({ password: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    navigate('/');
    return null;
  }

  const showPoints = !['CEO', 'COO'].includes(currentUser.designation);

  return (
    <div className="profile-screen-container">
      <header className="profile-header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={20} /> Back
        </button>
        <div className="header-actions">
          {!isEditing ? (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} /> Edit Profile
            </button>
          ) : (
            <button className="save-btn" onClick={handleSaveProfile} disabled={loading}>
              <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <button className="password-btn" onClick={() => setShowPasswordModal(true)}>
            <Lock size={18} /> Change Password
          </button>
        </div>
      </header>

      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}

      {errors.submit && (
        <div className="error-message">{errors.submit}</div>
      )}

      <div className="profile-content">
        {/* Profile Header Card */}
        <div className="profile-card main-card">
          <div className="profile-photo-section" onClick={handlePhotoClick}>
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Profile" className="profile-photo" />
            ) : (
              <div className="profile-photo-placeholder">
                <User size={48} />
              </div>
            )}
            {isEditing && (
              <div className="photo-overlay">
                <Camera size={24} />
                <span>Change Photo</span>
              </div>
            )}
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            hidden
          />
          <div className="profile-main-info">
            {isEditing ? (
              <>
                <input
                  type="text"
                  className="edit-input name-input"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="Your Name"
                />
                {errors.name && <span className="error">{errors.name}</span>}
              </>
            ) : (
              <h1>{currentUser.name}</h1>
            )}
            <p className="designation">{currentUser.designation}</p>
            {showPoints && (
              <div className="points-display">
                <Award size={18} />
                <span>{currentUser.points || 0} Points</span>
              </div>
            )}
          </div>
        </div>

        {/* Basic Information */}
        <div className="profile-card">
          <h2><User size={20} /> Basic Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label><MapPin size={16} /> Location</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                />
              ) : (
                <span>{currentUser.location || 'Not specified'}</span>
              )}
            </div>

            <div className="info-item">
              <label>Gender</label>
              {isEditing ? (
                <select
                  value={profile.gender}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer-not-to-say">Prefer not to say</option>
                </select>
              ) : (
                <span>{currentUser.gender || 'Not specified'}</span>
              )}
            </div>

            <div className="info-item">
              <label><Globe size={16} /> Nationality</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.nationality}
                  onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  placeholder="Your nationality"
                />
              ) : (
                <span>{currentUser.nationality || 'Not specified'}</span>
              )}
            </div>

            <div className="info-item">
              <label><Languages size={16} /> Languages</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.knownLanguages}
                  onChange={(e) => setProfile({ ...profile, knownLanguages: e.target.value })}
                  placeholder="English, Tamil (comma separated)"
                />
              ) : (
                <span>{currentUser.knownLanguages?.join(', ') || 'Not specified'}</span>
              )}
            </div>
          </div>

          <div className="info-item full-width">
            <label>Short Bio</label>
            {isEditing ? (
              <textarea
                value={profile.shortBio}
                onChange={(e) => setProfile({ ...profile, shortBio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            ) : (
              <p className="bio-text">{currentUser.shortBio || 'No bio provided'}</p>
            )}
          </div>

          <div className="info-item">
            <label><BookOpen size={16} /> Education</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="Your highest qualification"
              />
            ) : (
              <span>{currentUser.education || 'Not specified'}</span>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="profile-card">
          <h2><Mail size={20} /> Contact Information</h2>
          
          <div className="info-grid">
            <div className="info-item">
              <label><Mail size={16} /> Email</label>
              {isEditing ? (
                <>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="your.email@example.com"
                  />
                  {errors.email && <span className="error">{errors.email}</span>}
                </>
              ) : (
                <span>{currentUser.email}</span>
              )}
            </div>

            <div className="info-item">
              <label><Phone size={16} /> Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
              ) : (
                <span>{currentUser.phone || 'Not specified'}</span>
              )}
            </div>

            <div className="info-item">
              <label><Github size={16} /> GitHub</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  placeholder="github.com/username"
                />
              ) : (
                <span>{currentUser.github || 'Not specified'}</span>
              )}
            </div>

            <div className="info-item">
              <label><Linkedin size={16} /> LinkedIn</label>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/username"
                />
              ) : (
                <span>{currentUser.linkedin || 'Not specified'}</span>
              )}
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="profile-card">
          <h2><Briefcase size={20} /> Professional Information</h2>
          
          <div className="info-item full-width">
            <label><Code size={16} /> Skills</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="JavaScript, React, Node.js (comma separated)"
              />
            ) : (
              <div className="tags">
                {currentUser.skills?.length > 0 
                  ? currentUser.skills.map((skill, idx) => (
                      <span key={idx} className="tag">{skill}</span>
                    ))
                  : <span className="no-data">No skills listed</span>
                }
              </div>
            )}
          </div>

          <div className="info-item full-width">
            <label><Award size={16} /> Projects Done</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.projectsDone}
                onChange={(e) => setProfile({ ...profile, projectsDone: e.target.value })}
                placeholder="Project 1, Project 2 (comma separated)"
              />
            ) : (
              <div className="tags">
                {currentUser.projectsDone?.length > 0 
                  ? currentUser.projectsDone.map((project, idx) => (
                      <span key={idx} className="tag project">{project}</span>
                    ))
                  : <span className="no-data">No projects listed</span>
                }
              </div>
            )}
          </div>

          <div className="info-item full-width">
            <label><Heart size={16} /> Interests</label>
            {isEditing ? (
              <input
                type="text"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                placeholder="Coding, Music, Sports (comma separated)"
              />
            ) : (
              <div className="tags">
                {currentUser.interests?.length > 0 
                  ? currentUser.interests.map((interest, idx) => (
                      <span key={idx} className="tag interest">{interest}</span>
                    ))
                  : <span className="no-data">No interests listed</span>
                }
              </div>
            )}
          </div>

          <div className="info-item full-width">
            <label><Briefcase size={16} /> Experience</label>
            {isEditing ? (
              <textarea
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="Describe your work experience..."
                rows={3}
              />
            ) : (
              <p className="bio-text">{currentUser.experience || 'No experience details provided'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2><Lock size={20} /> Change Password</h2>
            
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                placeholder="Confirm new password"
              />
            </div>

            {errors.password && <div className="error-message">{errors.password}</div>}

            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowPasswordModal(false)}>
                Cancel
              </button>
              <button className="confirm-btn" onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
