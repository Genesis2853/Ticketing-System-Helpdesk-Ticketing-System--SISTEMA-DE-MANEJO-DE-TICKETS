import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import jwt from 'jsonwebtoken'; 
import { corsOptions } from "../corsOptions.js";

// Cargar variables de entorno al inicio
dotenv.config();

const app = express();
const port = config.portSoliNoRealizada || 3052;
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

app.get('/api/solino/solicitudNoReTec', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    const { tipo_usuario, codigo_trabajador } = req.user;
    try {
        let result;
        if (tipo_usuario === 'Tecnico') {
        result = await pool.query(`
            SELECT sn.id_soli_norealizada, sn.comentario_trabajo_norealizado, sn.motivo_norealizacion, sn.fecha_cierre_norealizado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_no_realizada sn
            JOIN solicitudes s ON s.codigo_solicitud = sn.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sn.id_historial_cambioestado
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
app.get('/api/solino/solicitudNoReTec/:id', autenticarToken, autorizarRoles('Tecnico'),   async (req, res) => {
    const solicitudtecnico = String(req.params.id); // Convertir a cadena
    try {
        const result = await pool.query(`
            SELECT sn.id_soli_norealizada, sn.comentario_trabajo_norealizado, sn.motivo_norealizacion, sn.fecha_cierre_norealizado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_no_realizada sn
            JOIN solicitudes s ON s.codigo_solicitud = sn.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sn.id_historial_cambioestado
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



// Ruta para obtener el historial de cambios de estado
app.get('/api/solino/historial/:codigo_solicitud', async (req, res) => {
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





app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

