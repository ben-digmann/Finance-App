import React from 'react';

const Assets: React.FC = () => {
  return (
    <div>
      <h1>Assets</h1>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Your Assets</h2>
          <button className="btn btn-primary" disabled>
            Add Asset
          </button>
        </div>
        <div className="card-content">
          <div className="no-data-message">
            <p>You haven't added any assets yet.</p>
            <p>
              Track your real estate, vehicles, and other valuable possessions
              to get a comprehensive view of your net worth.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assets;