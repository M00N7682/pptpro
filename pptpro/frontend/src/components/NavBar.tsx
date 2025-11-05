import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Button } from './ui';
import './NavBar.css';

const NavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, clearAuth, isAuthenticated } = useAuthStore();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/projects', label: 'Projects', icon: 'projects' },
    { path: '/storyline', label: 'AI Storyline', icon: 'ai' }
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* 로고 */}
        <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
          <div className="brand-icon">P</div>
          <span className="brand-text">PPT Pro</span>
        </div>

        {/* 네비게이션 메뉴 */}
        <div className="navbar-menu">
          {navItems.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className={`nav-icon icon-${item.icon}`}></span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 사용자 영역 */}
        <div className="navbar-user">
          <div className="user-info">
            <div className="user-avatar">{(user?.name || 'U')[0].toUpperCase()}</div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="small"
            className="logout-btn"
          >
            로그아웃
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;