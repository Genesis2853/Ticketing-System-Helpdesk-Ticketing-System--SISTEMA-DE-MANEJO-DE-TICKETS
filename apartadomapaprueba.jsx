import React, { useState } from 'react';

const Geolocalizacion = () => {
  const [ubicacion, setUbicacion] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const obtenerUbicacion = () => {
    setError(null);
    setLoading(true);

    if (!navigator.geolocation) {
      setError('⚠️ Tu navegador no soporta la geolocalización.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        setUbicacion({ lat, lng });
        setLoading(false);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('⚠️ Permiso denegado para acceder a la ubicación.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('⚠️ No se pudo obtener la ubicación.');
            break;
          case error.TIMEOUT:
            setError('⚠️ El tiempo para obtener la ubicación expiró.');
            break;
          default:
            setError('❌ Error desconocido al obtener la ubicación.');
        }
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      textAlign: 'center', 
      padding: '20px',
      backgroundColor: '#f0f2f5', 
      borderRadius: '10px', 
      boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)' 
    }}>
      <h1 style={{ color: '#2f8bfd' }}>🌍 Obtener Geolocalización</h1>

      <button 
        onClick={obtenerUbicacion} 
        style={{
          backgroundColor: '#2f8bfd',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          fontSize: '1.2rem',
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'background-color 0.25s ease',
          userSelect: 'none',
        }}
      >
        {loading ? '⌛ Obteniendo ubicación...' : '📍 Mostrar mi ubicación'}
      </button>

      <div style={{ marginTop: '1.5rem', fontSize: '1.1rem' }}>
        {ubicacion && (
          <p>✅ Tu ubicación es: Latitud {ubicacion.lat}, Longitud {ubicacion.lng}</p>
        )}
      </div>

      {error && (
        <p style={{ marginTop: '1rem', color: '#d9534f', fontWeight: 'bold' }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
};

export default Geolocalizacion;
