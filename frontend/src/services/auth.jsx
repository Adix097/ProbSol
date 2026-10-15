import { createContext, useContext, useState } from 'react';
import * as api from './api';

// Simple auth context. Persists the user + token in localStorage.
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('probsol_user')); } catch { return null; }
  });

  const persist = ({ token, user: u }) => {
    localStorage.setItem('probsol_token', token || '');
    localStorage.setItem('probsol_user', JSON.stringify(u));
    setUser(u);
  };

  const login = async (email, password) => persist(await api.login(email, password));
  const signup = async (name, email, password) => persist(await api.signup(name, email, password));
  const logout = () => {
    localStorage.removeItem('probsol_token');
    localStorage.removeItem('probsol_user');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, signup, logout }}>{children}</AuthContext.Provider>;
}
