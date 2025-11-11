import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
// Assure-toi que le chemin vers getCookie est correct
import getCookie from './getCookie'; 

// --- 1. DÉFINIR L'INTERFACE POUR L'UTILISATEUR ---
interface User {
  id: number;
  username: string;
  is_staff: boolean;
  is_superuser?: boolean;
  email?: string;
}

// --- 2. DÉFINIR LE TYPE DE NOTRE CONTEXTE ---
interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
}

// --- 3. CORRIGER LA CRÉATION DU CONTEXTE ---
// Il ne doit pas être 'undefined', mais 'AuthContextType | undefined'
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// --- 4. CORRIGER LE TYPE DE 'children' ---
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 5. Typer l'état de l'utilisateur
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const csrfToken = getCookie("csrftoken"); 

    fetch("http://localhost:8000/auth/me/", {
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
      // On s'attend à ce que 'data' soit l'objet User ou { user: User }
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
    await fetch("http://localhost:8000/auth/wlogout/", {
        method: "POST",
        credentials: "include",
        headers: { 'X-CSRFToken': csrfToken || "" }
    });
    setUser(null);
    setLoading(false);
    window.location.reload();
  };

  return (
    // 'value' correspond maintenant au type 'AuthContextType'
    <AuthContext.Provider value={{user, loading, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

// --- 6. Typer la valeur de retour du hook ---
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};