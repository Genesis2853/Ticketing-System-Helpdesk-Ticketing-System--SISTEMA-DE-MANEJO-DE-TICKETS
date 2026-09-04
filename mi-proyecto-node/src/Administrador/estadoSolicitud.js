import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "../Modulo_Usuario/modulo_usuario.js";
import { corsOptions } from "../corsOptions.js";




// Cargar variables de entorno al inicio
dotenv.config();

console.log(config.dbHost); // localhost
console.log(config.dbUser); // root
console.log(config.dbPass); // s1mpl3
console.log(config.portCreateTickets); // 3031
console.log(config.portAssignTickets); // 3032
console.log(config.portEstadoSoli);// 3033

const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT codigo_solicitud, codigo_trabajador, codigo_ticket, fecha_solicitud, prioridad_solicitud, motivo_visita, estado_solicitud, descripcion_servicio, id_cliente FROM solicitudes;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portEstadoSoli || 3033;

// Middleware para parsear el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(corsOptions); 

// Ruta para obtener la lista de tickets




// Ruta para obtener la lista de solicitudes
app.get('/api/estado/solicitudes', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('ver_estado_solicitudes'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.motivo_visita, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio, 
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico
            FROM solicitudes s
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            WHERE s.estado_solicitud != 'Completado' AND s.estado_solicitud != 'No Realizado' AND s.estado_solicitud != 'Cerrado';
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

// Nueva ruta para obtener los detalles de una solicitud por ID
app.get('/api/estado/solicitudes/:id',  async (req, res) => {
    const solicitudId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.motivo_visita, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico
            
            FROM solicitudes s
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            
            WHERE s.codigo_solicitud = $1;
        `, [solicitudId]);
        
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

// Ruta para obtener la lista de solicitudes
app.get('/api/estado/soliComplTec', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('ver_soli_completa', 'reporte_servicio'), async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_completada, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.tiempo_invertido, sc.herramientas_utilizadas, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita, h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

// Nueva ruta para obtener los detalles de una solicitud por ID
app.get('/api/estado/soliComplTec/:id',  async (req, res) => {
    const solicitudtecnico = String(req.params.id); // Convertir a cadena
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_completada, sc.comentario_trabajo_realizado, sc.tipo_solucion_falla, sc.tiempo_invertido, sc.herramientas_utilizadas, sc.fecha_caso_cerrado, 
            s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, 
            d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita, h.id_historial_cambioestado,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
            tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
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

app.get('/api/estado/soliNoReTec', autenticarToken, autorizarRoles('Admin', 'Moderador'), autorizarPorPermiso('ver_solino', 'reporte_servicio'), async (req, res) => {
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
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sn.id_historial_cambioestado;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

// Ruta para obtener la lista de tickets
app.get('/api/estado/soliNoReTec/:id', async (req, res) => {
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
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN cliente c ON t.id_cliente = c.id_cliente
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


app.get('/api/estado/soliCerradoTec', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT sc.id_soli_cerrada, sc.motivo_cierre, sc.comentarios_tecnico, sc.intentos_resolucion, sc.fecha_cierre,
                   s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, s.prioridad_solicitud,
                   t.codigo_ticket, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud, t.motivo_visita,
                   d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita,
                   h.id_historial_cambioestado,
                   c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, 
                   c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
                   tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitudes_cerradas sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            LEFT JOIN datos_visita_cliente d ON d.id_datosvisita = sc.id_datosvisita
            LEFT JOIN historial_cambioestado_solicitudes h ON h.id_historial_cambioestado = sc.id_historial_cambioestado;
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo solicitudes cerradas:', error);
        res.status(500).send('Error obteniendo solicitudes cerradas');
    }
});

app.get('/api/estado/soliCerradoTec/:id', async (req, res) => {
    const solicitudCodigo = String(req.params.id); // Convertir a cadena por seguridad

    try {
        const result = await pool.query(`
            SELECT sc.id_soli_cerrada, sc.motivo_cierre, sc.comentarios_tecnico, sc.intentos_resolucion, sc.fecha_cierre,
                   s.codigo_solicitud, s.estado_solicitud, s.codigo_ticket, s.codigo_trabajador,
                   t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.fecha_solicitud,
                   d.id_datosvisita, d.dias_disponibles, d.comentario_datosvisita, 
                   h.id_historial_cambioestado,
                   t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
                   c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente,
                   c.fecha_creacion AS fecha_cliente, c.nro_contrato, c.direccion_cliente, c.tipo_servicio,
                   tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico, tc.ci_tecnico, tc.n_tlf_tecnico, tc.email_tecnico, tc.cuadrilla
            FROM solicitudes_cerradas sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
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







app.get('/api/estado/visitas', async (req, res) => {
  try {
    const query = `
      SELECT
        dvc.*,                
        s.codigo_solicitud,
        s.estado_solicitud,
        s.codigo_ticket,
        s.codigo_trabajador
      FROM datos_visita_cliente AS dvc
      JOIN solicitudes AS s
        ON s.codigo_solicitud = dvc.codigo_solicitud
    `;

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Ruta para obtener el historial de cambios de estado
app.get('/api/estado/historial/:codigo_solicitud', async (req, res) => {
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

getLanguages();