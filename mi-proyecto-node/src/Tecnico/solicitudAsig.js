import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js'; // Usar import en lugar de require
import jwt from 'jsonwebtoken'; 
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { corsOptions } from "../corsOptions.js";



// Cargar variables de entorno al inicio
dotenv.config();

console.log(config.dbHost); // localhost
console.log(config.dbUser); // root
console.log(config.dbPass); // s1mpl3
console.log(config.portSoliAsigTec); // 3050

const getLanguages = async () => {
    try {
        const result = await pool.query("SELECT codigo_solicitud, codigo_trabajador, codigo_ticket, fecha_solicitud, prioridad_solicitud, estado_solicitud, descripcion_servicio, id_cliente FROM solicitudes;");
        console.log(result);
    } catch (error) {
        console.error(error);
    }
};

const app = express();
const port = config.portSoliAsigTec || 3050;

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


// Ruta para obtener la lista de solicitudes asignadas a técnicos
app.get('/api/soliasig/solicitudAsigTec', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    const { tipo_usuario, codigo_trabajador } = req.user; // Extraer información del usuario

    try {
        let result;
        if (tipo_usuario === 'Tecnico') {
            // Los técnicos solo ven las solicitudes asignadas a ellos
            result = await pool.query(`
                SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud, s.inicio_tiempo, s.fin_tiempo, s.tiempo_total,
                tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
            FROM solicitudes s
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
                WHERE 
        s.codigo_trabajador = $1
        AND (
            s.estado_solicitud NOT IN ('Completado', 'No Realizado', 'Cerrado')
            OR (s.estado_solicitud IN ('Completado', 'No Realizado', 'Cerrado') AND s.formulario_cierre_enviado = false)
        );
            `, [codigo_trabajador]);
            console.log('Resultados de la consulta:', result.rows);
        } else {
            return res.status(403).json({ message: 'No autorizado' }); // Manejo de roles no válidos
        }
        res.json(result.rows); // Devolver las solicitudes encontradas
        console.log('codigo del trabajador:', codigo_trabajador);
    } catch (error) {
        console.error('Error obteniendo solicitudes:', error);
        res.status(500).send('Error obteniendo solicitudes');
    }
});

app.put('/api/soliasig/marcarFormularioEnviado', async (req, res) => {
    const { codigo_solicitud } = req.body;

    try {
        await pool.query(`
            UPDATE solicitudes
            SET formulario_cierre_enviado = true
            WHERE codigo_solicitud = $1
        `, [codigo_solicitud]);

        res.status(200).json({ message: 'Formulario marcado como enviado' });
    } catch (error) {
        console.error('Error marcando formulario como enviado:', error);
        res.status(500).json({ message: 'Error actualizando estado' });
    }
});



// Nueva ruta para obtener los detalles de una solicitud por ID
app.get('/api/soliasig/solicitudAsigTec/:id',  async (req, res) => {
    const solicitudAsigId = req.params.id;
    try {
        const result = await pool.query(`
            SELECT s.codigo_solicitud, s.codigo_ticket, s.codigo_trabajador, t.id_cliente, t.prioridad_solicitud, t.descripcion_servicio, s.estado_solicitud, s.fecha_solicitud, s.inicio_tiempo, s.fin_tiempo, s.tiempo_total,
                tc.codigo_trabajador, tc.nombre_tecnico, tc.apellido_tecnico,
            t.codigo_ticket, t.descripcion_servicio, t.prioridad_solicitud, t.id_cliente, t.motivo_visita, t.fecha_creacion,
            c.id_cliente, c.nombre_cliente, c.apellido_cliente, c.n_tlf_cliente, c.email_cliente, c.fecha_creacion, c.nro_contrato, c.direccion_cliente, c.tipo_servicio
            FROM solicitudes s
            JOIN tecnicos tc ON tc.codigo_trabajador = s.codigo_trabajador
            JOIN tb_crear_ticket t ON s.codigo_ticket = t.codigo_ticket
            JOIN cliente c ON t.id_cliente = c.id_cliente
            WHERE s.codigo_solicitud = $1;
        `, [solicitudAsigId]);
        
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

const tecnicoRoutes = await import('./tecnico.js');
app.use(tecnicoRoutes.default);

const puertos = [3001, 3002];
puertos.forEach(puerto => {
  app.listen(puerto, () => {
    console.log(`Servidor en funcionamiento en el puerto ${puerto}`);
  });
});

// Ruta para actualizar el estado de la solicitud
// Código Node.js modificado para el endpoint POST /api/actualizarEstado con cálculo automático de total_tiempo en la base de datos

app.post('/api/soliasig/actualizarEstado', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
  const { codigo_solicitud, estado_solicitud, razon_cambioestado } = req.body;

  try {
    let result;

    if (estado_solicitud === 'En Proceso') {
      result = await pool.query(`
        UPDATE solicitudes
        SET estado_solicitud = $1, inicio_tiempo = NOW()
        WHERE codigo_solicitud = $2
        RETURNING *;
      `, [estado_solicitud, codigo_solicitud]);

    } else if (estado_solicitud === 'Completado' || estado_solicitud === 'Cerrado') {
      result = await pool.query(`
        UPDATE solicitudes
        SET estado_solicitud = $1,
            fin_tiempo = NOW(),
            tiempo_total = AGE(NOW(), inicio_tiempo)
        WHERE codigo_solicitud = $2
        RETURNING *;
      `, [estado_solicitud, codigo_solicitud]);
    } else if (estado_solicitud === 'Confirmado') {
      result = await pool.query(`
        UPDATE solicitudes
        SET estado_solicitud = $1
        WHERE codigo_solicitud = $2
        RETURNING *;
      `, [estado_solicitud, codigo_solicitud]);
    } else {
      result = await pool.query(`
        UPDATE solicitudes
        SET estado_solicitud = $1
        WHERE codigo_solicitud = $2
        RETURNING *;
      `, [estado_solicitud, codigo_solicitud]);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Solicitud no encontrada' });
    }

    // Registrar en historial el cambio
    await pool.query(`
      INSERT INTO historial_cambioestado_solicitudes (codigo_solicitud, estado_solicitud, razon_cambioestado)
      VALUES ($1, $2, $3);
    `, [codigo_solicitud, estado_solicitud, razon_cambioestado]);

    
    
    // Obtener IDs de los usuarios tipo Admin o Moderador
const destinatariosQuery = await pool.query(
  `SELECT id_modulo_usuario FROM public.modulo_usuarios WHERE tipo_usuario IN ('Admin', 'Moderador')`
);
const destinatarios = destinatariosQuery.rows.map(u => u.id_modulo_usuario);

    
    
    // Insertar la notificación en BD
    await pool.query(`
      INSERT INTO notificaciones (
        user_id,
        tipo,
        entidad,
        entidad_id,
        mensaje,
        datos_extra,
        destinatarios
      ) VALUES ($1, $2, $3, $4, $5, $6, $7);`,
     [
      req.user.id,  // usuario que hizo el cambio
      'CAMBIO_ESTADO_SOLICITUD',
      'solicitud',
      codigo_solicitud,
      `La solicitud ${codigo_solicitud} cambió a estado ${estado_solicitud}`,
      JSON.stringify({ razon: razon_cambioestado, tecnico: req.user.usuario }),
      JSON.stringify([...destinatarios, req.user.id])  // 👈 destinatarios reales
    ]);

    // Emitir notificación en tiempo real
    emitirNotificacion({
      mensaje: `La solicitud ${codigo_solicitud} cambió a estado ${estado_solicitud}`,
      tipo: 'CAMBIO_ESTADO_SOLICITUD',
      leida: false,
      fecha: new Date(),
      usuario: req.user.usuario,
      codigo_solicitud,
      estado_solicitud,
    });

    res.json({ message: 'Estado actualizado correctamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    res.status(500).json({ message: 'Error al actualizar el estado' });
  }
});


app.get('/api/soliasig/solicitudes/tiempo/:codigo_solicitud', async (req, res) => {
    const { codigo_solicitud } = req.params;

    try {
        const result = await pool.query(`
            SELECT tiempo_total
            FROM solicitudes
            WHERE codigo_solicitud = $1;
        `, [codigo_solicitud]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Solicitud no encontrada' });
        }

        res.status(200).json(result.rows[0]); // Devuelve { tiempo_total: '01:45:30' }
    } catch (error) {
        console.error('Error al obtener el tiempo_total:', error);
        res.status(500).json({ message: 'Error al obtener el tiempo_total' });
    }
});



app.get('/api/soliasig/historial/:codigo_solicitud',  async (req, res) => {
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


app.post('/api/soliasig/datosvisita', async (req, res) => {
    const { codigo_solicitud, dias_disponibles, comentario_datosvisita } = req.body;

    try {
        // Verificar si ya existe un registro para esa solicitud
        const existe = await pool.query(`
            SELECT * FROM datos_visita_cliente WHERE codigo_solicitud = $1
        `, [codigo_solicitud]);

        if (existe.rows.length > 0) {
            return res.status(400).json({ message: 'Ya existe un dato de visita para esta solicitud.' });
        }

        // Insertar si no existe
        const result = await pool.query(`
            INSERT INTO datos_visita_cliente (codigo_solicitud, dias_disponibles, comentario_datosvisita)
            VALUES ($1, $2, $3)
            RETURNING id_datosvisita;
        `, [codigo_solicitud, dias_disponibles, comentario_datosvisita]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar los datos de visita:', error);
        res.status(500).json({ message: 'Error al registrar los datos' });
    }
});

app.put('/api/soliasig/datosvisita/:codigo_solicitud', async (req, res) => {
    const { codigo_solicitud } = req.params;
    const { dias_disponibles, comentario_datosvisita } = req.body;

    try {
        const result = await pool.query(`
            UPDATE datos_visita_cliente
            SET dias_disponibles = $1, comentario_datosvisita = $2
            WHERE codigo_solicitud = $3
            RETURNING *;
        `, [dias_disponibles, comentario_datosvisita, codigo_solicitud]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Dato de visita no encontrado para actualizar.' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar los datos de visita:', error);
        res.status(500).json({ message: 'Error al actualizar los datos de visita.' });
    }
});


app.get('/api/soliasig/visitas',  async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM datos_visita_cliente');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.get('/api/soliasig/datosdeVisitas/:codigo_solicitud',  async (req, res) => {
    const { codigo_solicitud } = req.params;

    try {
        // Consulta individual para obtener datos de visita
        const datosVisita = await pool.query(`
            SELECT d.id_datosvisita, d.dias_disponibles, s.codigo_solicitud, d.fecha_datovisita, d.comentario_datosvisita
            FROM datos_visita_cliente d
            JOIN solicitudes s ON d.codigo_solicitud = s.codigo_solicitud
            WHERE s.codigo_solicitud = $1;
        `, [codigo_solicitud]);

        // Verificar si se encontraron datos
        if (datosVisita.rows.length === 0) {
            // Si no hay datos, devolver un array vacío
            return res.status(200).json([]); // O puedes devolver un objeto vacío {}
        }

        // Si hay datos, devolver el primer registro
        res.status(200).json(datosVisita.rows[0]);
    } catch (error) {
        console.error('Error al obtener los datos completos:', error);
        res.status(500).json({ message: 'Error al obtener los datos completos.' });
    }
});


app.get('/api/soliasig/historial/todos/:codigo_solicitud',  async (req, res) => {
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

app.post('/api/soliasig/guardarsolicitudcompleta', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    console.log('Datos recibidos:', req.body);

    const {
        codigo_solicitud,
        estado_solicitud,
        id_historial_cambioestado,
        id_datosvisita,
        tipo_solucion_falla,
        comentario_trabajo_realizado,
        herramientas_utilizadas,
        tiempo_invertido
    } = req.body;

    try {
        // Asegúrate de que tiempo_invertido esté en el formato correcto
        const tiempoInvertidoFormatted = intervalToString(tiempo_invertido); // Asumiendo que tiempo_invertido es un número de horas

        const result = await pool.query(`
            INSERT INTO solicitud_cerrada_completada (
                codigo_solicitud,
                estado_solicitud,
                id_historial_cambioestado,
                id_datosvisita,
                tipo_solucion_falla,
                comentario_trabajo_realizado,
                herramientas_utilizadas,
                tiempo_invertido
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `, [
            codigo_solicitud,
            estado_solicitud,
            id_historial_cambioestado,
            id_datosvisita,
            tipo_solucion_falla,
            comentario_trabajo_realizado,
            herramientas_utilizadas,
            tiempoInvertidoFormatted
        ]);

        const nuevaSolicitudCompletada = result.rows[0];

        // Insertar la notificación en la BD
        await pool.query(`
            INSERT INTO notificaciones (
                user_id,
                tipo,
                entidad,
                entidad_id,
                mensaje,
                datos_extra
            ) VALUES ($1, $2, $3, $4, $5, $6);
        `, [
            req.user.id,                      // Usuario que crea la solicitud completa
            'SOLICITUD_COMPLETADA',
            'solicitud_cerrada_completada',
            nuevaSolicitudCompletada.id_soli_completada,     // O el campo identificador que tengas
            `Solicitud ${codigo_solicitud} completada con estado: ${estado_solicitud}`,
            JSON.stringify({ tecnico: req.user.usuario, tipo_solucion_falla })
        ]);

        // Emitir notificación en tiempo real
        emitirNotificacion({
            mensaje: `Solicitud ${codigo_solicitud} completada con estado: ${estado_solicitud}`,
            tipo: 'SOLICITUD_COMPLETADA',
            leida: false,
            fecha: new Date(),
            usuario: req.user.usuario
        });

        res.status(201).json({
            message: 'Datos guardados correctamente en solicitud_cerrada_completada',
            solicitud_cerrada_completada: nuevaSolicitudCompletada
        });

    } catch (error) {
        console.error('Error al guardar la solicitud completa:', error);
        res.status(500).json({ message: 'Error al guardar la solicitud completa.' });
    }
});


app.post('/api/soliasig/guardarsolicitudcerrada', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    console.log('Datos recibidos para cierre:', req.body);

    const {
        codigo_solicitud,
        motivo_cierre,
        comentarios_tecnico,
        intentos_resolucion,
        id_datosvisita,
        id_historial_cambioestado
    } = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO solicitudes_cerradas (
                codigo_solicitud,
                motivo_cierre,
                comentarios_tecnico,
                intentos_resolucion,
                id_datosvisita,
                id_historial_cambioestado
            ) VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `, [
            codigo_solicitud,
            motivo_cierre,
            comentarios_tecnico,
            intentos_resolucion,
            id_datosvisita,
            id_historial_cambioestado
        ]);

        const nuevaSolicitudCerrada = result.rows[0];

        // Insertar la notificación en BD
        await pool.query(`
            INSERT INTO notificaciones (
                user_id,
                tipo,
                entidad,
                entidad_id,
                mensaje,
                datos_extra
            ) VALUES ($1, $2, $3, $4, $5, $6);
        `, [
            req.user.id,                  // Usuario que cierra la solicitud
            'CIERRE_SOLICITUD',
            'solicitud_cerrada',
            nuevaSolicitudCerrada.id_soli_cerrada,     // O el campo identificador que tengas
            `Solicitud ${codigo_solicitud} cerrada: ${motivo_cierre}`,
            JSON.stringify({ tecnico: req.user.usuario, comentarios_tecnico })
        ]);

        // Emitir notificación en tiempo real (suponiendo que tienes esta función global)
        emitirNotificacion({
            mensaje: `Solicitud ${codigo_solicitud} cerrada con motivo: ${motivo_cierre}`,
            tipo: 'CIERRE_SOLICITUD',
            leida: false,
            fecha: new Date(),
            usuario: req.user.usuario
        });

        res.status(201).json({
            message: 'Solicitud cerrada guardada correctamente',
            solicitud_cerrada: nuevaSolicitudCerrada
        });

    } catch (error) {
        console.error('Error al guardar la solicitud cerrada:', error);
        res.status(500).json({ message: 'Error al guardar la solicitud cerrada.' });
    }
});



function intervalToString(interval) {
    const days = interval.days ? `${interval.days} days ` : '';
    const hours = interval.hours ? `${interval.hours.toString().padStart(2, '0')}` : '00';
    const minutes = interval.minutes ? `${interval.minutes.toString().padStart(2, '0')}` : '00';
    const seconds = interval.seconds ? `${interval.seconds.toString().padStart(2, '0')}` : '00';
    return `${days}${hours}:${minutes}:${seconds}`; // Formato esperado por PostgreSQL
}

app.post('/api/soliasig/guardarsolicitudnorealizada', autenticarToken, autorizarRoles('Tecnico'), async (req, res) => {
    console.log('Datos recibidos:', req.body);

    const {codigo_solicitud, estado_solicitud, id_historial_cambioestado, motivo_norealizacion, comentario_trabajo_norealizado} = req.body;

    try {
        const result = await pool.query(`
            INSERT INTO solicitud_no_realizada (
                codigo_solicitud,
                estado_solicitud,
                id_historial_cambioestado,
                motivo_norealizacion,
                comentario_trabajo_norealizado
            ) VALUES ($1, $2, $3, $4, $5)
            RETURNING id_soli_norealizada;
        `, [codigo_solicitud, estado_solicitud, id_historial_cambioestado, motivo_norealizacion, comentario_trabajo_norealizado]);

        const id_soli_norealizada = result.rows[0].id_soli_norealizada;

        // Insertar notificación
        await pool.query(`
            INSERT INTO notificaciones (
                user_id,
                tipo,
                entidad,
                entidad_id,
                mensaje,
                datos_extra
            ) VALUES ($1, $2, $3, $4, $5, $6);
        `, [
            req.user.id,
            'SOLICITUD_NO_REALIZADA',
            'solicitud_no_realizada',
            id_soli_norealizada,
            `Solicitud ${codigo_solicitud} marcada como no realizada por el técnico.`,
            JSON.stringify({ tecnico: req.user.usuario, motivo: motivo_norealizacion })
        ]);

        // Emitir notificación en tiempo real
        emitirNotificacion({
            mensaje: `Solicitud ${codigo_solicitud} marcada como no realizada.`,
            tipo: 'SOLICITUD_NO_REALIZADA',
            leida: false,
            fecha: new Date(),
            usuario: req.user.usuario,
            entidad_id: id_soli_norealizada
        });

        res.status(201).json({
            message: 'Datos guardados correctamente en solicitud_no_realizada',
            solicitud_no_realizada: result.rows[0]
        });

    } catch (error) {
        console.error('Error al guardar la solicitud no realizada:', error);
        res.status(500).json({ message: 'Error al guardar la solicitud no realizada.' });
    }
});






// Estadísticas para el dashboard del técnico
app.get('/api/soliasig/dashboard-tecnico', autenticarToken, async (req, res) => {
    const { codigo_trabajador } = req.user;
    
    try {
        // Contar solicitudes asignadas
        const asignadasQuery = await pool.query(`
            SELECT COUNT(*) FROM solicitudes
            WHERE codigo_trabajador = $1 
            AND estado_solicitud != 'Completado' 
            AND estado_solicitud != 'No Realizado'`,
            [codigo_trabajador]
        );

        // Contar solicitudes pendientes (estado_solicitud = 'Pendiente')
        const pendientesQuery = await pool.query(`
            SELECT COUNT(*) FROM solicitudes
            WHERE codigo_trabajador = $1 
            AND estado_solicitud = 'Pendiente'`,
            [codigo_trabajador]
        );

        // Contar solicitudes pendientes (estado_solicitud = 'Pendiente')
        const enprocesoQuery = await pool.query(`
            SELECT COUNT(*) FROM solicitudes
            WHERE codigo_trabajador = $1 
            AND estado_solicitud = 'En Proceso'`,
            [codigo_trabajador]
        );

        // Contar solicitudes completadas
        const completadasQuery = await pool.query(`
            SELECT COUNT(*) FROM solicitud_cerrada_completada sc
            JOIN solicitudes s ON s.codigo_solicitud = sc.codigo_solicitud
            WHERE s.codigo_trabajador = $1`,
            [codigo_trabajador]
        );

        // Contar solicitudes no realizadas
        const noRealizadasQuery = await pool.query(`
            SELECT COUNT(*) FROM solicitud_no_realizada sn
            JOIN solicitudes s ON s.codigo_solicitud = sn.codigo_solicitud
            WHERE s.codigo_trabajador = $1`,
            [codigo_trabajador]
        );

        res.json({
            asignadas: parseInt(asignadasQuery.rows[0].count),
            completadas: parseInt(completadasQuery.rows[0].count),
            pendientes: parseInt(pendientesQuery.rows[0].count),
            pendientes: parseInt(enprocesoQuery.rows[0].count),
            noRealizadas: parseInt(noRealizadasQuery.rows[0].count)
        });

    } catch (error) {
        console.error('Error en estadísticas de técnico:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});








app.listen(port, '0.0.0.0', () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

getLanguages();