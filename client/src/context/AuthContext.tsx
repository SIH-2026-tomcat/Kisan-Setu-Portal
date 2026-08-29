import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { Farmer, Officer } from '../types';

interface AuthContextType {
  token: string | null;
  role: 'FARMER' | 'OFFICER' | null;
  farmer: Farmer | null;
  officer: Officer | null;
  loading: boolean;
  loginFarmer: (token: string, farmer: Farmer) => void;
  loginOfficer: (token: string, officer: Officer) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('kisan_setu_token'));
  const [role, setRole] = useState<'FARMER' | 'OFFICER' | null>(
    (localStorage.getItem('kisan_setu_role') as 'FARMER' | 'OFFICER') || null
  );
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const storedToken = localStorage.getItem('kisan_setu_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.user) {
        if (res.user.role === 'FARMER') {
          setFarmer(res.user);
          setOfficer(null);
          setRole('FARMER');
        } else if (res.user.role === 'OFFICER') {
          setOfficer(res.user);
          setFarmer(null);
          setRole('OFFICER');
        }
      } else {
        logout();
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const loginFarmer = (newToken: string, newFarmer: Farmer) => {
    localStorage.setItem('kisan_setu_token', newToken);
    localStorage.setItem('kisan_setu_role', 'FARMER');
    setToken(newToken);
    setRole('FARMER');
    setFarmer(newFarmer);
    setOfficer(null);
  };

  const loginOfficer = (newToken: string, newOfficer: Officer) => {
    localStorage.setItem('kisan_setu_token', newToken);
    localStorage.setItem('kisan_setu_role', 'OFFICER');
    setToken(newToken);
    setRole('OFFICER');
    setOfficer(newOfficer);
    setFarmer(null);
  };

  const logout = () => {
    localStorage.removeItem('kisan_setu_token');
    localStorage.removeItem('kisan_setu_role');
    setToken(null);
    setRole(null);
    setFarmer(null);
    setOfficer(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        role,
        farmer,
        officer,
        loading,
        loginFarmer,
        loginOfficer,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
