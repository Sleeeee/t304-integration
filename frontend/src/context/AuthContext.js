import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/auth/me/", {
      method: "GET",
      credentials: "include",

    }).then(res => {
      if (!res.ok) {
        throw new Error("Non authentifié");
      }
      return res.json();

    }).then(data => {
      setUser(data);

    }).catch(() => {
      setUser(false);

    }).finally(() => {
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{user, loading}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
