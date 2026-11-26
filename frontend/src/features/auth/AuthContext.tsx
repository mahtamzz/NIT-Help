import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole } from '@nit-help/shared';
import { api, setAuthToken } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId?: string | null;
  departmentName?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (usernameOrEmail: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session via HTTP-only refresh cookie
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await api.post('/auth/refresh');
        setAuthToken(data.accessToken);
        setUser(data.user);
      } catch (err) {
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (usernameOrEmail: string, pass: string) => {
    const { data } = await api.post('/auth/login', { usernameOrEmail, password: pass });
    setAuthToken(data.accessToken);
    setUser(data.user);
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore error on logout
    } finally {
      setAuthToken(null);
      setUser(null);
    }
  };

  const hasRole = (...roles: UserRole[]) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasRole,
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

