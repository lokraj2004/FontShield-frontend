import React, { useState } from 'react';
import './Login.css';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Predefined credentials
  const PREDEFINED_USERNAME = 'lokraj2004';
  const PREDEFINED_EMAIL = 'lokraj2004@gmail.com';
  const PREDEFINED_PASSWORD = 'Lokraj@2004';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      username === PREDEFINED_USERNAME &&
      email === PREDEFINED_EMAIL &&
      password === PREDEFINED_PASSWORD
    ) {
      setError('');
      localStorage.setItem('isAuthenticated', 'true'); // Persist authentication state
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Login to Mini Gemini</h2>
        {error && <p className="login-error">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <button type="submit" className="login-button">Submit</button>
      </form>
    </div>
  );
};

export default Login;