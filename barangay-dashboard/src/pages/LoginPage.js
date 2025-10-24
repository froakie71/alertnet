import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../logo.svg';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e) {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const bgStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #eef2ff 0%, #e0f2fe 100%)',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 420,
    background: '#ffffff',
    borderRadius: 16,
    boxShadow: '0 10px 30px rgba(2, 6, 23, 0.10)',
    border: '1px solid #e5e7eb',
    padding: 24,
  };

  const titleStyle = {
    fontSize: 20,
    fontWeight: 700,
    margin: 0,
  };

  const subtitleStyle = {
    marginTop: 4,
    color: '#64748b',
    fontSize: 13,
  };

  const labelStyle = {
    display: 'block',
    fontSize: 13,
    color: '#0f172a',
    marginBottom: 6,
  };

  const inputStyle = {
    width: '100%',
    height: 40,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    outline: 'none',
    background: '#f8fafc',
  };

  const buttonStyle = {
    width: '100%',
    height: 44,
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(90deg, #2563eb 0%, #0891b2 100%)',
    color: 'white',
    fontWeight: 600,
    cursor: 'pointer',
  };

  const toggleStyle = {
    height: 40,
    padding: '0 12px',
    borderRadius: 10,
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    color: '#0f172a',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };

  const errorStyle = {
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: 10,
    padding: '10px 12px',
    marginBottom: 12,
    fontSize: 13,
  };

  return (
    <div style={bgStyle}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <img src={logo} alt="AlertNet" width={36} height={36} />
          <div>
            <h1 style={titleStyle}>AlertNet</h1>
            <div style={subtitleStyle}>Barangay Officials Login</div>
          </div>
        </div>

        {error ? <div style={errorStyle}>{error}</div> : null}

        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              placeholder="official@barangay.gov.ph"
              required
            />
          </div>
          <div>
            <label style={labelStyle}>Password</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ ...inputStyle, flex: 1 }}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                style={toggleStyle}
              >
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
