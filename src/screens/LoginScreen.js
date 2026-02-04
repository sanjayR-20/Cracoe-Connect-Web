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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    if (authenticate(username.trim(), password)) {
      navigate('/dashboard');
    } else {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  const demoCredentials = [
    { username: 'sharvesh', password: 'sharvesh123', role: 'CEO' },
    { username: 'sivadharana', password: 'sivadharana123', role: 'COO' },
    { username: 'shridharshini', password: 'shridharshini123', role: 'CTO' },
    { username: 'sanjay', password: 'sanjay123', role: 'CFO' },
    { username: 'pavith', password: 'pavith123', role: 'Marketing Lead' },
    { username: 'sakthivel', password: 'sakthivel123', role: 'Manager' },
    { username: 'shanmugavel', password: 'shanmugavel123', role: 'Developer' },
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
