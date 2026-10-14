import { createContext, useContext, useState } from 'react';
import { getToken, logout as clearToken } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Restore the session if a JWT is still in sessionStorage (survives refresh).
  const [adminAuthed, setAdminAuthed] = useState(() => Boolean(getToken()));

  const logout = () => {
    clearToken();
    setAdminAuthed(false);
  };

  return (
    <AuthContext.Provider value={{ adminAuthed, setAdminAuthed, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
