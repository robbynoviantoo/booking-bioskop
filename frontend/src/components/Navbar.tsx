import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, LogOut, User, Ticket } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-brand">
          <div className="navbar-logo">
            <Film size={22} />
          </div>
          <span>CineBook</span>
        </Link>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar-user">
                <User size={15} />
                {user?.name}
              </span>
              <Link to="/bookings" className={`btn btn-ghost navbar-btn ${location.pathname.startsWith('/bookings') ? 'active' : ''}`}>
                <Ticket size={16} /> Tiket Saya
              </Link>
              <button className="btn btn-ghost navbar-btn" onClick={handleLogout}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost navbar-btn">Login</Link>
              <Link to="/register" className="btn btn-primary navbar-btn">Daftar</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
