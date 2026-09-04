import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';
import { useSnackbar } from 'notistack';
import './Mapa.css';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import ReporteUbicacionActual from './ReporteMapa/ReporteUbicacionActual';
import ReporteUbicacionesMultiples from './ReporteMapa/ReporteUbicacionesMultiples';

/* ───────────── Ajuste iconos Leaflet ───────────── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

/* ───────────── Constantes ───────────── */
const VISTA_INICIAL = [10.168012878733563, -64.68429852414972];

/* Centra y ajusta el mapa a un conjunto de bounds */
function FitBounds({ bounds }) {
  const map = useMap();
  if (bounds.length === 0) return null;
  map.fitBounds(bounds, { padding: [50, 50] });
  return null;
}

/* ───────────── Componente para controlar el mapa ───────────── */
function ControladorMapa({ posicion, codigo, marcadorRef }) {
  const map = useMap(); // <-- Obtiene la instancia del mapa actual

  useEffect(() => {
    // Si hay un código seleccionado, significa que debemos actuar
    if (codigo) {
      map.flyTo(posicion, 14, { duration: 1.5 });

      // Abrimos el popup después de que la animación del mapa termine
      setTimeout(() => {
        if (marcadorRef.current) {
          marcadorRef.current.openPopup();
        }
      }, 1600); // Un poco más que la duración de flyTo
    }
  }, [posicion, codigo, map, marcadorRef]); // Se ejecuta cuando la posición o el técnico cambian

  return null; // Este componente no renderiza nada
}



const Mapa = () => {
  /* ───────────── Estados ───────────── */
  const [tecnicos, setTecnicos] = useState([]);
  const [ubicaciones, setUbicaciones] = useState([]);
  const [modoMultiple, setModoMultiple] = useState(false);
  const [seleccionMultiple, setSeleccionMultiple] = useState([]);
  const [filtroTecnico, setFiltroTecnico] = useState('ninguno');
  const [seleccionUnicaCodigo, setSeleccionUnicaCodigo] = useState('');
  const [mostrarTecnicoUnico, setMostrarTecnicoUnico] = useState(false);
  const [posicionMapa, setPosicionMapa] = useState(VISTA_INICIAL);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState('');
  const [permisoTecnicoActivo, setPermisoTecnicoActivo] = useState(false);
  const [mostrarModalPDF, setMostrarModalPDF] = useState(false);

  /* ───────────── Refs ───────────── */
  const mapaRef = useRef(null);
  const marcadorUnicoRef = useRef(null);
  const socketRef = useRef(null);

  /* ───────────── Snackbar ───────────── */
  const { enqueueSnackbar } = useSnackbar();

  /* ───────────── Conexión WebSocket ───────────── */
  useEffect(() => {
    const socket = io('http://localhost:3060');
    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  /* ───────────── Listeners de socket ───────────── */
  useEffect(() => {
    const socket = socketRef.current;

    socket.on('ubicacion:confirmada', (data) => {
      enqueueSnackbar(data.mensaje, { variant: 'success' });

      if (mapaRef.current && data.latitud && data.longitud) {
        mapaRef.current.flyTo([data.latitud, data.longitud], 17, { duration: 1.5 });
      }
    });

    socket.on('ubicacion:error', (data) => {
      enqueueSnackbar(data.mensaje || '⚠️ Error obteniendo ubicación del técnico.', { variant: 'error' });
    });

    return () => {
      socket.off('ubicacion:confirmada');
      socket.off('ubicacion:error');
    };
  }, [enqueueSnackbar]);

  /* ───────────── Fetch técnicos ───────────── */
  useEffect(() => {
    fetch('http://localhost:3060/api/mapa/tecnicos')
      .then((res) => res.json())
      .then((data) => setTecnicos(data))
      .catch(() => console.error('❌ Error obteniendo lista de técnicos'));
  }, []);

  /* ───────────── Fetch historial ubicaciones ───────────── */
useEffect(() => {
  const fetchUbicaciones = () => {
    fetch('http://localhost:3060/api/mapa/historial')
      .then((res) => res.json())
      .then((data) => setUbicaciones(data))
      .catch(() => setUbicaciones([]));
  };

  // Ejecutar inmediatamente al montar
  fetchUbicaciones();

  // Luego establecer intervalo cada 2 segundos
  const interval = setInterval(fetchUbicaciones, 2000);

  // Limpiar el intervalo al desmontar
  return () => clearInterval(interval);
}, []);


  /* ───────────── Verificar si técnico tiene registros ───────────── */
  const tecnicoTieneUbicaciones =
    seleccionUnicaCodigo !== '' && ubicaciones.some(u => u.codigo_trabajador === seleccionUnicaCodigo);

  /* ───────────── Actualizar mapa modo individual ───────────── */
  useEffect(() => {
    // Si no estamos mostrando un técnico o no hay uno seleccionado, no hacemos nada.
    if (!mostrarTecnicoUnico || seleccionUnicaCodigo === '') return;

    // Buscamos la última ubicación del técnico seleccionado.
    const ubicacion = ubicaciones
      .filter(u => u.codigo_trabajador === seleccionUnicaCodigo)
      .sort((a, b) => new Date(b.fecha_actualizacion) - new Date(a.fecha_actualizacion))[0];

    // Si encontramos una ubicación, actualizamos el estado de la posición del mapa.
    if (ubicacion) {
      setPosicionMapa([ubicacion.latitud, ubicacion.longitud]);
      // YA NO NECESITAMOS flyTo NI setTimeout AQUÍ.
      // El componente ControladorMapa se encargará de esto.
    }
  }, [seleccionUnicaCodigo, mostrarTecnicoUnico, ubicaciones]);

  /* ───────────── Última ubicación por técnico ───────────── */
  const obtenerUltimosRegistros = () => {
    const actual = {};
    ubicaciones.forEach(u => {
      if (!actual[u.codigo_trabajador] ||
          new Date(u.fecha_actualizacion) > new Date(actual[u.codigo_trabajador].fecha_actualizacion)) {
        actual[u.codigo_trabajador] = u;
      }
    });
    return Object.values(actual);
  };
  const ultimosRegistros = obtenerUltimosRegistros();

  /* ───────────── Handlers modo individual ───────────── */
  const handleSelectChange = (codigo) => {
    if (codigo !== '' && !ubicaciones.some(u => u.codigo_trabajador === codigo)) {
      setMostrarTecnicoUnico(false);
      setSeleccionUnicaCodigo('');
      return;
    }
    setSeleccionUnicaCodigo(codigo);
    setMostrarTecnicoUnico(codigo !== '');
    if (codigo === '') setPosicionMapa(VISTA_INICIAL);
  };

  const handleCheckboxUnicoChange = (codigo) => {
    if (mostrarTecnicoUnico && seleccionUnicaCodigo === codigo) {
      setMostrarTecnicoUnico(false);
      setSeleccionUnicaCodigo('');
      setPosicionMapa(VISTA_INICIAL);
    } else {
      if (!ubicaciones.some(u => u.codigo_trabajador === codigo)) return;
      setSeleccionUnicaCodigo(codigo);
      setMostrarTecnicoUnico(true);
    }
  };

  /* ───────────── Handlers filtros modo múltiple ───────────── */
  const handleFiltroTecnicoChange = (e) => {
    setFiltroTecnico(e.target.value);
    setSeleccionMultiple([]);
  };

  const handleFechaDesdeChange = (e) => {
  setSeleccionFiltros(prev => ({ ...prev, fechaDesde: e.target.value }));
  setSeleccionMultiple([]);
};

const handleFechaHastaChange = (e) => {
  setSeleccionFiltros(prev => ({ ...prev, fechaHasta: e.target.value }));
  setSeleccionMultiple([]);
};

  const [seleccionFiltros, setSeleccionFiltros] = useState({
  fechaDesde: '',
  fechaHasta: '',
  // otros filtros si tienes
});


  const fechaLocalYYYYMMDD = (iso) => {
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const ubicacionesFiltradas = ubicaciones.filter(u => {
  const okTec =
    filtroTecnico === 'ninguno' || filtroTecnico === ''
      ? true
      : filtroTecnico === 'todos'
        ? true
        : u.codigo_trabajador === filtroTecnico;

  const fecha = fechaLocalYYYYMMDD(u.fecha_actualizacion); // ya es formato YYYY-MM-DD
  const { fechaDesde, fechaHasta } = seleccionFiltros;

  const okFecha =
    (!fechaDesde || fecha >= fechaDesde) &&
    (!fechaHasta || fecha <= fechaHasta);

  return okTec && okFecha;
});


  /* ───────────── Selección múltiple ───────────── */
  const toggleSeleccionMultiple = (id) => {
    const exists = seleccionMultiple.some(u => u.id === id);
    if (exists) {
      setSeleccionMultiple(seleccionMultiple.filter(u => u.id !== id));
    } else {
      const ubicacion = ubicaciones.find(u => u.id === id);
      if (ubicacion) setSeleccionMultiple([...seleccionMultiple, ubicacion]);
    }
  };

  /* ───────────── Cambiar modo ───────────── */
  const toggleModoMultiple = (modo) => {
    setModoMultiple(modo === 'pasado');
    setSeleccionUnicaCodigo('');
    setMostrarTecnicoUnico(modo === 'actual');
    setPosicionMapa(VISTA_INICIAL);
    setSeleccionMultiple([]);
    setFiltroTecnico('ninguno');
    setSeleccionFiltros({ fecha: '' });
  };

  /* ───────────── Helpers ───────────── */
  const obtenerNombreTecnico = (codigo) => {
    const t = tecnicos.find(t => t.codigo_trabajador === codigo);
    return t ? `${t.nombre_tecnico} ${t.apellido_tecnico}` : codigo;
  };

  const formatearFecha = (f) =>
    new Date(f).toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });











    
  /* ───────────── Render ───────────── */
  return (

    <div
  style={{
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    fontFamily: 'Arial, sans-serif',
    padding: 20,
     marginLeft: 100,
    margin: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
  }}
  className='mapa-contenedor-responsive'
>




      {/* ───────────── Panel lateral ───────────── */}
      <div style={{
        width: '49%',
        maxWidth: '49%',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: 10,
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        textAlign: 'left',
        overflowY: 'auto',
        maxHeight: 600,
      }}
      className='contenedor-panel-lateral'
      >
        <h2 className='h2-mapa'>Registros Actuales</h2>

        <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
          <div className='contenedor-ubicaciones'>
          <label htmlFor='modo1' style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <input
              id='modo1'
              name='modo1'
              type='checkbox'
              checked={!modoMultiple}
              onChange={() => toggleModoMultiple('actual')}
              style={{ marginRight: 1 }}
            />
            <p>Ubicación Actual</p>
          </label>
          </div>

          <div className='contenedor-ubicaciones'>
          <label htmlFor='modo2' style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <input
              id='modo2'
              name='modo2'
              type='checkbox'
              checked={modoMultiple}
              onChange={() => toggleModoMultiple('pasado')}
              style={{ marginRight: 0 }}
            />
            Ubicaciones Pasadas
          </label>
          </div>
        </div>

        {/* ───────────── Modo individual ───────────── */}
        {!modoMultiple && (
          <>
            <select
              onChange={e => handleSelectChange(e.target.value)}
              style={{
                padding: 8,
                fontSize: '1rem',
                marginBottom: 10,
                borderRadius: 5,
                border: '1px solid #ccc',
                cursor: 'pointer',
                width: '100%',
              }}
              value={seleccionUnicaCodigo}
            >
              <option value=''>-- Escoge un técnico --</option>
              {tecnicos.map(t => (
                <option key={t.codigo_trabajador} value={t.codigo_trabajador}>
                  Técnico {t.nombre_tecnico} {t.apellido_tecnico}
                </option>
              ))}
            </select>
            
            

          <div className='contenedor-reporte-2'>
            {/* Botón de Previsualización en Modal */}
            <button
              onClick={() => setMostrarModalPDF(true)}
              className='buton-mapa'
              style={{ marginTop: 5 }}
            >
              👁️ Ver PDF
            </button>

            {/* Botón de Descargar PDF */}
            <PDFDownloadLink
              document={
                <ReporteUbicacionActual
                  tecnico={obtenerNombreTecnico}
                  ubicacion={ultimosRegistros[0]} // solo la última ubicación
                />
              }
              fileName={`ubicacion_actual_${seleccionUnicaCodigo}.pdf`}
            >
              {({ loading }) => (
                <button className='buton-mapa' style={{ marginTop: 5, marginLeft: 10 }}>
                  {loading ? 'Generando PDF...' : '⬇️ Descargar PDF'}
                </button>
              )}
            </PDFDownloadLink>

            {/* Modal de Previsualización */}
            {mostrarModalPDF && (
              <div
                style={{
                  position: 'fixed',
                  top: 0, left: 0,
                  width: '100vw', height: '100vh',
                  backgroundColor: 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  zIndex: 9999,
                }}
                onClick={() => setMostrarModalPDF(false)}
              >
                <div
                  style={{
                    width: '80vw',
                    height: '80vh',
                    backgroundColor: 'white',
                    borderRadius: 8,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => setMostrarModalPDF(false)}
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      border: 'none',
                      background: 'transparent',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                    }}
                    aria-label="Cerrar modal"
                  >
                    &times;
                  </button>

                  <div style={{ marginTop: '1rem', height: '600px', border: '1px solid #ccc' }}>
                    <PDFViewer width="100%" height="100%">
                      <ReporteUbicacionActual
                        tecnico={obtenerNombreTecnico}
                        ubicacion={ultimosRegistros || []}
                      />
                    </PDFViewer>
                  </div>
                </div>
              </div>
            )}
          </div>





            {seleccionUnicaCodigo !== '' && !tecnicoTieneUbicaciones && (
              <p style={{ color: 'red', fontWeight: 'bold' }}>
                ⚠️ El técnico seleccionado no tiene registros de ubicación.
              </p>
            )}

            <h3 className='h3-mapa' style={{ marginTop: 10 }}>Últimos Registros</h3>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {ultimosRegistros.length === 0 ? (
                <p style={{ color: 'red' }}>⚠️ No hay registros actuales para mostrar.</p>
              ) : (
                ultimosRegistros.map((u, idx) => (
                  <li key={idx} style={{ marginBottom: 8, fontSize: '1rem' }}>
                    <div className='contenedor-check-mapa'>
                    <label  className='label-chek check-mapa' style={{ cursor: 'pointer' }}>
                      <input
                        type='checkbox'
                        checked={mostrarTecnicoUnico && seleccionUnicaCodigo === u.codigo_trabajador}
                        onChange={() => handleCheckboxUnicoChange(u.codigo_trabajador)}
                        style={{ marginRight: 1, cursor: 'pointer' }}
                      />
                      
                    </label>
                    <br />
                    <div className='contenedor-tecnicos-mapa'>
                    <strong>👷 {obtenerNombreTecnico(u.codigo_trabajador)}</strong>
                    <br />
                    📅 {formatearFecha(u.fecha_actualizacion)} <br />
                    📍 Latitud: {u.latitud} | 📍 Longitud: {u.longitud}
                    </div>
                    </div>
                  </li>
                ))
              )}
            </ul>

            

            {seleccionUnicaCodigo === '' &&
              <p style={{ color: 'red' }}>⚠️ Selecciona un técnico en el select o checkbox para activar el mapa</p>}
          </>
        )}
       






        {/* ───────────── Modo múltiple ───────────── */}
        {modoMultiple && (
          <>
          <div style={{ width: '100%' }}>
            <h3 className='h3-mapa'>Registro de Ubicaciones Pasadas</h3>

            <label style={{ display: 'block', marginBottom: 5 }}>Filtrar por Técnico:</label>
            <select
              onChange={handleFiltroTecnicoChange}
              value={filtroTecnico}
              style={{
                padding: 6,
                fontSize: '.9rem',
                borderRadius: 5,
                border: '1px solid #ccc',
                width: '100%',
                marginBottom: 10,
              }}
            >
              <option value='ninguno'>Ninguno</option>
              <option value='todos'>Todos</option>
              {tecnicos.map(t => (
                <option key={t.codigo_trabajador} value={t.codigo_trabajador}>
                  {t.nombre_tecnico} {t.apellido_tecnico}
                </option>
              ))}
            </select>
            

            <label style={{ display: 'block', marginBottom: 5 }}>Filtrar Desde:</label>
          <input
            type='date'
            value={seleccionFiltros.fechaDesde}
            onChange={handleFechaDesdeChange}
            style={{
              padding: 6,
              fontSize: '.9rem',
              borderRadius: 5,
              border: '1px solid #ccc',
              width: '100%',
              marginBottom: 10,
            }}
          />

          <label style={{ display: 'block', marginBottom: 5 }}>Filtrar Hasta:</label>
          <input
            type='date'
            value={seleccionFiltros.fechaHasta}
            onChange={handleFechaHastaChange}
            style={{
              padding: 6,
              fontSize: '.9rem',
              borderRadius: 5,
              border: '1px solid #ccc',
              width: '100%',
              marginBottom: 10,
            }}
          />

          <div>
      {/* Botón para mostrar/ocultar previsualización */}
      {/* Botón para mostrar modal */}
      <button
        onClick={() => setMostrarModalPDF(true)}
        className='buton-mapa butico'
      >
        Previsualizar PDF
      </button>

      {/* Botón para descargar PDF */}
      <PDFDownloadLink
        document={
          <ReporteUbicacionesMultiples
            ubicaciones={ubicacionesFiltradas || []}
            obtenerNombreTecnico={obtenerNombreTecnico}
          />
        }
        fileName="ubicaciones_filtradas.pdf"
        className='buton-mapa butico'
      >
        {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
      </PDFDownloadLink>

      {/* Previsualización PDF */}
      {mostrarModalPDF && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setMostrarModalPDF(false)} // cerrar al clickear fondo
        >
          <div
            style={{
              width: '80vw',
              height: '80vh',
              backgroundColor: 'white',
              borderRadius: 8,
              boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={e => e.stopPropagation()} // evitar cerrar modal al clickear dentro
          >
            <button
              onClick={() => setMostrarModalPDF(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                border: 'none',
                background: 'transparent',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
              aria-label="Cerrar modal"
            >
              &times;
            </button>
        <div style={{ marginTop: '1rem', height: '600px', border: '1px solid #ccc' }}>
          <PDFViewer width="100%" height="100%">
            <ReporteUbicacionesMultiples
              ubicaciones={ubicacionesFiltradas || []}
              obtenerNombreTecnico={obtenerNombreTecnico}
            />
          </PDFViewer>
        </div>
      </div>
        </div>
      )}
    </div>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
              {ubicacionesFiltradas.length === 0 ? (
                <p style={{ color: 'red' }}>⚠️ No hay registros que coincidan con el filtro seleccionado.</p>
              ) : (
                ubicacionesFiltradas.map(ubic => {
                  const sel = seleccionMultiple.some(u => u.id === ubic.id);
                  const disable = filtroTecnico === 'ninguno' && !sel && seleccionMultiple.length > 0;
                  return (
                    <li key={ubic.id} style={{ marginBottom: 8, fontSize: '1rem' }}>
                      <div className='contenedor-check-mapa-2'>
                      <label className='check-mapa' style={{ cursor: disable ? 'not-allowed' : 'pointer', opacity: disable ? .5 : 1 }}>
                        <input
                          type='checkbox'
                          checked={sel}
                          disabled={disable}
                          onChange={() => toggleSeleccionMultiple(ubic.id)}
                          style={{ marginRight: 1, cursor: disable ? 'not-allowed' : 'pointer' }}
                          
                        />
                        
                      </label>
                      <br />

                      <div className='contenedor-tecnicos-mapa'>
                      <strong>👷 {obtenerNombreTecnico(ubic.codigo_trabajador)}</strong>
                      <br />
                      📅 {formatearFecha(ubic.fecha_actualizacion)}<br />
                      📍 Latitud: {ubic.latitud} | 📍 Longitud: {ubic.longitud}
                      </div>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
            
</div>
          </>
        )}
        
      </div>

      {/* ───────────── Mapa ───────────── */}
      <div style={{ width: '65%' }}
      className='contenedor-panel-mapa'
      >
        <h1 style={{ color: '#2f8bfd' }}>🛠️ Mapa de Técnicos</h1>

        {/* ───── Selector y botón de petición en vivo ───── */}
        <section className='contenedor-pedir-mapa'>
          <select
            value={tecnicoSeleccionado}
            onChange={async (e) => {
              const codigo = e.target.value;
              setTecnicoSeleccionado(codigo);
              setPermisoTecnicoActivo(false);
              if (!codigo) return;

              try {
                const res = await fetch(`${process.env.REACT_APP_API_URL_MAPATECNICO}/api/tecnico/${codigo}`, {
                  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                const data = await res.json();
                if (data.permiso_ubicacion) {
                  setPermisoTecnicoActivo(true);
                } else {
                  alert('🚫 Este técnico no ha autorizado compartir ubicación.');
                }
              } catch (err) {
                console.error('Error consultando técnico:', err);
                alert('❌ No se pudo verificar el permiso del técnico.');
              }
            }}
          >
            <option value=''>Selecciona un técnico</option>
            {tecnicos.map(t => (
              <option key={t.codigo_trabajador} value={t.codigo_trabajador}>
                {t.nombre_tecnico} {t.apellido_tecnico}
              </option>
            ))}
          </select>

          <button className='buton-mapa'
            onClick={() => {
              if (!tecnicoSeleccionado) return alert('Selecciona un técnico primero');
              if (!permisoTecnicoActivo) return alert('🚫 Este técnico no ha concedido permiso.');

              socketRef.current.emit('ubicacion:solicitar', {
                codigo_trabajador: tecnicoSeleccionado
              });

              console.log('📡 Solicitud enviada al técnico:', tecnicoSeleccionado);
            }}
            style={{
              padding: '10px 15px',
              backgroundColor: '#0069d9',
              color: 'white',
              border: 'none',
              borderRadius: 5,
              cursor: 'pointer',
              marginTop: 10
            }}
          >
            🔄 Pedir ubicación en vivo
          </button>
        </section>

        {/* ───── Mapa modo individual ───── */}
        {!modoMultiple && mostrarTecnicoUnico && (
              <MapContainer
                center={posicionMapa}
                zoom={12}
                // 'whenCreated' ya no es necesario para el flyTo, pero puede ser útil para otras cosas
                ref={mapaRef}
                style={{
                  height: 400, width: '100%', borderRadius: 10,
                  boxShadow: '0px 4px 10px rgba(0,0,0,0.1)'
                }}
              >
                <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

                {ubicaciones && ubicaciones.some(u => u.codigo_trabajador === seleccionUnicaCodigo) && (
                  <Marker
                    position={posicionMapa}
                    ref={marcadorUnicoRef} // La ref del marcador sigue siendo útil
                  >
                    <Popup autoPan={false}>
                      <strong>👷 Técnico:</strong> {obtenerNombreTecnico(seleccionUnicaCodigo)}<br />
                      📍 Latitud: {posicionMapa[0]}<br />📍 Longitud: {posicionMapa[1]}
                    </Popup>
                  </Marker>
                )}

                {/* AQUÍ ESTÁ LA MAGIA */}
                <ControladorMapa 
                    posicion={posicionMapa} 
                    codigo={seleccionUnicaCodigo} 
                    marcadorRef={marcadorUnicoRef} 
                />
              </MapContainer>
            )}

        {/* ───── Mapa modo múltiple ───── */}
        {modoMultiple && seleccionMultiple.length > 0 && (
          <MapContainer
            center={[seleccionMultiple[0].latitud, seleccionMultiple[0].longitud]}
            zoom={12}
            whenCreated={map => (mapaRef.current = map)}
            style={{
              height: 400, width: '100%', borderRadius: 10,
              boxShadow: '0px 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            <TileLayer url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' />

            {seleccionMultiple.map(u => (
              <Marker
                key={u.id}
                position={[u.latitud, u.longitud]}
                eventHandlers={{
                  mouseover: e => {
                    if (mapaRef.current) mapaRef.current.flyTo([u.latitud, u.longitud], 18, { duration: .5 });
                    e.target.openPopup();
                  },
                  mouseout: e => e.target.closePopup(),
                }}
              >
                <Popup autoPan={false}>
                  <strong>👷 Técnico:</strong> {obtenerNombreTecnico(u.codigo_trabajador)}<br />
                  📅 {formatearFecha(u.fecha_actualizacion)}<br />
                  📍 Latitud: {u.latitud}<br />📍 Longitud: {u.longitud}
                </Popup>
              </Marker>
            ))}

            <FitBounds bounds={seleccionMultiple.map(u => [u.latitud, u.longitud])} />
          </MapContainer>
        )}
      </div>
    </div>

  );
};

export default Mapa;
