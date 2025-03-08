import React from 'react';
import { useParams, Link } from 'react-router-dom';

const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div>
      <h1>Account Details</h1>
      
      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Current Balance</div>
          <div className="stat-value">$0.00</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-title">Available Balance</div>
          <div className="stat-value">$0.00</div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transactions</h2>
        </div>
        <div className="card-content">
          <div className="no-data-message">
            <p>No transactions found for this account.</p>
            <Link to="/" className="btn btn-primary">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountDetails;