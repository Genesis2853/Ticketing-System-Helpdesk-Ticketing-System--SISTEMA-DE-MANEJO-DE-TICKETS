import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL_DATOSESTADISTICOS;

// Función para obtener el token almacenado en el navegador
  const obtenerToken = () => {
       if (typeof window !== "undefined" && window.localStorage) {
           return localStorage.getItem("token");
       } else {
           console.error("⚠️ Error: localStorage no está disponible.");
           return null;
       }
   };

const token = obtenerToken(); // Aquí se obtiene correctamente el token
console.log("Token a enviar:", token);
// Configurar llamadas a la API con autenticación
const apiEstadistico = {
  totalClientes: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/clientes/total`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  totalClientesFiltrar: async (start, end) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/clientes/total/filtrar`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { start, end },
    });
    return response.data;
  },

  clasificacionClientes: async (tipo) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/clientes/clasificacion`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tipo },
    });
    return response.data;
  },

  // SOLICITUDES
  solicitudesPorTecnico: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/por_tecnico`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  solicitudesEstado: async (estado) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/estado`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { estado },
    });
    return response.data;
  },

  solicitudesAbiertas: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/abiertas`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  totalSolicitudesPorPeriodo: async (start, end) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/total_por_periodo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { start, end },
    });
    return response.data;
  },

  // TICKETS
  totalTickets: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/tickets/total`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  cantidadTicketsPorMotivo: async (motivo) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/tickets/motivos`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { motivo },
    });
    return response.data;
  },

  ticketsPorPrioridad: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/tickets/por_prioridad`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  ticketsSinAsignar: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/tickets/sin_asignar`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  // SOLICITUDES CERRADAS/COMPLETADAS
  solicitudesCerradasCompletadas: async (start, end) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/cerradas/completadas`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { start, end },
    });
    return response.data;
  },

  totalSolucionesFallos: async (solucion_falla) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/completadas/fallas`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { solucion_falla },
    });
    return response.data;
  },

  // SOLICITUDES NO REALIZADAS
  solicitudesNoRealizadas: async (periodo) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/no_realizadas`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { periodo },
    });
    return response.data;
  },

  solicitudesNoRealizadasMotivo: async (motivo) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/no_realizadas/por_motivo`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { motivo },
    });
    return response.data;
  },

  // TIEMPO TÉCNICO
  tiempoPromedioTecnico: async () => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/tecnicos/tiempo_promedio`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },

  solicitudesCompletadasPorTecnico: async (tecnico = null) => {
    const token = obtenerToken();
    const params = tecnico ? { tecnico } : {};
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/completadas_por_tecnico`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  solicitudesNoRealizadasPorTecnico: async (tecnico = null) => {
    const token = obtenerToken();
    const params = tecnico ? { tecnico } : {};
    const response = await axios.get(`${API_BASE_URL}/api/solicitudes/no_realizadas_por_tecnico`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
    });
    return response.data;
  },

  // REPORTES
  registrarDescarga: async (tipo) => {
    const token = obtenerToken();
    const response = await axios.post(`${API_BASE_URL}/api/reportes/descargar`, null, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tipo },
    });
    return response.data;
  },

  totalReportesDescargados: async (tipo, start, end) => {
    const token = obtenerToken();
    const response = await axios.get(`${API_BASE_URL}/api/reportes/descargados`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { tipo, start, end },
    });
    return response.data;
  },
};

export default apiEstadistico;
