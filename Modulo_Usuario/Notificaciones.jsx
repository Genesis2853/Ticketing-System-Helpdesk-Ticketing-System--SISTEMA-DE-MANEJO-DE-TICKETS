import NotificationsIcon from '@mui/icons-material/Notifications';
import { Badge, IconButton, Menu, MenuItem } from '@mui/material';
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

function Notificaciones({ user, token }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  const navigate = useNavigate();
  const socketRef = useRef();

  useEffect(() => {
    if (!user) return;

    // Cargar notificaciones iniciales desde API
    axios.get(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/notificaciones/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setNotificaciones(res.data);
      const noLeidasCount = res.data.filter(n => !n.leida).length;
      setNoLeidas(noLeidasCount);
    })
    .catch(err => console.error('Error cargando notificaciones:', err));

    // Conectar socket.io solo una vez por usuario
    socketRef.current = io('http://localhost:3042');

    // Handler para nuevas notificaciones
    const handleNuevaNotificacion = (nueva) => {
      const notificacionConId = { ...nueva, id: Date.now() }; // id temporal único
      console.log('Notificación en tiempo real:', notificacionConId);
      setNotificaciones(prev => [notificacionConId, ...prev]);
      setNoLeidas(prev => prev + 1);
    };

    socketRef.current.on('nueva-notificacion', handleNuevaNotificacion);
    socketRef.current.on('connect', () => {
  console.log('Socket conectado con ID:', socketRef.current.id);
});

    // Cleanup al desmontar o cambiar usuario
    return () => {
      if (socketRef.current) {
        socketRef.current.off('nueva-notificacion', handleNuevaNotificacion);
        socketRef.current.disconnect();
      }
    };
  }, [user?.id, token]);

  useEffect(() => {
  if (!user) return;

  const cargarNotificaciones = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/notificaciones/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotificaciones(res.data);
      setNoLeidas(res.data.filter(n => !n.leida).length);
    } catch (err) {
      console.error('Error cargando notificaciones:', err);
    }
  };

  cargarNotificaciones(); // carga inicial

  const intervalId = setInterval(cargarNotificaciones, 2000); // cada 5 segundos

  // Limpiar interval cuando cambie user o token o se desmonte
  return () => clearInterval(intervalId);

}, [user?.id, token]);


  const handleOpenMenu = async (e) => {
    setAnchorEl(e.currentTarget);

    try {
      await axios.put(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/notificaciones/marcar-leidas/${user.id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Marcar todas como leídas en frontend
      setNotificaciones((prev) =>
        prev.map((n) => ({ ...n, leida: true }))
      );
      setNoLeidas(0);
    } catch (err) {
      console.error('Error marcando notificaciones como leídas:', err);
    }
  };

  function formatearFecha(fechaISO) {
  if (!fechaISO) return '';
  const fecha = new Date(fechaISO);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(fecha);
}


  return (
    <>
      <IconButton onClick={handleOpenMenu} color="inherit">
        <Badge badgeContent={noLeidas} color="error" className='campanita'>
          <NotificationsIcon className="custom-icon" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          style: {
            maxHeight: 300,
            width: '300px',
            overflowY: 'auto',
            color: 'black',
          }
        }}
      >
        <MenuItem disabled>
          <strong style={{ fontSize: '18px', opacity: 0.8 }}>Notificaciones</strong>
        </MenuItem>
        <MenuItem divider />

      {notificaciones.length === 0 ? (
  <MenuItem disabled>No tienes notificaciones</MenuItem>
) : (
  notificaciones.slice(0, 5).map((n, idx, arr) => (
    <MenuItem
      key={n.id}
      style={{
        fontWeight: n.leida ? 'normal' : 'bold',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        maxWidth: '300px',
        whiteSpace: 'pre-wrap',
        borderBottom: idx !== arr.length - 1 ? '1px solid #ccc' : 'none',
        padding: '8px 12px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <span>{n.mensaje}</span>
      <small
        style={{
          fontSize: '0.75em',
          color: '#666',
          borderTop: '1px solid #ccc',
          marginTop: '2px',
          paddingTop: '2px',
          alignSelf: 'flex-start',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {formatearFecha(n.fecha)}
      </small>
    </MenuItem>
  ))
)}



        <MenuItem divider />
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            navigate('/notificaciones');
          }}
        >
          Ver todas
        </MenuItem>
      </Menu>
    </>
  );
}

export default Notificaciones;
