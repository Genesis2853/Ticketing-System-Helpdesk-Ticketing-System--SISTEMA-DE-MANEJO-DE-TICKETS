import dotenv from 'dotenv';
dotenv.config();

export default {
  
  dbHost: process.env.DB_HOST,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,

  //PARTE ADMINISTRADOR
  portCreateTickets: process.env.PORT_CREATE_TICKETS,
  portAssignTickets: process.env.PORT_ASSIGN_TICKETS,
  portEstadoSoli: process.env.PORT_ESTADO_SOLI,
  portCrearCliente: process.env.PORT_CREAR_CLIENTE,
  portCrearTecnico: process.env.PORT_CREAR_TECNICO,

  portVerCliente: process.env.PORT_VERDATOS_CLIENTE,
  portVerTickets: process.env.PORT_VERDATOS_TICKETS,
  portVerTecnico: process.env.PORT_VERDATOS_TECNICO,

  portDetalleSoli: process.env.PORT_DETALLE_SOLI,

  portMapaTecnico: process.env.PORT_MAPA_TECNICO,
  portRetroCliente: process.env.PORT_RETRO_CLIENTE,
  portSistemaResolucion: process.env.PORT_SISTEMA_RESOLUSION,


  //PARTE USUARIO
  
  portUsuGestion: process.env.PORT_USUARIO_GESTION,


//PARTE TECNICO
portSoliAsigTec: process.env.PORT_SOLI_ASIG,
portSoliCompletada: process.env.PORT_SOLI_COMPLETADA,
portSoliNoRealizada: process.env.PORT_SOLI_NOREALIZADA,
portReporteServicio: process.env.PORT_REPORTE_SERV,


//PARTE PYTHON
portDatosEstadisticos: process.env.PORT_DATOS_ESTADISTICOS,


//PARTE GENERAL
  port: process.env.PORT,
  apiUrl: process.env.REACT_APP_API_URL
};