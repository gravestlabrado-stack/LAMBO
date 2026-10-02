import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

// Helper to check JWT expiration client-side without network requests
function isJwtExpired(token) {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]));
    if (!payload.exp) return false;
    return payload.exp * 1000 < Date.now() - 10000;
  } catch {
    return true;
  }
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('lambo_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lambo_token') || null);
  const [loading, setLoading] = useState(false);

  // On mount, validate token locally and refresh profile if online
  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('lambo_token');
      if (!savedToken) return;

      // 1. Client-side expiration check (7-day field window)
      if (isJwtExpired(savedToken)) {
        console.warn('[Auth] Stored JWT expired, clearing session');
        localStorage.removeItem('lambo_token');
        localStorage.removeItem('lambo_user');
        setToken(null);
        setUser(null);
        return;
      }

      // 2. If device is offline, retain the stored cadet profile seamlessly
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.log('[Auth] Device is offline. Retaining active cadet session.');
        return;
      }

      // 3. If online, verify session with backend
      try {
        const data = await authService.getMe();
        if (data.success && data.user) {
          setUser(data.user);
          localStorage.setItem('lambo_user', JSON.stringify(data.user));
        }
      } catch (err) {
        // ONLY log out if the server explicitly returned 401 or 403 (invalid/revoked token)
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          console.warn('[Auth] Server rejected token (401/403), logging out');
          localStorage.removeItem('lambo_token');
          localStorage.removeItem('lambo_user');
          setToken(null);
          setUser(null);
        } else {
          // Network timeout, server wake-up, or offline disconnect: KEEP SESSION
          console.warn('[Auth] Network issue validating session. Retaining cached user profile.', err.message);
        }
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
