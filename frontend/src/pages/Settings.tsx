import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <div>
      <h1>Settings</h1>
      
      <div style={{ display: 'flex', gap: '2rem' }}>
        <div style={{ width: '200px' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === 'profile' ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Profile
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('security')}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === 'security' ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Security
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('categories')}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === 'categories' ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Categories
              </button>
            </li>
            <li>
              <button
                onClick={() => setActiveTab('accounts')}
                style={{
                  padding: '0.5rem 1rem',
                  background: activeTab === 'accounts' ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  width: '100%',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                Connected Accounts
              </button>
            </li>
          </ul>
        </div>
        
        <div style={{ flex: 1 }}>
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Profile Settings</h2>
              </div>
              <div className="card-content">
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={user?.email || ''}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.firstName || ''}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={user?.lastName || ''}
                    readOnly
                  />
                </div>
                <button className="btn btn-primary" disabled>
                  Update Profile
                </button>
              </div>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Security Settings</h2>
              </div>
              <div className="card-content">
                <p>Security settings placeholder</p>
              </div>
            </div>
          )}
          
          {activeTab === 'categories' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Category Management</h2>
              </div>
              <div className="card-content">
                <p>Category management placeholder</p>
              </div>
            </div>
          )}
          
          {activeTab === 'accounts' && (
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">Connected Accounts</h2>
              </div>
              <div className="card-content">
                <div className="no-data-message">
                  <p>No accounts connected yet.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;