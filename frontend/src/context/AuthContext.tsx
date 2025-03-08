import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// Types
interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

// Auth provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mock login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    
    try {
      // For demo purposes, create a mock user and token
      setUser({
        id: 1,
        email,
        firstName: 'Demo',
        lastName: 'User',
      });
      
      setToken('mock-token');
    } finally {
      setLoading(false);
    }
  };

  // Mock register function
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setLoading(true);
    
    try {
      // For demo purposes, create a mock user and token
      setUser({
        id: 1,
        email,
        firstName,
        lastName,
      });
      
      setToken('mock-token');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);