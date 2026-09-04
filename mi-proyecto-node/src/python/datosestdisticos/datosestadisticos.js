import express, { json } from 'express';
import axios from 'axios';
import cors from 'cors';
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from '../../Modulo_Usuario/modulo_usuario.js';

const app = express();
const PORT = 8000; // Cambia el puerto si es necesario
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // URL de tu API FastAPI

app.use(cors({
       origin: ['https://08d8-149-34-244-143.ngrok-free.app', 'http://localhost:3031', 'capacitor://localhost'], // Reemplaza con tu URL de ngrok
       methods: ['GET', 'POST', 'OPTIONS'], // Métodos permitidos
       allowedHeaders: ['Content-Type', 'Authorization'] // Encabezados permitidos
   }));
app.use(json());

// Rutas para consumir las APIs de FastAPI

// CLIENTES
app.get('/api/estadistico/clientes/total', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/clientes/total`);
        console.log('Total Clientes:', response.data); // Imprimir en consola
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de clientes:', error); // Imprimir error en consola
        res.status(500).json({ error: 'Error al obtener total de clientes' });
    }
});

app.get('/api/estadistico/feedback/total', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/feedback/total`);
        console.log('Total Feedbacks:', response.data); // Imprimir en consola
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de clientes:', error); // Imprimir error en consola
        res.status(500).json({ error: 'Error al obtener total de clientes' });
    }
});

app.get('/api/estadistico/clientes/total/filtrar', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { start, end } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/clientes/total/filtrar`, { params: { start, end } });
        console.log('Total Clientes Filtrados:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al filtrar total de clientes:', error);
        res.status(500).json({ error: 'Error al filtrar total de clientes' });
    }
});

app.get('/api/estadistico/evaluaciones/total', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { start, end } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/evaluaciones/total`, { params: { start, end } });
        console.log('Total Clientes Filtrados:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al filtrar total de clientes:', error);
        res.status(500).json({ error: 'Error al filtrar total de clientes' });
    }
});

app.get('/api/estadistico/clientes/clasificacion', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/clientes/clasificacion`);
        console.log('Clasificación de Clientes:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener clasificación de clientes:', error);
        res.status(500).json({ error: 'Error al obtener clasificación de clientes' });
    }
});

// SOLICITUDES
app.get('/api/estadistico/solicitudes/por_tecnico', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/por_tecnico`);
        console.log('Solicitudes por Técnico:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes por técnico:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes por técnico' });
    }
});

app.get('/api/estadistico/solicitudes/estado', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { estado_solicitud } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/estado`, { params: { estado_solicitud } });
        console.log('Solicitudes por Estado:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes por estado:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes por estado' });
    }
});

app.get('/api/estadistico/solicitudes/abiertas', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/abiertas`);
        console.log('Solicitudes Abiertas:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes abiertas:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes abiertas' });
    }
});

app.get('/api/estadistico/solicitudes/total_por_periodo', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { start, end } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/total_por_periodo`, { params: { start, end } });
        console.log('Total Solicitudes por Período:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de solicitudes por período:', error);
        res.status(500).json({ error: 'Error al obtener total de solicitudes por período' });
    }
});

// TICKETS
app.get('/api/estadistico/tickets/total', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tickets/total`);
        console.log('Total Tickets:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de tickets:', error);
        res.status(500).json({ error: 'Error al obtener total de tickets' });
    }
});

app.get('/api/estadistico/tickets/motivos', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { motivo } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/tickets/motivos`, { params: { motivo } });
        console.log('Cantidad de Tickets por Motivo:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener cantidad de tickets por motivo:', error);
        res.status(500).json({ error: 'Error al obtener cantidad de tickets por motivo' });
    }
});

app.get('/api/estadistico/tickets/por_prioridad', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tickets/por_prioridad`);
        console.log('Tickets por Prioridad:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener tickets por prioridad:', error);
        res.status(500).json({ error: 'Error al obtener tickets por prioridad' });
    }
});

app.get('/api/estadistico/tickets/sin_asignar', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/tickets/sin_asignar`);
        console.log('Tickets Sin Asignar:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener tickets sin asignar:', error);
        res.status(500).json({ error: 'Error al obtener tickets sin asignar' });
    }
});

// SOLICITUDES CERRADAS/COMPLETADAS
app.get('/api/estadistico/solicitudes/cerradas/completadas', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/cerradas/completadas`);
        console.log('Solicitudes Cerradas Completadas:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes cerradas completadas:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes cerradas completadas' });
    }
});

app.get('/api/estadistico/solicitudes/completadas/fallas', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { solucion_falla } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/completadas/fallas`, { params: { solucion_falla } });
        console.log('Total Soluciones Fallos:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de soluciones fallos:', error);
        res.status(500).json({ error: 'Error al obtener total de soluciones fallos' });
    }
});

// SOLICITUDES NO REALIZADAS
app.get('/api/estadistico/solicitudes/no_realizadas', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {

    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas`);
        console.log('Solicitudes No Realizadas:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes no realizadas:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes no realizadas' });
    }
});

app.get('/api/estadistico/solicitudes/no_realizadas/por_motivo', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { motivo } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas/por_motivo`, { params: { motivo } });
        console.log('Solicitudes No Realizadas por Motivo:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes no realizadas por motivo:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes no realizadas por motivo' });
    }
});



app.get('/api/estadistico/solicitudes/completadas_por_tecnico', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { tecnico } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/completadas_por_tecnico`, { params: { tecnico } });
        console.log('Solicitudes Completadas por Técnico:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes completadas por técnico:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes completadas por técnico' });
    }
});

app.get('/api/estadistico/solicitudes/no_realizadas_por_tecnico', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { tecnico } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/no_realizadas_por_tecnico`, { params: { tecnico } });
        console.log('Solicitudes No Realizadas por Técnico:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener solicitudes no realizadas por técnico:', error);
        res.status(500).json({ error: 'Error al obtener solicitudes no realizadas por técnico' });
    }
});

// REPORTES
app.post('/api/estadistico/reportes/descargar', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { tipo } = req.body;
    try {
        const response = await axios.post(`${API_BASE_URL}/reportes/descargar`, null, { params: { tipo } });
        console.log('Registro de Descarga:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al registrar descarga de reporte:', error);
        res.status(500).json({ error: 'Error al registrar descarga de reporte' });
    }
});

app.get('/api/estadistico/reportes/descargados', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { tipo, start, end } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/reportes/descargados`, { params: { tipo, start, end } });
        console.log('Total Reportes Descargados:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de reportes descargados:', error);
        res.status(500).json({ error: 'Error al obtener total de reportes descargados' });
    }
});

// Nueva API para obtener total de soluciones de fallos
app.get('/api/estadistico/solicitudes/completadas/fallas', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    const { solucion_falla } = req.query;
    try {
        const response = await axios.get(`${API_BASE_URL}/solicitudes/completadas/fallas`, { params: { solucion_falla } });
        console.log('Total Soluciones Fallos:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error al obtener total de soluciones fallos:', error);
        res.status(500).json({ error: 'Error al obtener total de soluciones fallos' });
    }
});

// Endpoint para obtener técnicos
app.get('/api/estadistico/tecnicos', async (req, res) => {
  try {
    const query = `
      SELECT 
        codigo_trabajador,
        nombre_tecnico as nombres,
        apellido_tecnico as apellidos
      FROM tecnicos
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener técnicos:', error);
    res.status(500).json({ error: 'Error al obtener técnicos' });
  }
});

app.get('/api/estadistico/exportar_todo_excel', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('datos_estadisticos'), async (req, res) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/exportar_todo_excel`, {
            responseType: 'arraybuffer' // Importante para manejar archivos binarios
        });
        
        // Configurar la respuesta para descargar el archivo
        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename=reporte_completo.xlsx',
            'Content-Length': response.data.length
        });
        
        res.send(response.data); // Enviar el archivo Excel al cliente
    } catch (error) {
        console.error('Error al exportar todo a Excel:', error);
        res.status(500).json({ error: 'Error al exportar todo a Excel' });
    }
});






// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
