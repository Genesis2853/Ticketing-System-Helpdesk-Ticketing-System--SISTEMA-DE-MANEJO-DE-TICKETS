import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import jwt from 'jsonwebtoken'; 
// Cargar variables de entorno al inicio
import { corsOptions } from "../corsOptions.js";


dotenv.config();

const app = express();
const port = config.portSoliCompletada || 3051;
 // bloquea TODO el backend
// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions); 

// Middleware para autenticar el token
const autenticarToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1]; // Obtener el token del encabezado
    if (!token) return res.sendStatus(401); // Si no hay token, no autorizado
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Si el token no es válido, prohibido
        req.user = user; // Almacenar la información del usuario en la solicitud
        next(); // Pasar al siguiente middleware o ruta
    });
    console.log('token recibido:', token);
};

function autorizarRoles(...rolesPermitidos) {
    return (req, res, next) => {
      if (!req.user) return res.status(401).json({ message: 'No autenticado' });
      if (!rolesPermitidos.includes(req.user.tipo_usuario)) {
        return res.status(403).json({ message: 'No autorizado' });
      }
      next();
    };
    
  }

app.get('/api/solicomcerr/solicitudComplTec', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    const { tipo_usuario, codigo_trabajador } = req.user;
    try {
        let result;
        if (tipo_usuario === 'Tecnico') {
        result = await pool.query(`
            SELECT sc.id_soli_completada, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.herramientas_utilizadas, sc.tiempo_invertido, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita, h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado
            WHERE s.codigo_trabajador = $1;
            `, [codigo_trabajador]);
        
        } else {
            return res.status(403).json({ message: 'No autorizado' }); // Manejo de roles no válidos
        }
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

// Ruta para obtener la lista de tickets
app.get('/api/solicomcerr/solicitudcompltecnico/:id', autenticarToken, autorizarRoles('Tecnico'),  async (req, res) => {
    const solicitudtecnico = String(req.params.id); // Convertir a cadena
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_completada, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.herramientas_utilizadas, sc.tiempo_invertido, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita, h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado
            WHERE s.codigo_solicitud = $1;
        `, [solicitudtecnico]); // Aquí ya es una cadena
        
        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Solicitud no encontrada');
        }
    } catch (error) {
        console.error('Error obteniendo la solicitud:', error);
        res.status(500).send('Error obteniendo la solicitud');
    }
});

app.get('/api/solicomcerr/tecnico/soliCerradoTec', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_cerrada, sc.motivo_cierre, sc.comentarios_tecnico, sc.intentos_resolucion, sc.fecha_cierre,
                   s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, s.tiempo_total, 
                   t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud,
                   d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita,
                   h.id_historial_cambioestado,
                   c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, 
                   c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
                   tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitudes_cerradas sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            LEFT JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            LEFT JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes cerradas:', error);
        res.status(500).send('Error obteniendo solicitudes cerradas');
    }
});

app.get('/api/solicomcerr/tecnico/soliCerradoTec/:id', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    const solicitudCodigo = String(req.params.id); // Convertir a cadena por seguridad

    try {
        const result = await pool.query(`
            SELECT sc.id_soli_cerrada, sc.motivo_cierre, sc.comentarios_tecnico, sc.intentos_resolucion, sc.fecha_cierre,
                   s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, s.tiempo_total,
                   t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud,
                   d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita,
                   h.id_historial_cambioestado,
                   t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
                   c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente,
                   c.fecha_creacion AS fecha_cliente, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
                   tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitudes_cerradas sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            LEFT JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            LEFT JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado
            WHERE s.codigo_solicitud = $1;
        `, [solicitudCodigo]);

        if (result.rows.length > 0) {
            res.json(result.rows[0]);
        } else {
            res.status(404).send('Solicitud cerrada no encontrada');
        }
    } catch (error) {
        console.error('Error obteniendo la solicitud cerrada:', error);
        res.status(500).send('Error obteniendo la solicitud cerrada');
    }
});

app.get('/api/solicomcerr/visitas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM datos_visita_cliente');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta para obtener el historial de cambios de estado
app.get('/api/solicomcerr/historial/:codigo_solicitud', async (req, res) => {
    const { codigo_solicitud } = req.params;
    try {
        const result = await pool.query(`
            SELECT * FROM historial_cambioestado_solicitudes
            WHERE codigo_solicitud = $1
            ORDER BY fecha_historial_cambioestado DESC;
        `, [codigo_solicitud]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener el historial:', error);
        res.status(500).json({ message: 'Error al obtener el historial' });
    }
});




// server.js  (o tu archivo de rutas)
app.get('/api/solicomcerr/evaluaciones/:id_soli_completada', async (req, res) => {
  const { id_soli_completada } = req.params;

  const query = `
    SELECT  e.id_evaluaciones, e.id_soli_completada, e. codigo_trabajador, e.puntuacion_tecnico, e.comentario_puntuacion_tecnico, e.fecha_evaluacion_tecnico, e.id_feedback, e.comentarios_cliente, e.calificacion_cliente,
            s.id_soli_completada
    FROM    evaluaciones e
    JOIN    solicitud_cerrada_completada s
           ON s.id_soli_completada = e.id_soli_completada
    WHERE   e.id_soli_completada = $1
  `;

  try {
    const { rows } = await pool.query(query, [id_soli_completada]);
    if (rows.length === 0) {
      return res.status(404).send('No hay evaluaciones para la solicitud');
    }
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al buscar evaluaciones');
  }
});





app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

