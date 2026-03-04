import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('auth_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  const linkCouple = async (coupleCode, partner) => {
    if (!user) return;

    try {
      const response = await fetch('/api/auth/link-couple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.userId,
        },
        body: JSON.stringify({ coupleCode, partner }),
      });

      if (response.ok) {
        // Refresh user data
        const meResponse = await fetch('/api/auth/me', {
          headers: { 'x-user-id': user.userId },
        });
        if (meResponse.ok) {
          const userData = await meResponse.json();
          const updatedUser = { ...user, couples: userData.couples };
          setUser(updatedUser);
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        }
      }
    } catch (error) {
      console.error('Error linking couple:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, linkCouple }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
