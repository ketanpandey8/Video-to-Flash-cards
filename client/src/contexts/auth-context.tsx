
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  name: string;
  profileImage?: string;
  bio?: string;
  url?: string;
  roles?: string[];
  teams?: string[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/user');
      const data = await response.json();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = () => {
    window.addEventListener("message", authComplete);
    const h = 500;
    const w = 350;
    const left = screen.width / 2 - w / 2;
    const top = screen.height / 2 - h / 2;

    const authWindow = window.open(
      "https://replit.com/auth_with_repl_site?domain=" + location.host,
      "_blank",
      "modal=yes, toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=" +
        w +
        ", height=" +
        h +
        ", top=" +
        top +
        ", left=" +
        left
    );

    function authComplete(e: MessageEvent) {
      if (e.data !== "auth_complete") {
        return;
      }

      window.removeEventListener("message", authComplete);
      authWindow?.close();
      fetchUser(); // Refresh user data after login
    }
  };

  const logout = () => {
    setUser(null);
    // Replit Auth doesn't have a logout endpoint, so we just clear the local state
    // The user would need to log out from Replit directly
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
