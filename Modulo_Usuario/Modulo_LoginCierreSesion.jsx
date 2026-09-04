import React, { useState, useEffect } from 'react';
import Login from './LoginUsuario';
import CierreSesionUsuario from './Cierre_sesion';

const ModuloManejoInicioCierreSesion = (handleLogin) => {
  const [token, setToken] = useState(localStorage.getItem('token'));


  useEffect(() => {
    // Al iniciar la app, revisamos el localStorage para el token
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);


  const manejoInicioSesion = (token, tipo_usuario) => {
    setToken(token);
    handleLogin(token, tipo_usuario);
  };

  const manejoCierreSesion = () => {
    localStorage.removeItem('token');
    setToken(null)
  };

  return (
    <div>
       {token ? (
        <>
          <h2>Bienvenido, estás autenticado</h2>
          <CierreSesionUsuario onLogout={manejoCierreSesion} />
          {/* Aquí puedes poner tus rutas o componentes autenticados */}
        </>
      ) : (
        <Login onLogin={manejoInicioSesion} />
      )}
    </div>
  );
};

export default ModuloManejoInicioCierreSesion;