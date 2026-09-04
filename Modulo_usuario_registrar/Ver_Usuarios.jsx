import React, { useEffect, useState, useRef } from 'react';

function UsuariosAdmin() {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [permisosVisiblePara, setPermisosVisiblePara] = useState(null); // id del usuario que tiene desplegado permisos
  const permisosDisponibles = [
  // Clientes
  { id: 'ver_clientes', label: 'Ver Clientes' },
  { id: 'crear_clientes', label: 'Crear Clientes' },

  // Tickets
  { id: 'ver_tickets', label: 'Ver Tickets' },
  { id: 'crear_tickets', label: 'Crear Tickets' },

  // Técnicos
  { id: 'ver_tecnicos', label: 'Ver Técnicos' },
  { id: 'crear_tecnicos', label: 'Crear Técnicos' },
  { id: 'ver_mapa', label: 'Ver Mapa de Técnicos' },
  { id: 'reporte_servicio', label: 'Reporte de Servicio Técnico' },

  // Solicitudes
  { id: 'asignar_solicitudes', label: 'Asignar Solicitudes' },
  { id: 'ver_estado_solicitudes', label: 'Ver Estado de Solicitudes' },
  { id: 'ver_soli_completa', label: 'Ver Solicitudes Completadas' },
  { id: 'ver_soli_cerrada', label: 'Ver Solicitudes Cerradas' },
  { id: 'ver_solino', label: 'Ver Solicitudes No Realizadas' },

  // Reportes / Datos
  { id: 'ver_reportesdesempeño', label: 'Ver Reportes de Desempeño' },
  { id: 'datos_estadisticos', label: 'Datos Estadísticos' },
    { id: 'crear_evaluacion', label: 'Evaluar Reportes' },
  { id: 'comentario_evaluacion', label: 'Ver Reportes Desem Cerrado y NoReali' },
  { id: 'crear_evaluacion_cerrada', label: 'Evaluar Reportes Desem Cerrado y NoReali' },
];


  // Cerrar desplegable al hacer clic fuera
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setPermisosVisiblePara(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    async function fetchUsuarios() {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No autorizado: token no encontrado');
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_USUGESTION}/api/autentica/usuariosobtener`, {
          headers: {
            Authorization: 'Bearer ' + token,
          },
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Error al obtener usuarios');
        }
        const data = await res.json();
        setUsuarios(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUsuarios();
  }, []);

  if (loading) return <p>Cargando usuarios...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', position: 'relative' }}>
      <h2>Usuarios Registrados</h2>
      {usuarios.length === 0 ? (
        <p>No hay usuarios registrados.</p>
      ) : (
        <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
          {usuarios.map((usuario) => {
            const permisos = typeof usuario.permisos_usuarios === 'string' ? JSON.parse(usuario.permisos_usuarios) : usuario.permisos_usuarios || [];
            return (
              <li
                key={usuario.id_modulo_usuario}
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid #ccc',
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <strong>{usuario.usuario}</strong> <br />
                  Tipo: {usuario.tipo_usuario} <br />
                  Creado: {new Date(usuario.fecha_creacion_usuario).toLocaleDateString()}
                </div>

                {usuario.tipo_usuario.toLowerCase() === 'moderador' && (
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() =>
                        setPermisosVisiblePara(permisosVisiblePara === usuario.id_modulo_usuario ? null : usuario.id_modulo_usuario)
                      }
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        borderRadius: 4,
                        border: '1px solid #007bff',
                        backgroundColor: '#e7f1ff',
                        color: '#007bff',
                      }}
                    >
                      Ver permisos
                    </button>

                    {permisosVisiblePara === usuario.id_modulo_usuario && (
                      <div
                        ref={dropdownRef}
                        style={{
                          position: 'absolute',
                          top: '110%',
                          right: 0,
                          backgroundColor: 'white',
                          border: '1px solid #ccc',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          borderRadius: 4,
                          padding: 10,
                          width: 200,
                          zIndex: 1000,
                          fontSize: '0.85rem',
                        }}
                      >
                        <strong>Permisos</strong>
                        <ul style={{ paddingLeft: 20, marginTop: 5 }}>
                          {permisos.length > 0 ? (
                            permisos.map((permiso) => {
                              const permLabel = permisosDisponibles.find((p) => p.id === permiso)?.label || permiso;
                              return <li key={permiso}>{permLabel}</li>;
                            })
                          ) : (
                            <li>No tiene permisos asignados</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default UsuariosAdmin;
