import React, { useEffect, useState } from 'react';
import './SectionAdm.css'; // Archivo CSS específico
import axios from 'axios';



const MostrarContenidoSectionAdm = ({ tipo_usuario, user }) => {
  const [totalClientes, setTotalClientes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTickets, setTotalTickets] = useState(null);
  const [ticketsPorPrioridad, setTicketsPorPrioridad] = useState([]);
  const [ticketsSinAsignar, setTicketsSinAsignar] = useState(null);
  const [solicitudesAbiertas, setSolicitudesAbiertas] = useState(null);

 

  const fetchTotalClientes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/clientes/total');
      setTotalClientes(response.data.total_clientes);
    } catch (error) {
      console.error('Error en fetchTotalClientes:', error);
      setError('Error al cargar clientes totales');
    }
  };

  const fetchTotalTickets = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/tickets/total');
      setTotalTickets(response.data.total_tickets);
    } catch (error) {
      console.error('Error en fetchTotalTickets:', error);
    }
  };

  const fetchTicketsPorPrioridad = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/tickets/por_prioridad');
      setTicketsPorPrioridad(response.data); // Asegúrate de que esto sea un array
    } catch (error) {
      console.error('Error en fetchTicketsPorPrioridad:', error);
    }
  };

  const fetchTicketsSinAsignar = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/tickets/sin_asignar');
      setTicketsSinAsignar(response.data.total_tickets_sin_asignar);
    } catch (error) {
      console.error('Error en fetchTicketsSinAsignar:', error);
    }
  };

  const fetchSolicitudesAbiertas = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/abiertas');
        setSolicitudesAbiertas(response.data.total_solicitudes_abiertas);
      } catch (error) {
        console.error('Error en fetchSolicitudesAbiertas:', error);
      }
    };

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTotalClientes(),
          fetchTotalTickets(),
          fetchTicketsPorPrioridad(),
          fetchTicketsSinAsignar(),
          fetchSolicitudesAbiertas(),
        ]);
      } catch (error) {
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Agrupar tickets por prioridad
  const groupedTickets = ticketsPorPrioridad.reduce((acc, ticket) => {
    const { prioridad_solicitud, total_tickets } = ticket;
    if (!acc[prioridad_solicitud]) {
      acc[prioridad_solicitud] = 0;
    }
    acc[prioridad_solicitud] += total_tickets;
    return acc;
  }, {});

  return (
    <section className="section-adm">
      <div className='contenedor-nombreusuario'>
              <p className='nombreusuario-text'>
            {user.tipo_usuario === 'Admin' && `Dashboard del Administrador, usuario: ${user.usuario}`}
            {user.tipo_usuario === 'Moderador' && `Dashboard del Moderador, usuario: ${user.usuario}`}
          </p>
            </div>
      <div className="dashboard-cards">
        
        {/* Tarjeta 1: Estadísticas rápidas */}
        <div className="card">
          <h3>Solicitudes por Prioridad</h3>
          <p className="card-value">
            {loading ? (
              <span>Cargando...</span>
            ) : error ? (
              <span className="error">{error}</span>
            ) : (
              Object.entries(groupedTickets).map(([prioridad, total], index) => (
                <span key={index}>{prioridad}: {total} <br /></span>
                
              ))
            )}
          </p>
        </div>
        
        {/* Tarjeta 2 */}
        <div className="card">
          <h3>Total Solicitudes Generadas</h3>
          <p className="card-value">{totalTickets}</p>
        </div>

        {/* Tarjeta 3 */}
        <div className="card">
          <h3>Solicitudes Sin Asignar</h3>
          <p className="card-value">{ticketsSinAsignar}</p>
        </div>

        <div className="card">
          <h3>Solicitudes Activas</h3>
          <p className="card-value">{solicitudesAbiertas}</p>
        </div>
        
        {/* Tarjeta 4 (solo para admin) */}
        {tipo_usuario === 'Admin' && (
          <div className="card">
            <h3>Total Clientes</h3>
            {loading && <p>Cargando total de clientes...</p>}
            {error && <p className="error">{error}</p>}
            {!loading && !error && (
              <p className="card-value">{totalClientes}</p> // Mostrar total de clientes
            )}
            
          </div>
        )}

      </div>

      {/* Gráficos o tablas adicionales */}
      <div className="section-content">
        {/* Contenido dinámico según el usuario */}
        {tipo_usuario === 'Tecnico' ? (
          <TecnicoDashboard />
        ) : (
          <></>
        )}
      </div>
    </section>
  );
};

// Subcomponentes (pueden estar en archivos separados)
const TecnicoDashboard = () => (
  <div className="tecnico-content">
    <h2>Mis tareas asignadas</h2>
    {/* Listado de tareas */}
  </div>
);



export default MostrarContenidoSectionAdm;
