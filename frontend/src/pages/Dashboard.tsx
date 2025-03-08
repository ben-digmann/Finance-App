import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.firstName}!</h1>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Total Balance</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-description">Across all accounts</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Available Balance</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-description">Ready to spend</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Assets Value</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-description">0 external assets</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Net Worth</div>
          <div className="stat-value">$0.00</div>
          <div className="stat-description">Total assets minus liabilities</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Accounts</h2>
        </div>
        <div className="no-data-message">
          <p>No accounts linked yet.</p>
          <a href="/link-account" className="btn btn-primary">
            Link Your First Account
          </a>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Transactions</h2>
        </div>
        <div className="no-data-message">
          <p>No transactions found.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;