import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lambo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lambo_token') || null);
  const [loading, setLoading] = useState(false);

  // On mount, if we have a token try to validate it by fetching /auth/me
  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('lambo_token');
      if (!savedToken) return;

      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('lambo_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // Token is invalid or expired — clear session
        console.warn('[Auth] Session expired or invalid, logging out');
        localStorage.removeItem('lambo_token');
        localStorage.removeItem('lambo_user');
        setToken(null);
        setUser(null);
      }
    };

    validateSession();
  }, []);

  const login = async (credentials) => {
    if (!credentials.rollNumber?.trim() || !credentials.password?.trim()) {
      throw new Error('Please enter your roll number and password');
    }

    setLoading(true);
    try {
      const data = await authService.login(credentials);
      if (data.success && data.token) {
        localStorage.setItem('lambo_token', data.token);
        localStorage.setItem('lambo_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
      } else {
        throw new Error(data.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      if (data.success && data.token) {
        localStorage.setItem('lambo_token', data.token);
        localStorage.setItem('lambo_user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return data;
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (formDataOrData) => {
    setLoading(true);
    try {
      const data = await authService.updateProfile(formDataOrData);
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('lambo_user', JSON.stringify(data.user));
        return data;
      } else {
        throw new Error(data.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('lambo_token');
    localStorage.removeItem('lambo_user');
    localStorage.removeItem('lambo_trees');
    localStorage.removeItem('lambo_growth_logs');
    localStorage.removeItem('lambo_reminders');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        register,
        updateProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
