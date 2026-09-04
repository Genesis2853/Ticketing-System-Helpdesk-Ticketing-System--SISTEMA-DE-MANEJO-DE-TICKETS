import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";

dotenv.config();

const app = express();
const port = config.portAssignTickets || 3062; // Cambiamos el puerto a 3062

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(cors());

// Ruta para obtener la lista de tickets
app.get('/api/tickets', async (req, res) => {
    try {
        const result = await pool.query("SELECT codigo_ticket, prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita FROM tb_crear_ticket WHERE estado_ticket = 'sin_asignar';");
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tickets:', error);
        res.status(500).send('Error obteniendo tickets');
    }
});

// Ruta para obtener la lista de técnicos
app.get('/api/tecnicos', async (req, res) => {
    try {
        const result = await pool.query("SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico FROM tecnicos;");
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo técnicos:', error);
        res.status(500).send('Error obteniendo técnicos');
    }
});

// Ruta para manejar la asignación manual de tickets a técnicos
app.post('/api/asignar', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_clientes'), async (req, res) => {
    const { codigo_ticket, codigo_trabajador } = req.body;
    try {
        const result = await pool.query(
            "SELECT prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita FROM tb_crear_ticket WHERE codigo_ticket = $1",
            [codigo_ticket]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Ticket no encontrado' });
        }

        const { prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita } = result.rows[0];

        const insertResult = await pool.query(
            "INSERT INTO solicitudes (codigo_ticket, codigo_trabajador, prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita) VALUES ($1, $2, $3, $4, $5, $6) RETURNING codigo_solicitud",
            [codigo_ticket, codigo_trabajador, prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita]
        );

        const nuevoCodigoSoli = insertResult.rows[0].codigo_solicitud;
        res.json({ message: 'Ticket asignado correctamente', codigo_solicitud: nuevoCodigoSoli });
    } catch (error) {
        console.error('Error asignando el ticket:', error);
        res.status(500).json({ message: 'Error asignando el ticket' });
    }
});

// Ruta para asignar tickets automáticamente
app.post('/api/asignar/automatico', async (req, res) => {
    const { ticketIds } = req.body; // Se espera un array de IDs de tickets

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: "❌ Se requieren IDs de tickets válidos." });
    }

    try {
        // Obtener técnicos con sus solicitudes activas
        const technicians = await getTechniciansWithRequests();

        const assignedResults = [];

        for (const ticketId of ticketIds) {
            // Obtener prioridad del ticket
            const ticketResult = await pool.query("SELECT prioridad_solicitud FROM tb_crear_ticket WHERE codigo_ticket = $1", [ticketId]);
            if (ticketResult.rows.length === 0) {
                return res.status(404).json({ message: `Ticket ${ticketId} no encontrado` });
            }
            const { prioridad_solicitud } = ticketResult.rows[0];

            // Asignar el ticket al técnico adecuado
            const assignedTechnician = assignRequest(technicians, prioridad_solicitud);
            if (assignedTechnician) {
                // Actualizar el ticket con el técnico asignado
                await pool.query("UPDATE tb_crear_ticket SET estado_ticket = 'asignado', codigo_trabajador = $1 WHERE codigo_ticket = $2", [assignedTechnician.codigo_trabajador, ticketId]);
                assignedResults.push({
                    ticketId: ticketId,
                    assignedTo: assignedTechnician.codigo_trabajador,
                    message: 'Ticket asignado correctamente.'
                });
            } else {
                assignedResults.push({
                    ticketId: ticketId,
                    message: 'No se pudo asignar el ticket.'
                });
            }
        }

        res.json(assignedResults);
    } catch (error) {
        console.error('❌ Error en la asignación automática:', error);
        res.status(500).json({ message: '❌ Error en el servidor al asignar tickets.' });
    }
});

// Función para obtener técnicos con sus solicitudes activas
const getTechniciansWithRequests = async () => {
    try {
        const result = await pool.query(`
            SELECT 
                t.codigo_trabajador,
                t.nombre_tecnico,
                t.promedio_tecnico,
                COUNT(s.codigo_solicitud) FILTER (WHERE s.estado_solicitud IN ('asignado', 'en proceso', 'pendiente', 'en lugar')) AS total_solicitudes_activas,
                COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Alta' AND s.estado_solicitud IN ('asignado', 'en proceso', 'pendiente', 'en lugar')) AS solicitudes_alta,
                COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Media' AND s.estado_solicitud IN ('asignado', 'en proceso', 'pendiente', 'en lugar')) AS solicitudes_media,
                COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Baja' AND s.estado_solicitud IN ('asignado', 'en proceso', 'pendiente', 'en lugar')) AS solicitudes_baja
            FROM 
                tecnicos t
            LEFT JOIN 
                solicitudes s ON t.codigo_trabajador = s.codigo_trabajador
            GROUP BY 
                t.codigo_trabajador, t.nombre_tecnico, t.promedio_tecnico;
        `);
        return result.rows;
    } catch (error) {
        console.error('Error obteniendo técnicos con solicitudes:', error);
        throw error;
    }
};

// Función para asignar un ticket a un técnico
const aleatorio = (length) => Math.floor(Math.random() * length);

const assignRequest = (technicians, newRequestPriority) => {
    let sortedByPriority;

    if (newRequestPriority === 'Alta') {
        sortedByPriority = [...technicians].sort((a, b) => a.solicitudes_alta - b.solicitudes_alta);
    } else if (newRequestPriority === 'Media') {
        sortedByPriority = [...technicians].sort((a, b) => a.solicitudes_media - b.solicitudes_media);
    } else if (newRequestPriority === 'Baja') {
        sortedByPriority = [...technicians].sort((a, b) => (a.solicitudes_alta + a.solicitudes_media + a.solicitudes_baja) - (b.solicitudes_alta + b.solicitudes_media + b.solicitudes_baja));
    } else {
        throw new Error('Prioridad inválida');
    }

    const minPriorityCount = newRequestPriority === 'Baja' 
        ? sortedByPriority[0].solicitudes_alta + sortedByPriority[0].solicitudes_media + sortedByPriority[0].solicitudes_baja
        : (newRequestPriority === 'Alta' ? sortedByPriority[0].solicitudes_alta : sortedByPriority[0].solicitudes_media);

    const filteredByPriority = sortedByPriority.filter(t => {
        const count = newRequestPriority === 'Baja' 
            ? t.solicitudes_alta + t.solicitudes_media + t.solicitudes_baja
            : (newRequestPriority === 'Alta' ? t.solicitudes_alta : t.solicitudes_media);
        return count === minPriorityCount;
    });

    let minTotalLoad = Math.min(...filteredByPriority.map(t => t.total_solicitudes_activas));
    let filteredByLoad = filteredByPriority.filter(t => t.total_solicitudes_activas === minTotalLoad);

    if (filteredByLoad.length === 1) return filteredByLoad[0];

    filteredByLoad.sort((a, b) => {
        const loadA = a.solicitudes_alta * 3 + a.solicitudes_media * 2 + a.solicitudes_baja;
        const loadB = b.solicitudes_alta * 3 + b.solicitudes_media * 2 + b.solicitudes_baja;
        return loadA - loadB;
    });

    let minCriticalLoad = filteredByLoad[0].solicitudes_alta * 3 + filteredByLoad[0].solicitudes_media * 2 + filteredByLoad[0].solicitudes_baja;

    let filteredByCriticalLoad = filteredByLoad.filter(t => (t.solicitudes_alta * 3 + t.solicitudes_media * 2 + t.solicitudes_baja) === minCriticalLoad);
    
    if (filteredByCriticalLoad.length === 1) return filteredByCriticalLoad[0];

    filteredByCriticalLoad.sort((a, b) => b.promedio_tecnico - a.promedio_tecnico);

    const maxScore = filteredByCriticalLoad[0].promedio_tecnico || 0;
    const filteredByScore = filteredByCriticalLoad.filter(t => (t.promedio_tecnico || 0) === maxScore);

    if (filteredByScore.length > 1) {
        return filteredByScore[aleatorio(filteredByScore.length)];
    }

    return filteredByScore[0];
};

// Inicializa el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
