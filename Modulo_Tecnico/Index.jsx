import React, { useState, useEffect, useRef } from "react";
import './appT.css';
import MostrarContenidoSectionTec from "./SectionTec.jsx";
import MostrarContenidoAsideTec from "./AsideTec.jsx";
import { useSnackbar } from 'notistack';
import { io } from 'socket.io-client';

const InicioT = ({ tecnicoId, user}) => {
  const { enqueueSnackbar } = useSnackbar();

  const [ubicacion, setUbicacion] = useState(null);
  const [loading, setLoading] = useState(false);

  const [permisoUbicacionDB, setPermisoUbicacionDB] = useState(false);
  const [permisoCargado, setPermisoCargado] = useState(false);    

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false); 
  const [mostrarGestionPermiso, setMostrarGestionPermiso] = useState(false); 

  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io("http://localhost:3042"); // 👈 tu microservicio de notificaciones
    socketRef.current = socket;

    if (tecnicoId) {
      socket.emit("unirseSala", tecnicoId); // 👈 para que le lleguen notificaciones dirigidas
    }

    socket.on("nueva-notificacion", (data) => {
      console.log("📩 Notificación recibida:", data);
      // Aquí puedes mostrar un toast, actualizar estado, etc.
    });

    return () => {
      socket.disconnect();
    };
  }, [tecnicoId]);

  /* ───────────── WebSocket ───────────── */
  useEffect(() => {
    const socket = io('http://localhost:3060');
    socketRef.current = socket;

    socket.emit('registrarTecnico', tecnicoId);

    socket.on('ubicacion:solicitar', async () => {
      try {
        const { state } = await navigator.permissions.query({ name: 'geolocation' });
        if (state !== 'granted') {
          socket.emit('ubicacion:respuesta', { codigo_trabajador: tecnicoId, error: 'permiso_denegado' });
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            socket.emit('ubicacion:respuesta', {
              codigo_trabajador: tecnicoId,
              latitud: pos.coords.latitude,
              longitud: pos.coords.longitude,
            });
          },
          () => socket.emit('ubicacion:respuesta', { codigo_trabajador: tecnicoId, error: 'error_geolocalizacion' })
        );
      } catch { /* ignore */ }
    });

    return () => socket.disconnect();
  }, [tecnicoId]);

  /* ───────────── Verificar permiso en BD ───────────── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/tecnico/${tecnicoId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
        const tienePermiso = data.permiso_ubicacion === true || data.permiso_ubicacion === 'true';
        setPermisoUbicacionDB(tienePermiso);
        if (tienePermiso) {
          setMostrarGestionPermiso(true);   
        } else {
          setMostrarConfirmacion(true);    
        }
      })
      .catch(() => setMostrarConfirmacion(true))
      .finally(() => setPermisoCargado(true));
  }, [tecnicoId]);

  useEffect(() => {
  if (ubicacion) {
    console.log("📌 Última ubicación guardada:", ubicacion);
  }
}, [ubicacion]);


  
  useEffect(() => {
    if (!permisoCargado || permisoUbicacionDB) return;
    const id = setInterval(() => setMostrarConfirmacion(true), 600000);
    return () => clearInterval(id);
  }, [permisoCargado, permisoUbicacionDB]);

  
  const obtenerUbicacion = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      enqueueSnackbar('⚠️ Geolocalización no soportada.', { variant: 'warning' });
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/ubicacion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ codigo_trabajador: tecnicoId, latitud: coords.latitude, longitud: coords.longitude }),
          });
          await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/tecnico/permisoubicacion`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
            body: JSON.stringify({ codigo_trabajador: tecnicoId, permiso_ubicacion: true }),
          });
          setPermisoUbicacionDB(true);
          setMostrarConfirmacion(false);
          setMostrarGestionPermiso(true);  
          setUbicacion({ codigo_trabajador: tecnicoId, latitud: coords.latitude, longitud: coords.longitude });

          enqueueSnackbar('📍 Ubicación guardada correctamente.', { variant: 'success' });
        } catch {
          enqueueSnackbar('❌ Error guardando ubicación.', { variant: 'error' });
        } finally {
          setLoading(false);
        }
      },
      () => {
        enqueueSnackbar('⚠️ No se pudo obtener tu ubicación.', { variant: 'warning' });
        setLoading(false);
      }
    );
  };

  /* ───────────── Revocar permiso ───────────── */
  const revocarPermiso = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/tecnico/permisoubicacion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ codigo_trabajador: tecnicoId, permiso_ubicacion: false }),
      });
      enqueueSnackbar('ℹ️ Has retirado el permiso de ubicación.', { variant: 'info' });
      setPermisoUbicacionDB(false);
      setMostrarGestionPermiso(false);
      setMostrarConfirmacion(true);   
    } catch {
      enqueueSnackbar('❌ No se pudo revocar el permiso.', { variant: 'error' });
    }
  };

useEffect(() => {
  if (!permisoCargado || !permisoUbicacionDB) return;

  const verificarYActualizarUbicacion = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/ubicacion/ultima/${tecnicoId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      const data = await res.json();
      const ultimaFecha = data?.fecha_actualizacion ? new Date(data.fecha_actualizacion) : null;
      const ahora = new Date();
      const minutosPasados = ultimaFecha ? (ahora - ultimaFecha) / (1000 * 60) : Infinity;

      const minutosUmbral = 1;

      if (minutosPasados >= minutosUmbral) {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            try {
              await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/mapa/ubicacion`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                  codigo_trabajador: tecnicoId,
                  latitud: coords.latitude,
                  longitud: coords.longitude,
                }),
              });
              setUbicacion({
                codigo_trabajador: tecnicoId,
                latitud: coords.latitude,
                longitud: coords.longitude,
              });
              enqueueSnackbar('📍 Ubicación registrada automáticamente.', { variant: 'info' });
            } catch {
              enqueueSnackbar('❌ Error registrando ubicación automática.', { variant: 'error' });
            }
          },
          () => {
            enqueueSnackbar('⚠️ Error obteniendo ubicación automática.', { variant: 'warning' });
          },
          { enableHighAccuracy: true }
        );
      }
    } catch (err) {
      console.warn("⚠️ Error al verificar la última ubicación:", err);
    }
  };

  // Llamada inicial
  verificarYActualizarUbicacion();

  // Polling cada 3 minutos
  const intervalo = setInterval(verificarYActualizarUbicacion, 1 * 60 * 1000);

  // Limpieza al desmontar
  return () => clearInterval(intervalo);
}, [permisoCargado, permisoUbicacionDB, tecnicoId]);







  /* ───────────── Render ───────────── */
  return (
    <main className="main-Tec">
      <div className="div-contenedor-secasi">
        <div className="section-tec-content"><MostrarContenidoSectionTec user={user}/></div>
        <div className="aside-tec-content"><MostrarContenidoAsideTec /></div>
      </div>

      
      {permisoCargado && mostrarConfirmacion && (
        <div className="modal-ubicacion">
          <h2>📍 Permiso de Ubicación</h2>
          {loading ? <p>⌛ Solicitando ubicación…</p> : (
            <>
              <p>
                Para optimizar la logística y mejorar tu flujo de trabajo, la empresa necesita acceder a tu ubicación
                <strong> únicamente</strong> con fines operativos. Tu consentimiento permanecerá activo hasta que
                decidas retirarlo.
              </p>
              <button onClick={obtenerUbicacion}>Aceptar términos y compartir</button>
              <button onClick={() => setMostrarConfirmacion(false)}>Denegar</button>
            </>
          )}
        </div>
      )}

      
      {permisoCargado && mostrarGestionPermiso && (
        <div className="modal-ubicacion">
          <h2>🔒 Gestión de Permiso</h2>
          <p>
            Ya has autorizado el acceso a tu ubicación. Si deseas mantenerlo para continuar apareciendo en el mapa,
            selecciona “Seguir”. Puedes retirarlo en cualquier momento.
          </p>
          <button onClick={() => setMostrarGestionPermiso(false)}>Seguir compartiendo</button>
          <button onClick={revocarPermiso}>Retirar permiso</button>
        </div>
      )}
    </main>
  );
};

export default InicioT;
