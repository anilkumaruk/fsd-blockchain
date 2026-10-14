import { createContext, useContext, useState } from 'react';
import { getSession, logout as clearSession, studentLogout as clearStudentSession } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // The logged-in institution (null when signed out). Restored from
  // sessionStorage so a page refresh keeps you signed in.
  const [institution, setInstitution] = useState(() => getSession()?.institution || null);

  // The signed-in student (Student Portal), kept separately from the institution.
  const [student, setStudent] = useState(() => getSession('student')?.student || null);

  const logout = () => {
    clearSession();
    setInstitution(null);
  };

  const studentLogout = () => {
    clearStudentSession();
    setStudent(null);
  };

  return (
    <AuthContext.Provider
      value={{
        adminAuthed: Boolean(institution),
        institution,
        signIn: setInstitution,
        logout,
        student,
        studentSignIn: setStudent,
        studentLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
