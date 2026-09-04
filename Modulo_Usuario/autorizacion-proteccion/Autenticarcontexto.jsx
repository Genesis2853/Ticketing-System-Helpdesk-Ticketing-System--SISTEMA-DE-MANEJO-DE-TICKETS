// AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser ] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const tipo = localStorage.getItem('tipo_usuario');
    if (token && tipo) {
      setUser ({ token, tipo_usuario: tipo });
    }
  }, []);

  const handleLogin = (token, tipo_usuario) => {
    localStorage.setItem('token', token);
    localStorage.setItem('tipo_usuario', tipo_usuario);
    setUser ({ token, tipo_usuario });
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('tipo_usuario');
    setUser (null);
  };

  return (
    <AuthContext.Provider value={{ user, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
