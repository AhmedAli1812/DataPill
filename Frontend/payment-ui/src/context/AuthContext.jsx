import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (e) {
        localStorage.removeItem('user');
        return null;
      }
    }
    return null;
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const isAdmin = user?.roles?.includes('Admin');
  const isSales = user?.roles?.includes('Sales');
  const isAccountant = user?.roles?.includes('Accountant');
  const isInstructor = user?.roles?.includes('Instructor');
  const isMentor = user?.roles?.includes('Mentor');
  const isCoordinator = user?.roles?.includes('Coordinator');
  const isStudent = user?.roles?.includes('Student');

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, isSales, isAccountant, isInstructor, isMentor, isCoordinator, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
