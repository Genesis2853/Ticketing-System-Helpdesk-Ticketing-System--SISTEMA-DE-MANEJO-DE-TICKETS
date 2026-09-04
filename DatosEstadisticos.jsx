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
    const [solicitudesCerradasTotal, setSolicitudesCerradasTotal] = useState(null);
    const [solicitudesCerradasPeriodo, setSolicitudesCerradasPeriodo] = useState(null);
    const [completadasPorTecnico, setCompletadasPorTecnico] = useState([]);
    const [noRealizadasPorTecnico, setNoRealizadasPorTecnico] = useState([]);
    const [totalFeedback, setTotalFeedback] = useState(null);
    const [evaluacionesTotal, setEvaluacionesTotal] = useState(null);
    const [evaluacionesPeriodo, setEvaluacionesPeriodo] = useState(null);
    const [ticketsmotivosData, setticketsMotivosData] = useState([]);

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

    const fetchTotalesPorMotivo = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/estadistico/tickets/motivos');
      setticketsMotivosData(response.data);
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

const fetchSolicitudesNoRealizadas = async () => {
        try {
          const  response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/no_realizadas');
                setSolicitudesNoRealizadasTotal(response.data.total_solicitudes_norealizadas);
           
        } catch (error) {
            console.error('Error fetching no realizadas:', error);
        }
    };

    const fetchSolicitudesNoRealizadasPorPeriodo = async () => {
        try {
           const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/no_realizadas', 
              {
                params: { 
                start: filters.startDate, 
                end: filters.endDate 
            }
              });
                setSolicitudesNoRealizadasPeriodo(response.data.total_solicitudes_norealizadas);
            
        } catch (error) {
            console.error('Error fetching no realizadas:', error);
        }
    };

  const fetchSolicitudesCerradas = async () => {
        try {
          const  response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/cerradas');
                setSolicitudesCerradasTotal(response.data.total_solicitudes_cerradas);
           
        } catch (error) {
            console.error('Error fetching no realizadas:', error);
        }
    };

    const fetchSolicitudesCerradasPorPeriodo = async () => {
        try {
           const response = await axios.get('http://127.0.0.1:8000/api/estadistico/solicitudes/cerradas', 
              {
                params: { 
                start: filters.startDate, 
                end: filters.endDate 
            }
              });
                setSolicitudesCerradasPeriodo(response.data.total_solicitudes_cerradas);
            
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
          fetchTotalesPorMotivo(),
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
          fetchSolicitudesNoRealizadas(), // Total
          fetchSolicitudesCerradas(),
          fetchSolicitudesNoRealizadasPorPeriodo(), // Período
          fetchSolicitudesCerradasPorPeriodo(),
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
    fetchSolicitudesNoRealizadasPorPeriodo();
    fetchSolicitudesCerradasPorPeriodo();
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
    // --- DATOS QUE NO DEPENDEN DE LA FECHA ---
    const totales = [
        { Categoria: 'Clientes Totales', Valor: totalClientes },
        { Categoria: 'Solicitudes Abiertas', Valor: solicitudesAbiertas },
        { Categoria: 'Total Solicitudes Completadas', Valor: solicitudesCompletadasTotal },
        { Categoria: 'Total Solicitudes No Realizadas', Valor: solicitudesNoRealizadasTotal },
        { Categoria: 'Total Solicitudes Cerradas', Valor: solicitudesCerradasTotal },
        { Categoria: 'Tickets Totales', Valor: totalTickets },
        { Categoria: 'Tickets Sin Asignar', Valor: ticketsSinAsignar },
        { Categoria: 'Feedback Recibido Total', Valor: totalFeedback },
        { Categoria: 'Evaluaciones Totales', Valor: evaluacionesTotal },
    ];

    // --- DATOS FILTRADOS POR PERÍODO ---
    const porPeriodo = [
        { Categoria: 'Clientes Nuevos en Período', Valor: clientesFiltrados },
        { Categoria: 'Solicitudes en Período', Valor: solicitudesPeriodo },
        { Categoria: 'Cerradas en Período', Valor: solicitudesCerradasPeriodo },
        { Categoria: 'Completadas en Período', Valor: solicitudesCompletadasPeriodo },
        { Categoria: 'No Realizadas en Período', Valor: solicitudesNoRealizadasPeriodo },
        { Categoria: 'Evaluaciones en Período', Valor: evaluacionesPeriodo },
    ];

    // --- DATOS PARA LOS GRÁFICOS ---
    const graficos = {
        // Renombramos las claves para que sean nombres de hoja válidos
        ClientesPorServicio: clasificacionClientes.map(item => ({ 'Tipo de Servicio': item.tipo_servicio, 'Total': item.total })),
        AbiertasPorTecnico: solicitudesPorTecnico.map(item => ({
            'Técnico': item.tecnico,
            'Solicitudes Abiertas': item.total_solicitudes
        })),
        TicketsPorPrioridad: ticketsPorPrioridad.map(item => ({ 'Prioridad': item.prioridad_solicitud, 'Total': item.total_tickets })),
        CompletadasPorTecnico: completadasPorTecnico.map(item => ({ 'Técnico': item.tecnico, 'Solicitudes Completadas': item.total })),
        NoRealizadasPorTecnico: noRealizadasPorTecnico.map(item => ({ 'Técnico': item.tecnico, 'Solicitudes No Realizadas': item.total })),
        TicketsPorMotivo: ticketsmotivosData.map(item => ({
            'Motivo de Visita': item.motivo_visita,
            'Total': item.total_motivo
        })),
    };

    return { totales, porPeriodo, graficos };
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
  disabled={loading}
  className='boton-excel'
/>


      <FilterPanel 
        filters={filters} // Pasar el estado de los filtros
        onFilterChange={setFilters} // Pasar la función para actualizar los filtros
      />

      {loading && <div className="loading-indicator">Cargando datos...</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="stats-grid">
        <div>
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

        

        <section className="stats-section">
                    <h2 className="h2-estadistico">Rendimiento por Técnico</h2>
                    <div className="chart-container-full">
                        <BarChart
                            title="Solicitudes Completadas por Técnico"
                            data={completadasPorTecnico?.map(item => ({ name: item.tecnico, value: item.total }))}
                            onClick={() => openDetailModal(
                'Solicitudes Completadas por Técnico',
                completadasPorTecnico,
                ['tecnico', 'total']
              )}
                        />
                    </div>
                    <div className="chart-container-full">
                        <BarChart
                            title="Solicitudes No Realizadas por Técnico"
                            data={noRealizadasPorTecnico?.map(item => ({ name: item.tecnico, value: item.total }))}
                            barColor="#ffc107" // Color ámbar para advertencia
                            onClick={() => openDetailModal(
                'Solicitudes No Realizadas por Técnico',
                noRealizadasPorTecnico,
                ['tecnico', 'total']
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

                    <div className="chart-container">

            <PieChart
              title="Tickets Por Motivo"
                data={ticketsmotivosData?.map(item => ({
                name: item.motivo_visita,
                value: item.total_motivo
              }))}
              onClick={() => openDetailModal('Tickets Por Motivo', ticketsmotivosData, ['motivo_visita', 'total_motivo'])}
            />
          </div>
        </section>

        
</div>



          <div>
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

        <StatCard title="Total No Realizadas" value={solicitudesNoRealizadasTotal} color="warning"/>
        <StatCard title={`No Realizadas en Período`} subtitle={`${filters.startDate} a ${filters.endDate}`} value={solicitudesNoRealizadasPeriodo} color="warning" />

        <StatCard title="Total Cerradas" value={solicitudesCerradasTotal} color="warning"/>
        <StatCard title={`Cerradas en Período`} subtitle={`${filters.startDate} a ${filters.endDate}`} value={solicitudesCerradasPeriodo} color="warning" />

          </div>

          <div className="chart-container">
            <BarChart
              title="Solicitudes Abiertas por Técnico"
              data={solicitudesPorTecnico?.map(item => ({
                name: item.tecnico,
                value: item.total_solicitudes
              }))}
              onClick={() => openDetailModal(
                'Solicitudes por Técnico',
                solicitudesPorTecnico,
                ['tecnico', 'total_solicitudes']
              )}
            />
          </div>
        </section>

        {/* --- NUEVA SECCIÓN: CALIDAD Y FEEDBACK --- */}
                <section className="stats-section">
                    <h2 className="h2-estadistico">Calidad y Feedback</h2>
                     <div className="stats-row">
                        <StatCard title="Total Feedback Recibido" value={totalFeedback} />
                        <StatCard title="Total Evaluaciones" value={evaluacionesTotal} />
                        <StatCard title={`Evaluaciones en Período`} subtitle={`${filters.startDate} a ${filters.endDate}`} value={evaluacionesPeriodo} />
                    </div>
                </section>

        </div>
      </div>



      <DataTableModal 
        isOpen={modal.open}
        title={modal.title}
        data={modal.data}
        columns={modal.columns}
        onClose={() => setModal({...modal, open: false})}
      />


      

              

   


    </div>
  );
};

export default DashboardPage;
