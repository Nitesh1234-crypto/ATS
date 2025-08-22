import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">
          <Link to="/">
            <h1>ATS Scoring</h1>
          </Link>
        </div>
        
        <nav className="nav">
          <Link 
            to="/" 
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            Upload & Score
          </Link>
          <Link 
            to="/history" 
            className={`nav-link ${isActive('/history') ? 'active' : ''}`}
          >
            History
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
