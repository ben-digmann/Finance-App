import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <nav>
        <ul className="nav-list">
          <li className="nav-item">
            <NavLink
              to="/"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              end
            >
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/transactions"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">📝</span> Transactions
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/budget"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">💰</span> Budget
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/assets"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">🏠</span> Assets
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/link-account"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">🔗</span> Link Account
            </NavLink>
          </li>
          <li className="nav-item">
            <NavLink
              to="/settings"
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            >
              <span className="nav-icon">⚙️</span> Settings
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;