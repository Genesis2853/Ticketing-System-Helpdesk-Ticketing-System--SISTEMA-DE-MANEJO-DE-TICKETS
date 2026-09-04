import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StatCard from './componentesdatos estadisiticos/StatCard';
import FilterPanel from './componentesdatos estadisiticos/FilterPanel';
import DataTableModal from './componentesdatos estadisiticos/DataTableModal';
import BarChart from './componentesdatos estadisiticos/BarChart';
import PieChart from './componentesdatos estadisiticos/PieChart';
import './DatosEsatadisticos.css';
import ExportarExcelButton from './componentesdatos estadisiticos/ExportarExcelButton';
import { subDays, format } from 'date-fns';
import PromediosPorTecnico from './SistemaResolucionSolicitudes';


const DashboardPage = () => {
  // Estados principales
  const [totalClientes, setTotalClientes] = useState(null);
  const [clientesFiltrados, setClientesFiltrados] = useState(null);
  const [clasificacionClientes, setClasificacionClientes] = useState([]);
  const [solicitudesPorTecnico, setSolicitudesPorTecnico] = useState([]);
  const [solicitudesAbiertas, setSolicitudesAbiertas] = useState(null);
  const [solicitudesPeriodo, setSolicitudesPeriodo] = useState(null);
  const [solicitudesCompletadasTotal, setSolicitudesCompletadasTotal] = useState(null);
const [solicitudesCompletadasPeriodo, setSolicitudesCompletadasPeriodo] = useState(null);
  const [totalTickets, setTotalTickets] = useState(null);
  const [ticketsPorPrioridad, setTicketsPorPrioridad] = useState([]);
  const [ticketsSinAsignar, setTicketsSinAsignar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [solicitudesNoRealizadasTotal, setSolicitudesNoRealizadasTotal] = useState(null);
    const [solicitudesNoRealizadasPeriodo, setSolicitudesNoRealizadasPeriodo] = useState(null);
    const [completadasPorTecnico, setCompletadasPorTecnico] = useState([]);
    const [noRealizadasPorTecnico, setNoRealizadasPorTecnico] = useState([]);
    const [totalFeedback, setTotalFeedback] = useState(null);
    const [evaluacionesTotal, setEvaluacionesTotal] = useState(null);
    const [evaluacionesPeriodo, setEvaluacionesPeriodo] = useState(null);

const [filters, setFilters] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'), // 30 días naturales atrás
    endDate: format(new Date(), 'yyyy-MM-dd'), // Hoy
    estado: 'asignado',
    tecnico: '',
    motivo: 'sinservicio'
  });

  const [modal, setModal] = useState({
    open: false,
    title: '',
    data: [],
    columns: []
  });

  // ------ Llamadas API ------
  const fetchTotalClientes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/clientes/total');
      setTotalClientes(response.data.total_clientes);
    } catch (error) {
      console.error('Error en fetchTotalClientes:', error);
      setError('Error al cargar clientes totales');
    }
  };

  // Función para el TOTAL HISTÓRICO (sin filtros de fecha)
const fetchSolicitudesCompletadasTotal = async () => {
    try {
        // Llamamos al endpoint SIN parámetros para obtener el total
        const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/cerradas/completadas');
        setSolicitudesCompletadasTotal(response.data.total_solicitudes_cerradas);
    } catch (error) {
        console.error('Error en fetchSolicitudesCompletadasTotal:', error);
    }
};

const fetchSolicitudesNoRealizadas = async (isTotal = false) => {
        try {
            const endpoint = 'http://127.0.0.1:8000/api/estadistico/solicitudes/no_realizadas';
            const params = isTotal ? {} : { start: filters.startDate, end: filters.endDate };
            const response = await axios.get(endpoint, { params });
            if (isTotal) {
                setSolicitudesNoRealizadasTotal(response.data.total_solicitudes_no_realizadas);
            } else {
                setSolicitudesNoRealizadasPeriodo(response.data.total_solicitudes_no_realizadas);
            }
        } catch (error) {
            console.error('Error fetching no realizadas:', error);
        }
    };

    const fetchCompletadasPorTecnico = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/completadas_por_tecnico');
            setCompletadasPorTecnico(response.data);
        } catch (error) {
            console.error('Error fetching completadas por tecnico:', error);
        }
    };

    const fetchNoRealizadasPorTecnico = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/no_realizadas_por_tecnico');
            setNoRealizadasPorTecnico(response.data);
        } catch (error) {
            console.error('Error fetching no realizadas por tecnico:', error);
        }
    };

    const fetchTotalFeedback = async () => {
        try {
            const response = await axios.get('http://127.0.0.1:8000/api/estadistico/feedback/total');
            setTotalFeedback(response.data.total_feedback);
        } catch (error) {
            console.error('Error fetching total feedback:', error);
        }
    };

    const fetchEvaluaciones = async (isTotal = false) => {
        try {
            const endpoint = 'http://127.0.0.1:8000/api/estadistico/evaluaciones/total';
            const params = isTotal ? {} : { start: filters.startDate, end: filters.endDate };
            const response = await axios.get(endpoint, { params });
            if (isTotal) {
                setEvaluacionesTotal(response.data.total_evaluaciones);
            } else {
                setEvaluacionesPeriodo(response.data.total_evaluaciones);
            }
        } catch (error) {
            console.error('Error fetching evaluaciones:', error);
        }
    };

// Función para el TOTAL POR PERÍODO (con filtros de fecha)
const fetchSolicitudesCompletadasPeriodo = async () => {
    try {
        // Llamamos al endpoint CON los parámetros de fecha de los filtros
        const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/cerradas/completadas', {
            params: { 
                start: filters.startDate, 
                end: filters.endDate 
            }
        });
        setSolicitudesCompletadasPeriodo(response.data.total_solicitudes_cerradas);
    } catch (error) {
        console.error('Error en fetchSolicitudesCompletadasPeriodo:', error);
    }
};

  const fetchClientesFiltrados = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/clientes/total/filtrar', {
        params: { start: filters.startDate, end: filters.endDate }
      });
      setClientesFiltrados(response.data.total_clientes);
    } catch (error) {
      console.error('Error en fetchClientesFiltrados:', error);
    }
  };

  const fetchClasificacionClientes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/clientes/clasificacion');
      setClasificacionClientes(response.data);
    } catch (error) {
      console.error('Error en fetchClasificacionClientes:', error);
    }
  };

  const fetchSolicitudesPorTecnico = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/por_tecnico');
      setSolicitudesPorTecnico(response.data);
    } catch (error) {
      console.error('Error en fetchSolicitudesPorTecnico:', error);
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

  const fetchSolicitudesPeriodo = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/total_por_periodo', {
        params: { start: filters.startDate, end: filters.endDate }
      });
      setSolicitudesPeriodo(response.data.total_solicitudes);
    } catch (error) {
      console.error('Error en fetchSolicitudesPeriodo:', error);
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
      setTicketsPorPrioridad(response.data);
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

  // Carga inicial de datos
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchTotalClientes(),
          fetchClientesFiltrados(),
          fetchClasificacionClientes(),
          fetchSolicitudesPorTecnico(),
          fetchSolicitudesAbiertas(),
          fetchSolicitudesPeriodo(),
          fetchTotalTickets(),
          fetchTicketsPorPrioridad(),
          fetchTicketsSinAsignar(),
          fetchSolicitudesCompletadasTotal(),   // <-- AÑADIDO (Total)
          fetchSolicitudesCompletadasPeriodo(),
          fetchSolicitudesNoRealizadas(true), // Total
          fetchSolicitudesNoRealizadas(false), // Período
          fetchCompletadasPorTecnico(),
          fetchNoRealizadasPorTecnico(),
          fetchTotalFeedback(),
          fetchEvaluaciones(true), // Total
          fetchEvaluaciones(false)  // Período
        ]);
      } catch (error) {
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Actualizar datos cuando cambian los filtros
  useEffect(() => {
    fetchClientesFiltrados();
    fetchSolicitudesPeriodo();
    fetchSolicitudesCompletadasPeriodo(); // <-- AÑADIDO
    fetchSolicitudesNoRealizadas(false);
    fetchEvaluaciones(false);
  }, [filters]);

  // Función para abrir modal
  const openDetailModal = (title, data, columns) => {
    setModal({
      open: true,
      title,
      data: Array.isArray(data) ? data : [data], // Asegurar que data sea array
      columns
    });
  };

  // Función para preparar los datos para la exportación
  const prepareDataForExport = () => {
    const data = [];
    data.push({ "Descripción": "Total Clientes", "Valor": totalClientes });
    data.push({ "Descripción": "Clientes Filtrados", "Valor": clientesFiltrados });
    clasificacionClientes.forEach(item => {
      data.push({
        "Descripción": "Clasificación Clientes",
        "Tipo de Servicio": item.tipo_servicio,
        "Total": item.total
      });
    });
    data.push({ "Descripción": "Solicitudes Abiertas", "Valor": solicitudesAbiertas });
    data.push({ "Descripción": "Solicitudes en Período", "Valor": solicitudesPeriodo });
    solicitudesPorTecnico.forEach(t => {
      data.push({
        "Descripción": "Solicitudes por Técnico",
        "Técnico": `${t.nombre_tecnico} ${t.apellido_tecnico}`,
        "Total Solicitudes": t.total_solicitudes
      });
    });
    data.push({ "Descripción": "Total Tickets", "Valor": totalTickets });
    data.push({ "Descripción": "Tickets Sin Asignar", "Valor": ticketsSinAsignar });
    ticketsPorPrioridad.forEach(item => {
      data.push({
        "Descripción": "Tickets por Prioridad",
        "Prioridad": item.prioridad_solicitud,
        "Total Tickets": item.total_tickets
      });
    });
    return data;
  };

  return (
    <div className="dashboard-container">
      <h1>Dashboard Estadístico</h1>
      
<ExportarExcelButton
  data={prepareDataForExport()}
  fileName="reporte_estadistico"
  startDate={filters.startDate}
  endDate={filters.endDate}
  style={{
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  }}
  className='boton-excel'
/>


      <FilterPanel 
        filters={filters} // Pasar el estado de los filtros
        onFilterChange={setFilters} // Pasar la función para actualizar los filtros
      />

      {loading && <div className="loading-indicator">Cargando datos...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        {/* Sección Clientes */}
        <section className="stats-section">
          <h2 className="h2-estadistico">Clientes</h2>
          <div className="stats-row">
            <StatCard 
              title="Total Clientes" 
              value={totalClientes}
              onClick={() => openDetailModal('Total Clientes', { Total: totalClientes }, ['Total'])}
            />
            <StatCard 
              title="Clientes en Período" 
              value={clientesFiltrados}
              onClick={() => openDetailModal(
                `Clientes (${filters.startDate} a ${filters.endDate})`, 
                { Total: clientesFiltrados }, 
                ['Total']
              )}
            />
          </div>

          <div className="chart-container">
            <PieChart 
              title="Clasificación por Tipo de Servicio"
              data={clasificacionClientes?.map(item => ({
                name: item.tipo_servicio,
                value: item.total
              }))}
              onClick={() => openDetailModal(
                'Clasificación de Clientes',
                clasificacionClientes,
                ['tipo_servicio', 'total']
              )}
            />
          </div>
        </section>

        {/* Sección Solicitudes */}
        <section className="stats-section">
          <h2 className="h2-estadistico">Solicitudes</h2>
          <div className="stats-row">
            <StatCard 
              title="Solicitudes Abiertas" 
              value={solicitudesAbiertas}
              onClick={() => openDetailModal('Solicitudes Abiertas', { Total: solicitudesAbiertas }, ['Total'])}
            />
            <StatCard 
              title="Solicitudes en Período" 
              value={solicitudesPeriodo}
              onClick={() => openDetailModal(
                `Solicitudes (${filters.startDate} a ${filters.endDate})`, 
                { Total: solicitudesPeriodo }, 
                ['Total']
              )}
            />
            <StatCard 
            title="Total Completadas" 
            value={solicitudesCompletadasTotal}
            color="success"
            onClick={() => openDetailModal(
                'Total Histórico de Solicitudes Completadas', 
                { Total: solicitudesCompletadasTotal }, 
                ['Total']
            )}
        />
        
        <StatCard 
            title={`Completadas en Período`}
            subtitle={`${filters.startDate} a ${filters.endDate}`}
            value={solicitudesCompletadasPeriodo}
            color="success"
            onClick={() => openDetailModal(
                `Solicitudes Completadas (${filters.startDate} a ${filters.endDate})`, 
                { Total: solicitudesCompletadasPeriodo }, 
                ['Total']
            )}
        />
          </div>

          <div className="chart-container">
            <BarChart
              title="Solicitudes por Técnico"
              data={solicitudesPorTecnico?.map(item => ({
                name: item.codigo_trabajador,
                value: item.total_solicitudes
              }))}
              onClick={() => openDetailModal(
                'Solicitudes por Técnico',
                solicitudesPorTecnico,
                ['codigo_trabajador', 'total_solicitudes']
              )}
            />
          </div>
        </section>

        {/* Sección Tickets */}
        <section className="stats-section">
          <h2 className="h2-estadistico">Tickets</h2>
          <div className="stats-row">
            <StatCard 
              title="Total Tickets" 
              value={totalTickets}
              onClick={() => openDetailModal('Total Tickets', { Total: totalTickets }, ['Total'])}
            />
            <StatCard 
              title="Tickets Sin Asignar" 
              value={ticketsSinAsignar}
              color="warning"
              onClick={() => openDetailModal('Tickets Sin Asignar', { Total: ticketsSinAsignar }, ['Total'])}
            />
          </div>

          <div className="chart-container">
            <PieChart
              title="Tickets por Prioridad"
              data={ticketsPorPrioridad?.map(item => ({
                name: item.prioridad_solicitud,
                value: item.total_tickets
              }))}
              onClick={() => openDetailModal(
                'Tickets por Prioridad',
                ticketsPorPrioridad,
                ['prioridad_solicitud', 'total_tickets']
              )}
            />
          </div>
        </section>
      </div>



      <DataTableModal 
        isOpen={modal.open}
        title={modal.title}
        data={modal.data}
        columns={modal.columns}
        onClose={() => setModal({...modal, open: false})}
      />


      <PromediosPorTecnico />
    </div>
  );
};

export default DashboardPage;
