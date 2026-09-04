import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/estadistico'; // Cambia esto si tu API está en otro puerto o dirección

const apiEstadistico = {
  // CLIENTES
  totalClientes: async () => {
    const response = await axios.get(`${API_BASE_URL}/clientes/total`);
    console.log('Total Clientes:', response.data);
    return response.data;
  },

  totalFeedbacks: async () => {
    const response = await axios.get(`${API_BASE_URL}/feedback/total`);
    console.log('Total feedbacks:', response.data);
    return response.data;
  },
  totalEvaluaciones: async () => {
    const response = await axios.get(`${API_BASE_URL}/evaluaciones/total`, {
      params: { start, end }
    });
    console.log('Total Evaluaciones:', response.data);
    return response.data;
  },

  totalClientesFiltrar: async (start, end) => {
    const response = await axios.get(`${API_BASE_URL}/clientes/total/filtrar`, {
      params: { start, end }
    });
    console.log('Total Clientes Filtrados:', response.data);
    return response.data;
  },

  clasificacionClientes: async () => {
    const response = await axios.get(`${API_BASE_URL}/clientes/clasificacion`);
    console.log('Clasificación de Clientes:', response.data);
    return response.data;
  },

  // SOLICITUDES
  solicitudesPorTecnico: async () => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/por_tecnico`);
    console.log('Solicitudes por Técnico:', response.data);
    return response.data;
  },

  solicitudesEstado: async (estado_solicitud) => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/estado`, {
      params: { estado_solicitud }
    });
    console.log('Solicitudes por Estado:', response.data);
    return response.data;
  },

  solicitudesAbiertas: async () => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/abiertas`);
    console.log('Solicitudes Abiertas:', response.data);
    return response.data;
  },

  totalSolicitudesPorPeriodo: async (start, end) => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/total_por_periodo`, {
      params: { start, end }
    });
    console.log('Total Solicitudes por Período:', response.data);
    return response.data;
  },

  // TICKETS
  totalTickets: async () => {
    const response = await axios.get(`${API_BASE_URL}/tickets/total`);
    console.log('Total Tickets:', response.data);
    return response.data;
  },

  cantidadTicketsPorMotivo: async (motivo) => {
    const response = await axios.get(`${API_BASE_URL}/tickets/motivos`, {
      params: { motivo }
    });
    console.log('Cantidad de Tickets por Motivo:', response.data);
    return response.data;
  },

  ticketsPorPrioridad: async () => {
    const response = await axios.get(`${API_BASE_URL}/tickets/por_prioridad`);
    console.log('Tickets por Prioridad:', response.data);
    return response.data;
  },

  ticketsSinAsignar: async () => {
    const response = await axios.get(`${API_BASE_URL}/tickets/sin_asignar`);
    console.log('Tickets Sin Asignar:', response.data);
    return response.data;
  },

    ticketsPorMotivo: async () => {
    const response = await axios.get(`${API_BASE_URL}/tickets/motivos`);
    console.log('Tickets Por Motivo:', response.data);
    return response.data;
  },

  // SOLICITUDES CERRADAS/COMPLETADAS
  solicitudesCerradasCompletadas: async () => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/cerradas/completadas`);
    console.log('Solicitudes Cerradas Completadas:', response.data);
    return response.data;
  },

  totalSolucionesFallos: async (solucion_falla) => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/completadas/fallas`, {
      params: { solucion_falla }
    });
    console.log('Total Soluciones Fallos:', response.data);
    return response.data;
  },

  // SOLICITUDES NO REALIZADAS
  solicitudesNoRealizadas: async () => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas`);
    console.log('Solicitudes No Realizadas:', response.data);
    return response.data;
  },

  solicitudesNoRealizadasMotivo: async (motivo) => {
    const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas/por_motivo`, {
      params: { motivo }
    });
    console.log('Solicitudes No Realizadas por Motivo:', response.data);
    return response.data;
  },


  solicitudesCompletadasPorTecnico: async (tecnico = null) => {
    const params = tecnico ? { tecnico } : {};
    const response = await axios.get(`${API_BASE_URL}/solicitudes/completadas_por_tecnico`, {
      params
    });
    console.log('Solicitudes Completadas por Técnico:', response.data);
    return response.data;
  },

  solicitudesNoRealizadasPorTecnico: async (tecnico = null) => {
    const params = tecnico ? { tecnico } : {};
    const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas_por_tecnico`, {
      params
    });
    console.log('Solicitudes No Realizadas por Técnico:', response.data);
    return response.data;
  },

  // REPORTES
  registrarDescarga: async (tipo) => {
    const response = await axios.post(`${API_BASE_URL}/reportes/descargar`, null, {
      params: { tipo }
    });
    console.log('Registro de Descarga:', response.data);
    return response.data;
  },

  totalReportesDescargados: async (tipo, start, end) => {
    const response = await axios.get(`${API_BASE_URL}/reportes/descargados`, {
      params: { tipo, start, end }
    });
    console.log('Total Reportes Descargados:', response.data);
    return response.data;
  },

  // Agrega este método en tu objeto apiEstadistico
exportarTodoExcel: async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/exportar_todo_excel`, {
            responseType: 'blob' // Importante para manejar archivos binarios
        });
        console.log('Excel exportado:', response.data);
        return response.data; // Esto contendrá el archivo Excel
    } catch (error) {
        console.error('Error al exportar Excel:', error);
        throw error; // Lanza el error para manejarlo en el frontend si es necesario
    }
},

};

export default apiEstadistico;
