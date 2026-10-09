import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('tg_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('tg_token') || '');

  const saveAuthSession = (authData) => {
    setUser(authData.user);
    setToken(authData.access_token);
    localStorage.setItem('tg_user', JSON.stringify(authData.user));
    localStorage.setItem('tg_token', authData.access_token);
  };

  const login = async (email, password) => {
    const res = await api.loginAdmin({ email, password });
    saveAuthSession(res);
    return res.user;
  };

  const register = async (fullName, email, password) => {
    const res = await api.registerAdmin({
      full_name: fullName,
      email,
      password
    });
    saveAuthSession(res);
    return res.user;
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('tg_user');
    localStorage.removeItem('tg_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userId: user?.id || null,
        token,
        isAuthenticated: !!user,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
