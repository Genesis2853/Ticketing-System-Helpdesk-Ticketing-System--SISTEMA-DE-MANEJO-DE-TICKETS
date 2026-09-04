import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function NotificacionesPage({ user, token }) {
  const [notificaciones, setNotificaciones] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?.id) return;

    axios.get(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/notificaciones/${user.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setNotificaciones(res.data))
    .catch(err => console.error('Error cargando notificaciones:', err));
  }, [user, token]);

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <button 
        className='Boton-volver' 
        onClick={() => navigate(-1)} 
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: '#3966c7ff',
          transition: 'background-color 0.3s',
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#e0e0e0'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
      >
        Volver
      </button>

      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>Notificaciones</h2>
     
      {notificaciones.length === 0 ? (
        <p style={{ textAlign: 'center', fontStyle: 'italic' }}>No tienes notificaciones.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {notificaciones.map(n => (
            <li 
              key={n.id} 
              style={{
                backgroundColor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem',
                textAlign: 'center',
                maxWidth: '100%',
                wordWrap: 'break-word',
              }}
            >
              <strong style={{ display: 'block', marginBottom: '0.5rem' }}>{n.mensaje}</strong>
              <small style={{ color: '#666' }}>{new Date(n.fecha).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default NotificacionesPage;
