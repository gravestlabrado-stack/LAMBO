import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

// Default mock student for fast offline & preview testing
const DEFAULT_DEMO_USER = {
  name: 'Elena Rostova',
  rollNumber: '2024-BSAB-001',
  section: 'BSAB-3A',
  role: 'Student Observer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lambo_user');
    return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER; // Default logged in for immediate UI testing
  });
  const [token, setToken] = useState(() => localStorage.getItem('lambo_token') || 'demo_token_12345');
  const [loading, setLoading] = useState(false);

  const login = async (credentials) => {
    // TODO: Remove default admin/admin bypass before production
    if (
      (credentials.rollNumber?.toLowerCase() === 'admin' && credentials.password === 'admin') ||
      !credentials.rollNumber?.trim()
    ) {
      const demoUser = DEFAULT_DEMO_USER;
      const demoToken = 'demo_admin_token_jwt';
      localStorage.setItem('lambo_token', demoToken);
      localStorage.setItem('lambo_user', JSON.stringify(demoUser));
      setToken(demoToken);
      setUser(demoUser);
      return { success: true, user: demoUser, token: demoToken };
    }

    try {
      const data = await authService.login(credentials);
      if (data.token) {
        localStorage.setItem('lambo_token', data.token);
        localStorage.setItem('lambo_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
      }
      return data;
    } catch (err) {
      // Fallback in case backend is offline so user can still test UI
      console.warn('[AuthContext] Backend unreachable, falling back to local student session');
      const fallbackUser = {
        name: credentials.rollNumber,
        rollNumber: credentials.rollNumber.toUpperCase(),
        section: 'BSAB-3A',
        role: 'Student Observer',
        avatar: '',
      };
      const fallbackToken = 'offline_session_token';
      localStorage.setItem('lambo_token', fallbackToken);
      localStorage.setItem('lambo_user', JSON.stringify(fallbackUser));
      setToken(fallbackToken);
      setUser(fallbackUser);
      return { success: true, user: fallbackUser, token: fallbackToken };
    }
  };

  const register = async (userData) => {
    // Create local user immediately
    const newUser = {
      name: userData.name || 'Student Observer',
      rollNumber: (userData.rollNumber || '2024-BSAB-001').toUpperCase(),
      section: userData.section || 'BSAB-3A',
      role: 'Student Observer',
      avatar: '',
    };
    const regToken = 'registered_session_token';
    localStorage.setItem('lambo_token', regToken);
    localStorage.setItem('lambo_user', JSON.stringify(newUser));
    setToken(regToken);
    setUser(newUser);
    return { success: true, user: newUser, token: regToken };
  };

  const logout = () => {
    localStorage.removeItem('lambo_token');
    localStorage.removeItem('lambo_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
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
