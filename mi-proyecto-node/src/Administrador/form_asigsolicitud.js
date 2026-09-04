import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { corsOptions } from "../corsOptions.js";


dotenv.config();

const app = express();
const port = config.portAssignTickets || 3032; // Cambiamos el puerto a 3062

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions);

// Ruta para obtener la lista de tickets
app.get('/api/asignar/tickets',  async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion
            FROM tb_crear_ticket t
            JOIN cliente c ON t.id_cliente = c.id_cliente
            WHERE t.codigo_ticket NOT IN (SELECT s.codigo_ticket FROM solicitudes s);
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});



app.get(
  '/api/asignar/tecnicos',
  async (req, res) => {
    const showTrash = req.query.inactivos === 'true';      // 👈
    try {
      const { rows } = await pool.query(
        `
        SELECT  codigo_trabajador, nombre_tecnico, apellido_tecnico,
                ci_tecnico, n_tlf_tecnico, email_tecnico, cuadrilla,
                activo, fecha_baja, fecha_creacion_tecnico
        FROM    tecnicos
        WHERE   activo = $1
        ORDER BY fecha_creacion_tecnico DESC;
        `,
        [!showTrash]        // TRUE → activos, FALSE → papelera
      );
      res.json(rows);
    } catch (err) {
      console.error('Error obteniendo técnicos:', err);
      res.status(500).send('Error obteniendo técnicos');
    }
  }
);

// Ruta para manejar la asignación manual de tickets a técnicos
app.post('/api/asignar/manual', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('crear_clientes'), async (req, res) => {
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

// 1. Obtener el user_id y nombre completo del técnico según codigo_trabajador
const resTecnico = await pool.query(
  `SELECT m.id_modulo_usuario, t.nombre_tecnico, t.apellido_tecnico
   FROM modulo_usuarios m
   JOIN tecnicos t ON m.codigo_trabajador = t.codigo_trabajador
   WHERE m.codigo_trabajador = $1
   LIMIT 1`,
  [codigo_trabajador]
);


if (resTecnico.rows.length === 0) {
  return res.status(404).json({ message: 'No se encontró usuario para el técnico' });
}

const { id_modulo_usuario: userIdTecnico, nombre_tecnico, apellido_tecnico } = resTecnico.rows[0];
const nombreCompleto = `${nombre_tecnico} ${apellido_tecnico}`;

// 👉 Guardar notificación en la BD
await pool.query(
  `INSERT INTO notificaciones (
    user_id,
    tipo,
    entidad,
    entidad_id,
    mensaje,
    datos_extra,
    destinatarios
  ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
  [
    req.user.id,
    'ASIGNAR_TICKET',
    'solicitudes',
    nuevoCodigoSoli,
    `Se asignó el ticket ${codigo_ticket} al técnico ${nombreCompleto}`,
    JSON.stringify({ asignadoPor: req.user.usuario }),
    JSON.stringify([userIdTecnico, req.user.id])
  ]
);

// 👉 Emitir por WebSocket
emitirNotificacion({
  mensaje: `Se asignó el ticket ${codigo_ticket} al técnico ${nombreCompleto}`,
  tipo: 'ASIGNAR_TICKET',
  leida: false,
  fecha: new Date(),
  usuario: req.user.usuario
});


    res.json({ message: 'Ticket asignado correctamente', codigo_solicitud: nuevoCodigoSoli, codigo_ticket });



    
  } catch (error) {
    console.error('Error asignando el ticket:', error);
    res.status(500).json({ message: 'Error asignando el ticket' });
  }
});


// Ruta para asignar tickets automáticamente
// Ruta para asignar tickets automáticamente

// Función para obtener técnicos con solicitudes activas (con COALESCE para evitar nulls)
const getTechniciansWithRequests = async () => {
  try {
    const result = await pool.query(`
      SELECT 
        t.codigo_trabajador,
        t.nombre_tecnico,
        t.promedio_tecnico,
        COALESCE(COUNT(s.codigo_solicitud) FILTER (WHERE s.estado_solicitud IN ('asignado','En Proceso','Pendiente','En Lugar')), 0) AS total_solicitudes_activas,
        COALESCE(COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Alta' AND s.estado_solicitud IN ('asignado','En Proceso','Pendiente','En Lugar')), 0) AS solicitudes_alta,
        COALESCE(COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Media' AND s.estado_solicitud IN ('asignado','En Proceso','Pendiente','En Lugar')), 0) AS solicitudes_media,
        COALESCE(COUNT(s.codigo_solicitud) FILTER (WHERE s.prioridad_solicitud = 'Baja' AND s.estado_solicitud IN ('asignado','En Proceso','Pendiente','En Lugar')), 0) AS solicitudes_baja,
        COALESCE(pt.promedio_minutos, 0) AS promedio_tiempo_resolucion
      FROM tecnicos t
      LEFT JOIN solicitudes s ON t.codigo_trabajador = s.codigo_trabajador
      LEFT JOIN promedio_tiempo_tecnico pt ON t.codigo_trabajador = pt.codigo_trabajador
      WHERE t.activo = true
      GROUP BY t.codigo_trabajador, t.nombre_tecnico, t.promedio_tecnico, pt.promedio_minutos;
    `);
    return result.rows;
  } catch (error) {
    console.error('Error obteniendo técnicos con solicitudes:', error);
    throw error;
  }
};


const MAX_SOLICITUDES = 5; // Máximo total de solicitudes activas por técnico

// Ponderaciones de carga de trabajo
const PONDERACION = {
    'Alta': 3,
    'Media': 2,
    'Baja': 1
};

// Función para calcular la carga total ponderada de cada técnico
const calcularCargaTotal = (tech) => {
    return (tech.solicitudes_alta * PONDERACION['Alta']) +
           (tech.solicitudes_media * PONDERACION['Media']) +
           (tech.solicitudes_baja * PONDERACION['Baja']);
};

// Función para obtener técnicos elegibles según prioridad y carga
const getEligibleTechnicians = (technicians, newRequestPriority, messages) => {
    messages.push(`Iniciando filtrado de técnicos para solicitud de prioridad ${newRequestPriority}.`);

    const eligibleTechnicians = technicians.filter(tech => {
        const cargaTotal = calcularCargaTotal(tech);

        // Evitar asignar más solicitudes altas a técnicos con una alta activa,
        // salvo que su carga total sea baja.
        if (newRequestPriority === 'Alta' && tech.solicitudes_alta > 0 && cargaTotal >= (MAX_SOLICITUDES / 2)) {
            messages.push(`⚠ Excluyendo técnico ${tech.codigo_trabajador} porque ya tiene una solicitud alta y carga elevada.`);
            return false;
        }

        // No exceder el límite total de solicitudes
        const elegible = cargaTotal < MAX_SOLICITUDES;
        if (!elegible) {
            messages.push(`⚠ Excluyendo técnico ${tech.codigo_trabajador} porque excede el límite de solicitudes.`);
        }
        return elegible;
    });

    if (eligibleTechnicians.length === 0) {
        messages.push(`🚫 No se encontraron técnicos elegibles tras el filtrado por prioridad y carga.`);
    } else {
        messages.push(`✅ Técnicos elegibles tras el filtro: [${eligibleTechnicians.map(t => t.codigo_trabajador).join(', ')}]`);
    }
    
    return eligibleTechnicians;
};



// Función para asignar una solicitud considerando prioridad, carga y desempeño
const assignRequest = async (technicians, newRequestPriority, messages = []) => {
    if (!technicians || technicians.length === 0) {
        messages.push('⚠ No hay técnicos disponibles.');
        return { assignedTechnician: null, messages };
    }

    messages.push('🔎 Buscando técnicos sin solicitudes activas...');
    const techniciansWithoutRequests = technicians.filter(tech =>
        tech.solicitudes_alta === 0 &&
        tech.solicitudes_media === 0 &&
        tech.solicitudes_baja === 0
    );

    if (techniciansWithoutRequests.length > 0) {
        messages.push(`✅ Técnicos sin solicitudes activas encontrados: [${techniciansWithoutRequests.map(t => t.codigo_trabajador).join(', ')}]`);

        techniciansWithoutRequests.sort((a, b) => {
            // Primero comparar carga total
            const cargaA = calcularCargaTotal(a);
            const cargaB = calcularCargaTotal(b);
            messages.push(`⚖ Comparando carga total: ${a.codigo_trabajador} (${cargaA}) vs ${b.codigo_trabajador} (${cargaB}).`);
            if (cargaA !== cargaB) {
                return cargaA - cargaB; // De menor a mayor
            }

            // Si hay empate en carga, comparar desempeño
            messages.push(`📊 Comparando desempeño: ${a.codigo_trabajador} (${a.promedio_tecnico}) vs ${b.codigo_trabajador} (${b.promedio_tecnico}).`);
            if (a.promedio_tecnico !== b.promedio_tecnico) {
                return b.promedio_tecnico - a.promedio_tecnico; // De mayor a menor
            }

            // Si hay empate en desempeño, comparar tiempo promedio de resolución
            messages.push(`⏳ Comparando tiempo promedio de resolución: ${a.codigo_trabajador} (${a.promedio_tiempo_resolucion}) vs ${b.codigo_trabajador} (${b.promedio_tiempo_resolucion}).`);
            if (a.promedio_tiempo_resolucion !== b.promedio_tiempo_resolucion) {
                return a.promedio_tiempo_resolucion - b.promedio_tiempo_resolucion; // De menor a mayor
            }

            // Si hay empate en tiempo promedio de resolución, comparar tiempo sin asignaciones
            const timeA = new Date(a.fecha_solicitud || 0);
            const timeB = new Date(b.fecha_solicitud || 0);
            messages.push(`⏳ Comparando tiempo sin asignaciones: ${a.codigo_trabajador} (${timeA}) vs ${b.codigo_trabajador} (${timeB}).`);
            return timeA - timeB; // De menor a mayor
        });

        // Manejo de empate en desempeño
        const bestScore = techniciansWithoutRequests[0].promedio_tecnico;
        const bestTechs = techniciansWithoutRequests.filter(t => t.promedio_tecnico === bestScore);
        if (bestTechs.length > 1) {
            messages.push(`🎲 Empate en desempeño entre técnicos sin solicitudes activas. Selección aleatoria entre: [${bestTechs.map(t => t.codigo_trabajador).join(', ')}].`);
            return { assignedTechnician: bestTechs[Math.floor(Math.random() * bestTechs.length)], messages };
        }

        messages.push(`🟢 Asignando solicitud ${newRequestPriority} al técnico sin solicitudes activas: ${techniciansWithoutRequests[0].codigo_trabajador}`);
        return { assignedTechnician: techniciansWithoutRequests[0], messages };
    }

    messages.push('🔎 No hay técnicos sin solicitudes activas, procediendo con lógica de carga y desempeño...');
    let filteredTechnicians = getEligibleTechnicians(technicians, newRequestPriority, messages);

    if (filteredTechnicians.length === 0) {
        messages.push('🚫 No se encontraron técnicos disponibles tras los filtros de carga y prioridad.');
        return { assignedTechnician: null, messages };
    }

    messages.push('🔄 Ordenando técnicos según carga total, desempeño y tiempo sin asignaciones...');
    filteredTechnicians.sort((a, b) => {
        // Primero comparar carga total
        const cargaA = calcularCargaTotal(a);
        const cargaB = calcularCargaTotal(b);
        messages.push(`⚖ Comparando carga total: ${a.codigo_trabajador} (${cargaA}) vs ${b.codigo_trabajador} (${cargaB}).`);
        if (cargaA !== cargaB) {
            return cargaA - cargaB; // De menor a mayor
        }

        // Si hay empate en carga, comparar desempeño
        messages.push(`📊 Comparando desempeño: ${a.codigo_trabajador} (${a.promedio_tecnico}) vs ${b.codigo_trabajador} (${b.promedio_tecnico}).`);
        if (a.promedio_tecnico !== b.promedio_tecnico) {
            return b.promedio_tecnico - a.promedio_tecnico; // De mayor a menor
        }

        // Si hay empate en desempeño, comparar tiempo promedio de resolución
        messages.push(`⏳ Comparando tiempo promedio de resolución: ${a.codigo_trabajador} (${a.promedio_tiempo_resolucion}) vs ${b.codigo_trabajador} (${b.promedio_tiempo_resolucion}).`);
        if (a.promedio_tiempo_resolucion !== b.promedio_tiempo_resolucion) {
            return a.promedio_tiempo_resolucion - b.promedio_tiempo_resolucion; // De menor a mayor
        }

        // Si hay empate en tiempo promedio de resolución, comparar tiempo sin asignaciones
        const timeA = new Date(a.fecha_solicitud || 0);
        const timeB = new Date(b.fecha_solicitud || 0);
        messages.push(`⏳ Comparando tiempo sin asignaciones: ${a.codigo_trabajador} (${timeA}) vs ${b.codigo_trabajador} (${timeB}).`);
        return timeA - timeB; // De menor a mayor
    });

    // Manejo de empate en desempeño
    const bestScore = filteredTechnicians[0].promedio_tecnico;
    const bestTechs = filteredTechnicians.filter(t => t.promedio_tecnico === bestScore);
    if (bestTechs.length > 1) {
        messages.push(`🎲 Empate en desempeño entre técnicos con solicitudes activas. Selección aleatoria entre: [${bestTechs.map(t => t.codigo_trabajador).join(', ')}].`);
        return { assignedTechnician: bestTechs[Math.floor(Math.random() * bestTechs.length)], messages };
    }

    const selectedTechnician = filteredTechnicians[0];
    messages.push(`🟢 Asignando solicitud ${newRequestPriority} a técnico: ${selectedTechnician.codigo_trabajador}`);

    return { assignedTechnician: selectedTechnician, messages };
};



// Ruta para asignar tickets automáticamente
app.post('/api/asignar/automatico', autenticarToken, async (req, res) => {
    const { ticketIds } = req.body; // Se espera un array de IDs de tickets

    if (!ticketIds || !Array.isArray(ticketIds) || ticketIds.length === 0) {
        return res.status(400).json({ message: "❌ Se requieren IDs de tickets válidos." });
    }

    try {
        const technicians = await getTechniciansWithRequests(); // Asegúrate que await está aquí!

        const assignedResults = [];
        const messages = []; // Inicializa el arreglo de mensajes

        for (const ticketId of ticketIds) {
            // Obtener información del ticket
            const ticketResult = await pool.query(
                "SELECT prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita FROM tb_crear_ticket WHERE codigo_ticket = $1",
                [ticketId]
            );
            if (ticketResult.rows.length === 0) {
                assignedResults.push({ ticketId, message: `Ticket ${ticketId} no encontrado` });
                messages.push(`Ticket ${ticketId} no encontrado`);
                continue;
            }
            const { prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita } = ticketResult.rows[0];

            // Asignar el ticket al técnico adecuado
            const assignmentResult = await assignRequest(technicians, prioridad_solicitud, messages);
            const assignedTechnician = assignmentResult.assignedTechnician; // Solo esto

            if (assignedTechnician) {
                // Insertar la nueva solicitud en la tabla de solicitudes
                const insertResult = await pool.query(
                    "INSERT INTO solicitudes (codigo_ticket, codigo_trabajador, prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita) VALUES ($1, $2, $3, $4, $5, $6) RETURNING codigo_solicitud",
                    [ticketId, assignedTechnician.codigo_trabajador, prioridad_solicitud, descripcion_servicio, id_cliente, motivo_visita]
                );

                const nuevoCodigoSoli = insertResult.rows[0].codigo_solicitud;

const resTecnico = await pool.query(
  `SELECT m.id_modulo_usuario, t.nombre_tecnico, t.apellido_tecnico
   FROM modulo_usuarios m
   JOIN tecnicos t ON m.codigo_trabajador = t.codigo_trabajador
   WHERE m.codigo_trabajador = $1
   LIMIT 1`,
  [assignedTechnician.codigo_trabajador]
);

let nombreCompleto = assignedTechnician.codigo_trabajador;
if (resTecnico.rows.length > 0) {
  const { id_modulo_usuario: userIdTecnico, nombre_tecnico, apellido_tecnico } = resTecnico.rows[0];
  nombreCompleto = `${nombre_tecnico} ${apellido_tecnico}`;

  // Guardar notificación en la BD
  await pool.query(
    `INSERT INTO notificaciones (
      user_id,
      tipo,
      entidad,
      entidad_id,
      mensaje,
      datos_extra,
      destinatarios
    ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
    [
      req.user.id,
      'ASIGNAR_TICKET',
      'solicitudes',
      nuevoCodigoSoli,
      `Se asignó automáticamente el ticket ${ticketId} al técnico ${nombreCompleto}`,
      JSON.stringify({ asignadoPor: req.user.usuario }),
      JSON.stringify([userIdTecnico, req.user.id])
    ]
  );

  // Emitir por WebSocket
  emitirNotificacion({
    mensaje: `Se asignó automáticamente el ticket ${ticketId} al técnico ${nombreCompleto}`,
    tipo: 'ASIGNAR_TICKET',
    leida: false,
    fecha: new Date(),
    usuario: req.user.usuario
  });
}




               assignedResults.push({
                    ticketId: ticketId,
                    assignedTo: nombreCompleto, // ← nombre y apellido
                    codigo_solicitud: nuevoCodigoSoli,
                    codigo_trabajador: assignedTechnician.codigo_trabajador,
                    message: 'Ticket asignado correctamente.'
                    });
                    messages.push(`Ticket ${ticketId} asignado a ${nombreCompleto}`);

            } else {
                assignedResults.push({
                    ticketId: ticketId,
                    message: 'No se pudo asignar el ticket.'
                });
                messages.push(`No se pudo asignar el ticket ${ticketId}.`);
            }
        }

        res.json({ assignedResults, messages }); // Devuelve los resultados y los mensajes

    } catch (error) {
        console.error('❌ Error en la asignación automática:', error);
        res.status(500).json({ message: '❌ Error en el servidor al asignar tickets.' });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});
