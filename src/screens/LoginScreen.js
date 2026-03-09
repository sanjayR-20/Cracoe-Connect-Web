import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDataStore } from '../store/dataStore';
import '../styles/Auth.css';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const authenticate = useDataStore((state) => state.authenticate);
  const users = useDataStore((state) => state.users);
  const supabaseLoading = useDataStore((state) => state.supabaseLoading);
  const supabaseError = useDataStore((state) => state.supabaseError);
  const getUser = useDataStore((state) => state.getUser);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabaseLoading && users.length === 0) {
      setError('No users loaded. Check your Supabase connection and seeded users.');
      setLoading(false);
      return;
    }

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    if (authenticate(username.trim(), password)) {
      // Find the logged in user and check if profile is completed
      const loggedInUser = users.find(
        (u) => u.username === username.trim().toLowerCase()
      );
      
      if (loggedInUser && !loggedInUser.profileCompleted) {
        navigate('/profile-setup');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  const demoCredentials = [
    { username: 'sharvesh', password: 'S@rvesh*&^2026', role: 'CEO (Admin)' },
  ];

  const handleDemoLogin = (demoUsername, demoPassword) => {
    setUsername(demoUsername);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-box">
          <div className="login-header">
            <h1>Cracoe Connect</h1>
            <p>Task Management Platform</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            {supabaseError && <div className="error-message">{supabaseError}</div>}
            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="demo-section">
            <h3>Demo Credentials</h3>
            <div className="demo-grid">
              {demoCredentials.map((cred, idx) => (
                <button
                  key={idx}
                  className="demo-button"
                  onClick={() => handleDemoLogin(cred.username, cred.password)}
                  type="button"
                >
                  <span className="role-badge">{cred.role}</span>
                  {cred.username}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
