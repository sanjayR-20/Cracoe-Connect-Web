import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/ProfileSetup.css';
import { Camera, User, MapPin, Globe, Languages, BookOpen, Mail, Phone, Github, Linkedin, Briefcase, Code, Heart, Award } from 'lucide-react';

export default function ProfileSetupScreen() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const getCurrentUser = useDataStore((state) => state.getCurrentUser);
  const updateUserProfile = useDataStore((state) => state.updateUserProfile);

  const currentUser = getCurrentUser();

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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
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
    if (!profile.location.trim()) newErrors.location = 'Location is required';
    if (!profile.gender) newErrors.gender = 'Gender is required';
    if (!profile.nationality.trim()) newErrors.nationality = 'Nationality is required';
    if (!profile.knownLanguages.trim()) newErrors.knownLanguages = 'At least one language is required';
    if (!profile.shortBio.trim()) newErrors.shortBio = 'Short bio is required';
    if (!profile.education.trim()) newErrors.education = 'Education is required';
    if (!profile.email.trim()) newErrors.email = 'Email is required';
    if (!profile.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!profile.skills.trim()) newErrors.skills = 'At least one skill is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

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
      navigate('/dashboard');
    } catch (error) {
      setErrors({ submit: 'Failed to save profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-wrapper">
        <div className="profile-setup-header">
          <h1>Complete Your Profile</h1>
          <p>Welcome to Cracoe Connect! Please fill in your details to get started.</p>
        </div>

        <form onSubmit={handleSubmit} className="profile-setup-form">
          {/* Profile Photo Section */}
          <div className="form-section photo-section">
            <div className="photo-upload" onClick={handlePhotoClick}>
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} alt="Profile" className="profile-preview" />
              ) : (
                <div className="photo-placeholder">
                  <Camera size={32} />
                  <span>Add Photo</span>
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
          </div>

          {/* Basic Information */}
          <div className="form-section">
            <h2><User size={20} /> Basic Information</h2>
            
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><MapPin size={16} /> Location *</label>
                <input
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                  placeholder="City, Country"
                />
                {errors.location && <span className="error">{errors.location}</span>}
              </div>

              <div className="form-group">
                <label>Gender *</label>
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
                {errors.gender && <span className="error">{errors.gender}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Globe size={16} /> Nationality *</label>
                <input
                  type="text"
                  value={profile.nationality}
                  onChange={(e) => setProfile({ ...profile, nationality: e.target.value })}
                  placeholder="Your nationality"
                />
                {errors.nationality && <span className="error">{errors.nationality}</span>}
              </div>

              <div className="form-group">
                <label><Languages size={16} /> Known Languages *</label>
                <input
                  type="text"
                  value={profile.knownLanguages}
                  onChange={(e) => setProfile({ ...profile, knownLanguages: e.target.value })}
                  placeholder="English, Tamil, Hindi (comma separated)"
                />
                {errors.knownLanguages && <span className="error">{errors.knownLanguages}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Short Bio *</label>
              <textarea
                value={profile.shortBio}
                onChange={(e) => setProfile({ ...profile, shortBio: e.target.value })}
                placeholder="Tell us about yourself in a few sentences..."
                rows={3}
              />
              {errors.shortBio && <span className="error">{errors.shortBio}</span>}
            </div>

            <div className="form-group">
              <label><BookOpen size={16} /> Education *</label>
              <input
                type="text"
                value={profile.education}
                onChange={(e) => setProfile({ ...profile, education: e.target.value })}
                placeholder="Your highest qualification"
              />
              {errors.education && <span className="error">{errors.education}</span>}
            </div>
          </div>

          {/* Contact Information */}
          <div className="form-section">
            <h2><Mail size={20} /> Contact Information</h2>

            <div className="form-row">
              <div className="form-group">
                <label><Mail size={16} /> Email *</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="your.email@example.com"
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label><Phone size={16} /> Phone *</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 9876543210"
                />
                {errors.phone && <span className="error">{errors.phone}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label><Github size={16} /> GitHub</label>
                <input
                  type="text"
                  value={profile.github}
                  onChange={(e) => setProfile({ ...profile, github: e.target.value })}
                  placeholder="github.com/username"
                />
              </div>

              <div className="form-group">
                <label><Linkedin size={16} /> LinkedIn</label>
                <input
                  type="text"
                  value={profile.linkedin}
                  onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/username"
                />
              </div>
            </div>
          </div>

          {/* Professional Information */}
          <div className="form-section">
            <h2><Briefcase size={20} /> Professional Information</h2>

            <div className="form-group">
              <label><Code size={16} /> Skills *</label>
              <input
                type="text"
                value={profile.skills}
                onChange={(e) => setProfile({ ...profile, skills: e.target.value })}
                placeholder="JavaScript, React, Node.js (comma separated)"
              />
              {errors.skills && <span className="error">{errors.skills}</span>}
            </div>

            <div className="form-group">
              <label><Award size={16} /> Projects Done</label>
              <input
                type="text"
                value={profile.projectsDone}
                onChange={(e) => setProfile({ ...profile, projectsDone: e.target.value })}
                placeholder="Project 1, Project 2 (comma separated)"
              />
            </div>

            <div className="form-group">
              <label><Heart size={16} /> Interests</label>
              <input
                type="text"
                value={profile.interests}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                placeholder="AI, Machine Learning, Web Dev (comma separated)"
              />
            </div>

            <div className="form-group">
              <label><Briefcase size={16} /> Experience</label>
              <textarea
                value={profile.experience}
                onChange={(e) => setProfile({ ...profile, experience: e.target.value })}
                placeholder="Briefly describe your work experience..."
                rows={3}
              />
            </div>
          </div>

          {errors.submit && <div className="error-message">{errors.submit}</div>}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Saving...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}
