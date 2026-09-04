// NotificacionesContext.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const NotificacionesContext = createContext();

export function NotificacionesProvider({ user, children }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const fetchNotificaciones = async () => {
    if (!user) return;
    const token = localStorage.getItem('token');
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/notificaciones/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(res.data);
      setNoLeidas(res.data.filter(n => !n.leida).length);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [user?.id]);

  return (
    <NotificacionesContext.Provider value={{ notificaciones, noLeidas, fetchNotificaciones }}>
      {children}
    </NotificacionesContext.Provider>
  );
}

export function useNotificaciones() {
  return useContext(NotificacionesContext);
}
