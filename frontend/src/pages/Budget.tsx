import React from 'react';

const Budget: React.FC = () => {
  return (
    <div>
      <h1>Budget</h1>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Budget Overview</h2>
        </div>
        <div className="card-content">
          <div className="no-data-message">
            <p>You haven't set up any budgets yet.</p>
            <button className="btn btn-primary" disabled>
              Create Your First Budget
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;