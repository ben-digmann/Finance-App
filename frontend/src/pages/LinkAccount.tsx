import React from 'react';

const LinkAccount: React.FC = () => {
  return (
    <div>
      <h1>Link Your Bank Account</h1>
      
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Connect Your Accounts</h2>
        </div>
        <div className="card-content">
          <p>
            Link your bank accounts, credit cards, loans, and investments to get a complete picture
            of your finances. Your credentials are never stored on our servers and
            are securely transmitted using end-to-end encryption.
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              disabled
            >
              Link Account (Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkAccount;