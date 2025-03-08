import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <Link to="/" className="logo">Finance App</Link>
      <div className="user-menu">
        {user && (
          <>
            <span>
              {user.firstName} {user.lastName}
            </span>
            <button onClick={logout} className="btn btn-outline">
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;