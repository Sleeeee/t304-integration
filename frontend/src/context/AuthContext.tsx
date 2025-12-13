import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import getCookie from './getCookie';

interface User {
  id: number;
  username: string;
  is_staff: boolean;
  is_superuser?: boolean;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csrfToken = getCookie("csrftoken");

    fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/me/`, {
      method: "GET",
      credentials: "include",
      headers: {
        'X-CSRFToken': csrfToken || "",
        'Accept': 'application/json'
      }
    }).then(res => {
      if (!res.ok) {
        throw new Error("Non authentifié");
      }
      return res.json();
    }).then(data => {
      setUser(data.user || data);
    }).catch(() => {
      setUser(null);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const logout = async () => {
    setLoading(true);
    const csrfToken = getCookie("csrftoken");
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/wlogout/`, {
      method: "POST",
      credentials: "include",
      headers: { 'X-CSRFToken': csrfToken || "" }
    });
    setUser(null);
    setLoading(false);
    window.location.reload();
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
