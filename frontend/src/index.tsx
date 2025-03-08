import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { usePlaidLink } from 'react-plaid-link';
import './index.css';

// Simple types
interface User {
  email: string;
  firstName: string;
  lastName: string;
}

interface Account {
  id: string;
  name: string;
  type: string;
  subtype: string;
  mask: string;
  balances: {
    available: number | null;
    current: number;
  };
}

const App = () => {
  // States
  const [view, setView] = useState<'home' | 'login' | 'register' | 'dashboard'>('home');
  const [sidebarView, setSidebarView] = useState<'dashboard' | 'transactions' | 'budget' | 'assets' | 'link' | 'settings'>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerFirstName, setRegisterFirstName] = useState('');
  const [registerLastName, setRegisterLastName] = useState('');

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Authenticate with the backend
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword
        })
      });
      
      if (!response.ok) {
        // Show error to user
        alert('Login failed. Please check your credentials.');
        throw new Error(`Login failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store the JWT token
      localStorage.setItem('token', data.token);
      
      // Set user data
      setUser({
        email: loginEmail,
        firstName: data.user.firstName || 'Demo',
        lastName: data.user.lastName || 'User',
      });
      
      setView('dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // For development: fallback to mock user if API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock user login as fallback');
        setUser({
          email: loginEmail,
          firstName: 'Demo',
          lastName: 'User',
        });
        // Store a demo token
        localStorage.setItem('token', 'demo-token');
        setView('dashboard');
      }
    }
  };

  // Handle register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Register with the backend
      const response = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
          firstName: registerFirstName,
          lastName: registerLastName
        })
      });
      
      if (!response.ok) {
        // Show error to user
        alert('Registration failed. Please try again.');
        throw new Error(`Registration failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Store the JWT token
      localStorage.setItem('token', data.token);
      
      // Set user data
      setUser({
        email: registerEmail,
        firstName: registerFirstName,
        lastName: registerLastName,
      });
      
      setView('dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      
      // For development: fallback to mock user if API fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Using mock user registration as fallback');
        setUser({
          email: registerEmail,
          firstName: registerFirstName,
          lastName: registerLastName,
        });
        // Store a demo token
        localStorage.setItem('token', 'demo-token');
        setView('dashboard');
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    // Clear user data
    setUser(null);
    // Clear accounts
    setAccounts([]);
    // Clear link token
    setLinkToken(null);
    // Clear link success state
    setLinkSuccess(false);
    // Remove token from local storage
    localStorage.removeItem('token');
    // Navigate to home
    setView('home');
  };
  
  // Get a link token from the API
  useEffect(() => {
    if (view === 'dashboard' && user) {
      const fetchLinkToken = async () => {
        try {
          console.log('Testing API connection...');
          
          // First test if the API is accessible at all
          try {
            const testResponse = await fetch('http://localhost:8000/api/plaid/test');
            const testData = await testResponse.json();
            console.log('API test response:', testData);
          } catch (testError) {
            console.error('API test failed:', testError);
          }
          
          console.log('Fetching link token from API...');
          // Get a real link token from the backend API
          const response = await fetch('http://localhost:8000/api/plaid/create-link-token', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
              'Content-Type': 'application/json'
            }
          });
          
          console.log('Link token API response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Link token API error response:', errorText);
            throw new Error(`API error: ${response.status} - ${errorText}`);
          }
          
          const data = await response.json();
          console.log('Received link token from API:', data);
          
          if (!data.linkToken) {
            console.error('No link token in response:', data);
            throw new Error('No link token in response');
          }
          
          setLinkToken(data.linkToken);
        } catch (error) {
          console.error('Error fetching link token:', error);
          
          // For development testing only - can be removed for production
          console.warn('FORCING MOCK TOKEN FOR TESTING');
          alert('Using mock token for testing! In production, this would connect to Plaid.');
          setLinkToken('link-sandbox-12345');
        }
      };
      
      fetchLinkToken();
    }
  }, [view, user]);
  
  // Configure Plaid Link
  console.log('Plaid Link Config:', { 
    linkToken, 
    hasLinkToken: !!linkToken,
    linkTokenLength: linkToken ? linkToken.length : 0 
  });
  
  // In a real app with valid credentials, this would create a link to Plaid
  // For testing, we'll handle error cases and validation
  const linkConfig = {
    token: linkToken || '',
    onSuccess: async (public_token: string, metadata: any) => {
      try {
        console.log('Link success!', public_token, metadata);
        setLinkSuccess(true);
        
        // Send the public token to your backend
        const response = await fetch('http://localhost:8000/api/plaid/exchange-public-token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ publicToken: public_token })
        });
        
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Token exchange successful:', data);
        
        // Fetch accounts after successful link
        await fetchAccounts();
      } catch (error) {
        console.error('Error in Plaid Link flow:', error);
        
        // Fallback to mock data if in development
        if (process.env.NODE_ENV === 'development') {
          console.warn('Using mock accounts as fallback');
          // Mock account data
          const mockAccounts: Account[] = [
            {
              id: '12345',
              name: 'Checking Account',
              type: 'depository',
              subtype: 'checking',
              mask: '1234',
              balances: {
                available: 1250.45,
                current: 1274.98
              }
            },
            {
              id: '67890',
              name: 'Savings Account',
              type: 'depository',
              subtype: 'savings',
              mask: '5678',
              balances: {
                available: 12480.75,
                current: 12480.75
              }
            },
            {
              id: 'abcde',
              name: 'Credit Card',
              type: 'credit',
              subtype: 'credit card',
              mask: '9012',
              balances: {
                available: 4500.00,
                current: -752.36
              }
            }
          ];
          
          setAccounts(mockAccounts);
        }
      }
    },
    onExit: (err, metadata) => {
      console.log('Link exit:', err, metadata);
      if (err) {
        console.error('Plaid Link exit with error:', err);
      }
    },
    onEvent: (eventName, metadata) => {
      console.log('Plaid Link event:', eventName, metadata);
    }
  };
  
  // Initialize Plaid Link
  const { open, ready } = usePlaidLink(linkConfig);
  
  // Function to fetch accounts from the backend
  const fetchAccounts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Fetched accounts:', data);
      
      // Transform the account data to match our Account interface
      const fetchedAccounts: Account[] = data.accounts.map((acc: any) => ({
        id: acc.id,
        name: acc.name,
        type: acc.type,
        subtype: acc.subtype || '',
        mask: acc.mask || '****',
        balances: {
          available: acc.availableBalance || null,
          current: acc.currentBalance
        }
      }));
      
      setAccounts(fetchedAccounts);
    } catch (error) {
      console.error('Error fetching accounts:', error);
    }
  };
  
  // Calculate total balances
  const getTotalBalance = () => {
    return accounts.reduce((total, account) => {
      // Add depository accounts (positive numbers)
      if (account.type === 'depository') {
        return total + account.balances.current;
      }
      // Subtract credit accounts (negative numbers)
      else if (account.type === 'credit') {
        return total - Math.abs(account.balances.current);
      }
      return total;
    }, 0);
  };
  
  const getTotalAvailable = () => {
    return accounts.reduce((total, account) => {
      if (account.balances.available === null) return total;
      
      if (account.type === 'depository') {
        return total + account.balances.available;
      }
      return total;
    }, 0);
  };

  // Common styles
  const buttonStyle = {
    backgroundColor: '#4361ee',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '5px',
  };

  const outlineButtonStyle = {
    backgroundColor: 'white',
    color: '#4361ee',
    border: '1px solid #4361ee',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    margin: '5px',
  };

  const formStyle = {
    display: 'flex',
    flexDirection: 'column' as 'column',
    width: '300px',
    margin: '0 auto',
  };

  const inputStyle = {
    padding: '10px',
    margin: '5px 0',
    borderRadius: '5px',
    border: '1px solid #ccc',
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    margin: '10px',
    width: '100%',
    maxWidth: '800px',
  };

  // Render different views based on state
  if (view === 'login') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column' as 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f7ff',
      }}>
        <div style={cardStyle}>
          <h1 style={{ color: '#4361ee', textAlign: 'center' }}>Log In</h1>
          <form onSubmit={handleLogin} style={formStyle}>
            <label htmlFor="email">Email:</label>
            <input 
              type="email" 
              id="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              style={inputStyle}
              required
            />
            
            <label htmlFor="password">Password:</label>
            <input 
              type="password" 
              id="password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              style={inputStyle}
              required
            />
            
            <button type="submit" style={buttonStyle}>Log In</button>
            <button 
              type="button" 
              onClick={() => setView('home')}
              style={outlineButtonStyle}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'register') {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column' as 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f7ff',
      }}>
        <div style={cardStyle}>
          <h1 style={{ color: '#4361ee', textAlign: 'center' }}>Register</h1>
          <form onSubmit={handleRegister} style={formStyle}>
            <label htmlFor="firstName">First Name:</label>
            <input 
              type="text" 
              id="firstName"
              value={registerFirstName}
              onChange={(e) => setRegisterFirstName(e.target.value)}
              style={inputStyle}
              required
            />
            
            <label htmlFor="lastName">Last Name:</label>
            <input 
              type="text" 
              id="lastName"
              value={registerLastName}
              onChange={(e) => setRegisterLastName(e.target.value)}
              style={inputStyle}
              required
            />
            
            <label htmlFor="registerEmail">Email:</label>
            <input 
              type="email" 
              id="registerEmail"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
              style={inputStyle}
              required
            />
            
            <label htmlFor="registerPassword">Password:</label>
            <input 
              type="password" 
              id="registerPassword"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
              style={inputStyle}
              required
            />
            
            <button type="submit" style={buttonStyle}>Register</button>
            <button 
              type="button" 
              onClick={() => setView('home')}
              style={outlineButtonStyle}
            >
              Back
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <div style={{ 
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f5f7ff',
        minHeight: '100vh',
      }}>
        <header style={{
          backgroundColor: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h1 style={{ color: '#4361ee', margin: 0 }}>Finance App</h1>
          <div>
            <span style={{ marginRight: '1rem' }}>
              Welcome, {user.firstName} {user.lastName}
            </span>
            <button 
              onClick={handleLogout}
              style={outlineButtonStyle}
            >
              Logout
            </button>
          </div>
        </header>
        
        <div style={{ 
          display: 'flex',
          padding: '2rem',
        }}>
          <aside style={{
            width: '200px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            padding: '1rem',
            marginRight: '2rem',
          }}>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
            }}>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'dashboard' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'dashboard' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('dashboard')}
              >
                Dashboard
              </li>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'transactions' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'transactions' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('transactions')}
              >
                Transactions
              </li>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'budget' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'budget' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('budget')}
              >
                Budget
              </li>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'assets' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'assets' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('assets')}
              >
                Assets
              </li>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'link' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'link' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('link')}
              >
                Link Account
              </li>
              <li 
                style={{ 
                  padding: '0.5rem 0', 
                  color: sidebarView === 'settings' ? '#4361ee' : 'inherit', 
                  fontWeight: sidebarView === 'settings' ? 'bold' : 'normal',
                  cursor: 'pointer'
                }}
                onClick={() => setSidebarView('settings')}
              >
                Settings
              </li>
            </ul>
          </aside>
          
          <main style={{
            flex: 1,
          }}>
            <h2>Welcome, {user.firstName}!</h2>
            
            {/* Dashboard View */}
            {sidebarView === 'dashboard' && (
              <>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  <div style={cardStyle}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Total Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                      ${getTotalBalance().toFixed(2)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Across all accounts</div>
                  </div>
                  
                  <div style={cardStyle}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Available Balance</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                      ${getTotalAvailable().toFixed(2)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Ready to spend</div>
                  </div>
                  
                  <div style={cardStyle}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Assets Value</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>$0.00</div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>0 external assets</div>
                  </div>
                  
                  <div style={cardStyle}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Net Worth</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0.5rem 0' }}>
                      ${getTotalBalance().toFixed(2)}
                    </div>
                    <div style={{ color: '#666', fontSize: '0.8rem' }}>Total assets minus liabilities</div>
                  </div>
                </div>
                
                <div style={cardStyle}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <h3 style={{ margin: 0 }}>Your Accounts</h3>
                    <div>
                      <button 
                        style={buttonStyle}
                        onClick={() => {
                          console.log('Link button clicked!', { ready, linkToken });
                          if (ready && linkToken) {
                            console.log('Opening Plaid Link...');
                            open();
                          } else {
                            console.error('Cannot open Plaid Link: ready=', ready, 'linkToken=', !!linkToken);
                          }
                        }}
                        disabled={!ready || !linkToken}
                      >
                        {!ready || !linkToken ? 'Loading...' : 'Link New Account'}
                      </button>
                      
                      <button 
                        style={{...buttonStyle, backgroundColor: '#ff9800', marginLeft: '10px'}}
                        onClick={() => {
                          // Add mock accounts for development/testing
                          console.log('Adding mock accounts for testing');
                          const mockAccounts: Account[] = [
                            {
                              id: '12345',
                              name: 'Checking Account',
                              type: 'depository',
                              subtype: 'checking',
                              mask: '1234',
                              balances: {
                                available: 1250.45,
                                current: 1274.98
                              }
                            },
                            {
                              id: '67890',
                              name: 'Savings Account',
                              type: 'depository',
                              subtype: 'savings',
                              mask: '5678',
                              balances: {
                                available: 12480.75,
                                current: 12480.75
                              }
                            },
                            {
                              id: 'abcde',
                              name: 'Credit Card',
                              type: 'credit',
                              subtype: 'credit card',
                              mask: '9012',
                              balances: {
                                available: 4500.00,
                                current: -752.36
                              }
                            }
                          ];
                          setAccounts(mockAccounts);
                        }}
                      >
                        Test: Add Mock Accounts
                      </button>
                    </div>
                  </div>
                  
                  {accounts.length > 0 ? (
                    <div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #eee' }}>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Account</th>
                            <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Balance</th>
                            <th style={{ textAlign: 'right', padding: '8px' }}>Available</th>
                          </tr>
                        </thead>
                        <tbody>
                          {accounts.map((account) => (
                            <tr key={account.id} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px 8px' }}>
                                {account.name}
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                  •••• {account.mask}
                                </div>
                              </td>
                              <td style={{ padding: '12px 8px' }}>
                                {account.type.charAt(0).toUpperCase() + account.type.slice(1)}
                                {account.subtype && (
                                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                    {account.subtype.charAt(0).toUpperCase() + account.subtype.slice(1)}
                                  </div>
                                )}
                              </td>
                              <td style={{ 
                                padding: '12px 8px', 
                                textAlign: 'right',
                                color: account.balances.current < 0 ? '#e53935' : 'inherit'
                              }}>
                                ${Math.abs(account.balances.current).toFixed(2)}
                              </td>
                              <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                                {account.balances.available !== null 
                                  ? `$${account.balances.available.toFixed(2)}` 
                                  : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <p>No accounts linked yet.</p>
                      <div>
                        <button 
                          style={buttonStyle}
                          onClick={() => {
                            console.log('First account link button clicked!', { ready, linkToken });
                            if (ready && linkToken) {
                              console.log('Opening Plaid Link...');
                              open();
                            } else {
                              console.error('Cannot open Plaid Link: ready=', ready, 'linkToken=', !!linkToken);
                            }
                          }}
                          disabled={!ready || !linkToken}
                        >
                          {!ready || !linkToken ? 'Loading...' : 'Link Your First Account'}
                        </button>
                        
                        <button 
                          style={{...buttonStyle, backgroundColor: '#ff9800', marginLeft: '10px', marginTop: '10px'}}
                          onClick={() => {
                            // Add mock accounts for development/testing
                            console.log('Adding mock accounts for testing');
                            const mockAccounts: Account[] = [
                              {
                                id: '12345',
                                name: 'Checking Account',
                                type: 'depository',
                                subtype: 'checking',
                                mask: '1234',
                                balances: {
                                  available: 1250.45,
                                  current: 1274.98
                                }
                              },
                              {
                                id: '67890',
                                name: 'Savings Account',
                                type: 'depository',
                                subtype: 'savings',
                                mask: '5678',
                                balances: {
                                  available: 12480.75,
                                  current: 12480.75
                                }
                              },
                              {
                                id: 'abcde',
                                name: 'Credit Card',
                                type: 'credit',
                                subtype: 'credit card',
                                mask: '9012',
                                balances: {
                                  available: 4500.00,
                                  current: -752.36
                                }
                              }
                            ];
                            setAccounts(mockAccounts);
                          }}
                        >
                          Test: Add Mock Accounts
                        </button>
                      </div>
                      
                      {/* Info section for Plaid connection */}
                      <div style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        backgroundColor: '#e8f4f8', 
                        borderRadius: '5px',
                        fontSize: '0.9rem'
                      }}>
                        <p><strong>Note:</strong> When you click "Link Your First Account", the Plaid Link interface will open to securely connect your accounts.</p>
                        <p><strong>Sandbox Testing Credentials:</strong></p>
                        <ul style={{ marginLeft: '20px' }}>
                          <li>Username: <code>user_good</code></li>
                          <li>Password: <code>pass_good</code></li>
                          <li>Phone number: Try one of these formats:
                            <ul>
                              <li><code>1234567890</code> (no formatting)</li>
                              <li><code>123-456-7890</code> (with hyphens)</li>
                              <li><code>(123) 456-7890</code> (with parentheses)</li>
                            </ul>
                          </li>
                          <li>Verification code: <code>123456</code></li>
                          <li>Address: <code>123 Main St, Anytown, CA 90210</code></li>
                          <li>SSN (if requested): <code>123-45-6789</code></li>
                          <li>Date of birth: <code>01/01/1980</code> (or any valid date)</li>
                        </ul>
                        <p><a href="https://plaid.com/docs/sandbox/test-credentials/" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>See Plaid's test credentials documentation</a> for more options.</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div style={cardStyle}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem',
                  }}>
                    <h3 style={{ margin: 0 }}>Recent Transactions</h3>
                    <button 
                      style={outlineButtonStyle}
                      onClick={() => setSidebarView('transactions')}
                    >
                      View All
                    </button>
                  </div>
                  {accounts.length > 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <p>Transactions would appear here in a real application.</p>
                      <p>This would connect to your backend API to fetch real transaction data.</p>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <p>No transactions found. Link an account to see your transactions.</p>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {/* Transactions View */}
            {sidebarView === 'transactions' && (
              <div style={cardStyle}>
                <h3>All Transactions</h3>
                {accounts.length > 0 ? (
                  <>
                    <div style={{marginBottom: '1rem'}}>
                      <p>Here are some mock transactions with AI-based categorization:</p>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Date</th>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Merchant</th>
                          <th style={{ textAlign: 'left', padding: '8px' }}>Category</th>
                          <th style={{ textAlign: 'right', padding: '8px' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px' }}>2025-03-01</td>
                          <td style={{ padding: '12px 8px' }}>Whole Foods Market</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              backgroundColor: '#e3f2fd',
                              color: '#1565c0',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              Food
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#e53935' }}>-$87.32</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px' }}>2025-03-02</td>
                          <td style={{ padding: '12px 8px' }}>Netflix</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              backgroundColor: '#fce4ec',
                              color: '#c2185b',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              Entertainment
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#e53935' }}>-$15.99</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px' }}>2025-03-03</td>
                          <td style={{ padding: '12px 8px' }}>Shell Oil</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              backgroundColor: '#fffde7',
                              color: '#ff6f00',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              Transportation
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#e53935' }}>-$45.23</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px' }}>2025-03-04</td>
                          <td style={{ padding: '12px 8px' }}>ACH Deposit - PAYROLL</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              backgroundColor: '#e8f5e9',
                              color: '#2e7d32',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              Income
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#2e7d32' }}>+$2,450.00</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px 8px' }}>2025-03-05</td>
                          <td style={{ padding: '12px 8px' }}>Apartment Rent LLC</td>
                          <td style={{ padding: '12px 8px' }}>
                            <span style={{
                              backgroundColor: '#efebe9',
                              color: '#4e342e',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem'
                            }}>
                              Housing
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', color: '#e53935' }}>-$1,450.00</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{marginTop: '1rem', textAlign: 'center'}}>
                      <p style={{color: '#666'}}>
                        These transactions are categorized by the rule-based classifier that replaces the LLM functionality. 
                        In a production app, this would use OpenAI's API or another LLM service.
                      </p>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                    <p>No transactions found. Link an account to see your transactions.</p>
                    <button 
                      style={buttonStyle}
                      onClick={() => setSidebarView('link')}
                    >
                      Link Account
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Budget View */}
            {sidebarView === 'budget' && (
              <div style={cardStyle}>
                <h3>Budget Management</h3>
                <div style={{marginBottom: '1rem'}}>
                  <p>Here's a basic budget breakdown based on your spending categories:</p>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}>
                  <div style={{...cardStyle, backgroundColor: '#f5f5f5'}}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Housing</div>
                    <div style={{ 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '75%',
                        backgroundColor: '#4361ee',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.9rem' }}>$1,450 of $2,000</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>75%</span>
                    </div>
                  </div>
                  
                  <div style={{...cardStyle, backgroundColor: '#f5f5f5'}}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Food</div>
                    <div style={{ 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '35%',
                        backgroundColor: '#4361ee',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.9rem' }}>$175 of $500</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>35%</span>
                    </div>
                  </div>
                  
                  <div style={{...cardStyle, backgroundColor: '#f5f5f5'}}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Transportation</div>
                    <div style={{ 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '45%',
                        backgroundColor: '#4361ee',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.9rem' }}>$135 of $300</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>45%</span>
                    </div>
                  </div>
                  
                  <div style={{...cardStyle, backgroundColor: '#f5f5f5'}}>
                    <div style={{ color: '#666', fontSize: '0.9rem' }}>Entertainment</div>
                    <div style={{ 
                      height: '8px', 
                      backgroundColor: '#e0e0e0', 
                      borderRadius: '4px',
                      marginTop: '8px',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        height: '100%',
                        width: '70%',
                        backgroundColor: '#ff9800',
                        borderRadius: '4px'
                      }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                      <span style={{ fontSize: '0.9rem' }}>$140 of $200</span>
                      <span style={{ fontSize: '0.9rem', color: '#666' }}>70%</span>
                    </div>
                  </div>
                </div>
                
                <button style={buttonStyle}>Add New Budget</button>
              </div>
            )}
            
            {/* Assets View */}
            {sidebarView === 'assets' && (
              <div style={cardStyle}>
                <h3>Assets Management</h3>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p>Track your external assets here to get a complete picture of your net worth.</p>
                  <p>This includes real estate, vehicles, investments not connected through Plaid, and other valuables.</p>
                  
                  <button style={buttonStyle}>Add New Asset</button>
                </div>
              </div>
            )}
            
            {/* Link Account View */}
            {sidebarView === 'link' && (
              <div style={cardStyle}>
                <h3>Link Financial Accounts</h3>
                <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                  <p>Connect your financial institutions to automatically track transactions and balances.</p>
                  
                  <button 
                    style={buttonStyle}
                    onClick={() => {
                      if (ready && linkToken) {
                        open();
                      } else {
                        console.error('Cannot open Plaid Link: ready=', ready, 'linkToken=', !!linkToken);
                      }
                    }}
                    disabled={!ready || !linkToken}
                  >
                    {!ready || !linkToken ? 'Loading...' : 'Link New Account'}
                  </button>
                  
                  <button 
                    style={{...buttonStyle, backgroundColor: '#ff9800', marginLeft: '10px'}}
                    onClick={() => {
                      // Add mock accounts for testing
                      const mockAccounts: Account[] = [
                        {
                          id: '12345',
                          name: 'Checking Account',
                          type: 'depository',
                          subtype: 'checking',
                          mask: '1234',
                          balances: {
                            available: 1250.45,
                            current: 1274.98
                          }
                        },
                        {
                          id: '67890',
                          name: 'Savings Account',
                          type: 'depository',
                          subtype: 'savings',
                          mask: '5678',
                          balances: {
                            available: 12480.75,
                            current: 12480.75
                          }
                        },
                        {
                          id: 'abcde',
                          name: 'Credit Card',
                          type: 'credit',
                          subtype: 'credit card',
                          mask: '9012',
                          balances: {
                            available: 4500.00,
                            current: -752.36
                          }
                        }
                      ];
                      setAccounts(mockAccounts);
                      setSidebarView('dashboard');
                    }}
                  >
                    Test: Add Mock Accounts
                  </button>
                  
                  {/* Info section for Plaid connection */}
                  <div style={{ 
                    marginTop: '20px', 
                    padding: '15px', 
                    backgroundColor: '#e8f4f8', 
                    borderRadius: '5px',
                    fontSize: '0.9rem',
                    textAlign: 'left'
                  }}>
                    <p><strong>Note:</strong> When you click "Link New Account", the Plaid Link interface will open to securely connect your accounts.</p>
                    <p><strong>Sandbox Testing Credentials:</strong></p>
                    <ul style={{ marginLeft: '20px' }}>
                      <li>Username: <code>user_good</code></li>
                      <li>Password: <code>pass_good</code></li>
                      <li>Phone number: Try one of these formats:
                        <ul>
                          <li><code>1234567890</code> (no formatting)</li>
                          <li><code>123-456-7890</code> (with hyphens)</li>
                          <li><code>(123) 456-7890</code> (with parentheses)</li>
                        </ul>
                      </li>
                      <li>Verification code: <code>123456</code></li>
                      <li>Address: <code>123 Main St, Anytown, CA 90210</code></li>
                      <li>SSN (if requested): <code>123-45-6789</code></li>
                      <li>Date of birth: <code>01/01/1980</code> (or any valid date)</li>
                    </ul>
                    <p><a href="https://plaid.com/docs/sandbox/test-credentials/" target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>See Plaid's test credentials documentation</a> for more options.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Settings View */}
            {sidebarView === 'settings' && (
              <div style={cardStyle}>
                <h3>Account Settings</h3>
                <div style={{ padding: '1rem 0' }}>
                  <h4>Profile Information</h4>
                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="settings-firstName" style={{ display: 'block', marginBottom: '0.5rem' }}>First Name</label>
                      <input 
                        id="settings-firstName"
                        type="text"
                        value={user.firstName}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                        readOnly
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label htmlFor="settings-lastName" style={{ display: 'block', marginBottom: '0.5rem' }}>Last Name</label>
                      <input 
                        id="settings-lastName"
                        type="text"
                        value={user.lastName}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          borderRadius: '4px',
                          border: '1px solid #ddd'
                        }}
                        readOnly
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label htmlFor="settings-email" style={{ display: 'block', marginBottom: '0.5rem' }}>Email</label>
                    <input 
                      id="settings-email"
                      type="email"
                      value={user.email}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #ddd'
                      }}
                      readOnly
                    />
                  </div>
                  
                  <h4>Notifications</h4>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={true} 
                        style={{marginRight: '0.5rem'}}
                        readOnly
                      />
                      Email notifications for large transactions
                    </label>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                      <input 
                        type="checkbox" 
                        checked={true} 
                        style={{marginRight: '0.5rem'}}
                        readOnly
                      />
                      Monthly spending reports
                    </label>
                  </div>
                  
                  <h4>Connected Financial Institutions</h4>
                  {accounts.length > 0 ? (
                    <div style={{ marginBottom: '1rem' }}>
                      <p>You have {accounts.length} connected accounts.</p>
                      <button style={outlineButtonStyle} onClick={() => setSidebarView('link')}>Manage Connections</button>
                    </div>
                  ) : (
                    <div style={{ marginBottom: '1rem' }}>
                      <p>No financial institutions connected yet.</p>
                      <button style={buttonStyle} onClick={() => setSidebarView('link')}>Connect Accounts</button>
                    </div>
                  )}
                  
                  <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                    <button 
                      style={{...buttonStyle, backgroundColor: '#e53935'}}
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  }

  // Home view (default)
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column' as 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      height: '100vh',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f7ff',
      textAlign: 'center',
    }}>
      <h1 style={{ color: '#4361ee', fontSize: '2.5rem' }}>Finance App</h1>
      <p style={{ maxWidth: '600px', margin: '1rem 0 2rem' }}>
        A personal finance tracker powered by Plaid and LLM technology.
        Connect your accounts, track spending, and get AI-powered insights.
      </p>
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginTop: '20px'
      }}>
        <button 
          onClick={() => setView('login')} 
          style={buttonStyle}
        >
          Login
        </button>
        <button 
          onClick={() => setView('register')} 
          style={outlineButtonStyle}
        >
          Register
        </button>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);