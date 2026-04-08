import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mediremind_token');
    const savedUser = localStorage.getItem('mediremind_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('mediremind_token');
        localStorage.removeItem('mediremind_user');
      }
    }
    setLoading(false);
  }, []);

  const loginUser = (token, userData) => {
    localStorage.setItem('mediremind_token', token);
    localStorage.setItem('mediremind_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('mediremind_token');
    localStorage.removeItem('mediremind_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
