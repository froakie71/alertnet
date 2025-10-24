import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function TopNav() {
  const { logout } = useAuth();
  const barStyle = {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    background: 'linear-gradient(90deg, #0ea5e9 0%, #2563eb 100%)',
    color: 'white',
    borderBottom: '1px solid rgba(255,255,255,0.15)',
  };
  const innerStyle = {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '10px 16px',
  };
  const brandStyle = { fontWeight: 800, letterSpacing: 0.2, marginRight: 8 };
  const linkBase = {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 10px',
    borderRadius: 8,
    fontWeight: 600,
    opacity: 0.9,
  };
  const activeStyle = {
    background: 'rgba(255,255,255,0.18)',
    opacity: 1,
  };
  const logoutStyle = {
    marginLeft: 'auto',
    background: 'rgba(255,255,255,0.15)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '8px 12px',
    borderRadius: 8,
    cursor: 'pointer',
    fontWeight: 600,
  };
  return (
    <header style={barStyle}>
      <div style={innerStyle}>
        <div style={brandStyle}>AlertNet</div>
        <NavLink to="/dashboard" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Dashboard</NavLink>
        <NavLink to="/alerts" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Alerts</NavLink>
        <NavLink to="/reports" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Reports</NavLink>
        <NavLink to="/connectivity" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Connectivity</NavLink>
        <NavLink to="/residents" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Residents</NavLink>
        <NavLink to="/advisories" style={({ isActive }) => ({ ...linkBase, ...(isActive ? activeStyle : {}) })}>Advisories</NavLink>
        <button onClick={logout} style={logoutStyle}>Logout</button>
      </div>
    </header>
  );
}
