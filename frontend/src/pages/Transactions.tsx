import React from 'react';

const Transactions: React.FC = () => {
  return (
    <div>
      <h1>Transactions</h1>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Filters</h2>
        </div>
        <div className="card-content">
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label htmlFor="dateRange" className="form-label">
                Date Range
              </label>
              <select id="dateRange" className="form-control">
                <option value="thisMonth">This Month</option>
                <option value="lastMonth">Last Month</option>
                <option value="last3Months">Last 3 Months</option>
                <option value="thisYear">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label htmlFor="account" className="form-label">
                Account
              </label>
              <select id="account" className="form-control">
                <option value="">All Accounts</option>
              </select>
            </div>
            
            <div className="form-group" style={{ minWidth: '200px' }}>
              <label htmlFor="category" className="form-label">
                Category
              </label>
              <select id="category" className="form-control">
                <option value="">All Categories</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Transactions</h2>
        </div>
        <div className="no-data-message">
          <p>No transactions found.</p>
        </div>
      </div>
    </div>
  );
};

export default Transactions;