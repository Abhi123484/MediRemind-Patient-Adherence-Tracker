import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="nav-icon">💊</span>
          <span>MediRemind</span>
        </Link>

        <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
          {user.role === 'patient' ? (
            <>
              <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <Link to="/medications" className={isActive('/medications')} onClick={() => setMenuOpen(false)}>
                Medications
              </Link>
              <Link to="/calendar" className={isActive('/calendar')} onClick={() => setMenuOpen(false)}>
                Calendar
              </Link>
              <Link to="/my-doctor" className={isActive('/my-doctor')} onClick={() => setMenuOpen(false)}>
                My Doctor
              </Link>
            </>
          ) : (
            <Link to="/doctor" className={isActive('/doctor')} onClick={() => setMenuOpen(false)}>
              Patients
            </Link>
          )}

          <div className="nav-user">
            <span className="nav-user-name">{user.name}</span>
            <span className="nav-role-badge">{user.role}</span>
            <button className="btn-logout" onClick={logout}>Logout</button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
