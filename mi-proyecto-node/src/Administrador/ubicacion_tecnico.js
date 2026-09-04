import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import config from '../config.js';
import { autenticarToken } from "../Modulo_Usuario/modulo_usuario.js";
import {emitirNotificacion} from '../Modulo_Usuario/socketio.js';
import { corsOptions } from "../corsOptions.js";



dotenv.config();

const app = express();
const port = config.portMapaTecnico || 3060;

import http from 'http';
const servidorHttp = http.createServer(app);

app.use(bodyParser.json());
app.use(corsOptions); 


import { Server } from 'socket.io';
const io = new Server(servidorHttp, {
  cors: { origin: '*' }
});

const mapaTecnicosConectados = {}; // clave: codigo_trabajador, valor: socket

io.on('connection', (socket) => {
  console.log('🔌 WebSocket conectado:', socket.id);
  

  socket.on('registrarTecnico', (codigo) => {
  socket.codigo_trabajador = codigo;

  // Si ya había un socket registrado para este técnico, lo reemplazamos
  const anterior = mapaTecnicosConectados[codigo];
  if (anterior && anterior.id !== socket.id) {
    anterior.disconnect(true); // cerramos el socket anterior
  }

  mapaTecnicosConectados[codigo] = socket;
  console.log(`🧑‍🔧 Técnico ${codigo} registrado con socket ${socket.id}`);
});


  socket.on('disconnect', () => {
  const codigo = socket.codigo_trabajador;

  if (codigo && mapaTecnicosConectados[codigo]?.id === socket.id) {
    delete mapaTecnicosConectados[codigo];
    console.log(`❌ Técnico ${codigo} desconectado (socket ${socket.id})`);
  } else {
    console.log(`⛔ Desconexión ignorada: no era el socket principal del técnico`);
  }
});


socket.on('ubicacion:solicitar', ({ codigo_trabajador }) => {
  const tecnicoSocket = mapaTecnicosConectados[codigo_trabajador];
  
  if (tecnicoSocket) {
    tecnicoSocket.emit('ubicacion:solicitar');
    console.log(`📡 Solicitando ubicación al técnico ${codigo_trabajador}`);
  } else {
    console.warn(`⚠️ El técnico ${codigo_trabajador} no está conectado`);
    socket.emit('ubicacion:error', {
      mensaje: `El técnico ${codigo_trabajador} no está disponible en este momento.`,
    });
  }
});


  socket.on('ubicacion:respuesta', async (data) => {
  const { codigo_trabajador, latitud, longitud } = data;

  try {
    await pool.query(`
      INSERT INTO ubicacion_tecnicos (codigo_trabajador, latitud, longitud, fecha_actualizacion)
      VALUES ($1, $2, $3, NOW())
    `, [codigo_trabajador, latitud, longitud]);

    console.log(`✅ Ubicación guardada para técnico ${codigo_trabajador}`);

    // Notificar al admin (puedes guardar quién la pidió, o emitir a todos si es sencillo)
    io.emit('ubicacion:confirmada', {
      codigo_trabajador,
      latitud,
      longitud,
      mensaje: `📍 Técnico ${codigo_trabajador} compartió ubicación correctamente.`
    });

  } catch (error) {
    console.error('❌ Error al guardar ubicación:', error);

    io.emit('ubicacion:error', {
      codigo_trabajador,
      mensaje: `❌ No se pudo guardar la ubicación del técnico ${codigo_trabajador}.`
    });
  }
});

});




// 📌 Ruta para que los técnicos envíen su ubicación al acceder a su cuenta
app.post('/api/mapa/ubicacion', autenticarToken, async (req, res) => {
  const { codigo_trabajador, latitud, longitud } = req.body;

  if (codigo_trabajador !== req.user.codigo_trabajador) {
    return res.status(403).json({ message: '❌ No autorizado' });
  }

  try {
    // 🆕 Insertar nueva ubicación sin importar si ya existe
    await pool.query(`
      INSERT INTO ubicacion_tecnicos (codigo_trabajador, latitud, longitud, fecha_actualizacion)
      VALUES ($1, $2, $3, NOW());
    `, [codigo_trabajador, latitud, longitud]);

    res.json({ message: '✅ Ubicación guardada correctamente' });
    
  } catch (error) {
    console.error('❌ Error guardando ubicación:', error);
    res.status(500).json({ message: '❌ Error guardando ubicación' });
  }
});


// 📌 Ruta para obtener ubicación de un técnico específico (para el administrador)
app.get('/api/mapa/ubicacion/:codigo_trabajador', autenticarToken, async (req, res) => {
  const { codigo_trabajador } = req.params;

  try {
    const result = await pool.query(
      `SELECT latitud, longitud FROM ubicacion_tecnicos WHERE codigo_trabajador = $1`,
      [codigo_trabajador]
    );

    if (result.rows.length > 0) {
      const ubicacion = result.rows[0];

      // 🗄️ Registrar notificación en BD
      await pool.query(
        `INSERT INTO notificaciones (
           user_id, tipo, entidad, entidad_id, mensaje, datos_extra
         ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          req.user.id,
          'CONSULTA_UBICACION',
          'ubicacion_tecnicos',
          codigo_trabajador,
          `Se consultó la ubicación del técnico ${codigo_trabajador}`,
          JSON.stringify({ consultadoPor: req.user.usuario })
        ]
      );

      // 📡 Emitir notificación en tiempo real
      emitirNotificacion({
        mensaje: `Se consultó la ubicación del técnico ${codigo_trabajador}`,
        tipo: 'CONSULTA_UBICACION',
        leida: false,
        fecha: new Date(),
        usuario: req.user.usuario
      });

      res.json(ubicacion);
    } else {
      res.status(404).json({ error: "Ubicación no encontrada." });
    }
  } catch (error) {
    console.error("❌ Error obteniendo ubicación:", error);
    res.status(500).json({ error: "Error obteniendo ubicación." });
  }
});

// 📌 Ruta para obtener lista de técnicos que han enviado ubicación
// 📌 Ruta para obtener lista de técnicos activos que han enviado ubicación
app.get('/api/mapa/tecnicos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT codigo_trabajador, nombre_tecnico, apellido_tecnico
      FROM tecnicos
      WHERE activo = $1
      ORDER BY fecha_creacion_tecnico DESC;
    `, [true]);

    console.log('📌 Técnicos activos encontrados:', result.rows); // Depuración
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error obteniendo técnicos activos:', error);
    res.status(500).send('❌ Error obteniendo técnicos activos');
  }
});


// Ruta para obtener el permiso de ubicación de un técnico
app.get('/api/mapa/tecnico/:codigo_trabajador', autenticarToken, async (req, res) => {
  const { codigo_trabajador } = req.params;

  try {
    const result = await pool.query(
      'SELECT permiso_ubicacion FROM tecnicos WHERE codigo_trabajador = $1',
      [codigo_trabajador]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Técnico no encontrado' });
    }

    res.json({ permiso_ubicacion: result.rows[0].permiso_ubicacion });
  } catch (err) {
    console.error('Error consultando permiso de ubicación:', err);
    res.status(500).json({ message: 'Error al consultar permiso' });
  }
});


app.get('/api/mapa/historial', async (req, res) => {
try {
            const result = await pool.query(`
            SELECT u.id, u.codigo_trabajador, u.latitud, u.longitud, u.fecha_actualizacion,
            t.codigo_trabajador, t.nombre_tecnico, t.apellido_tecnico
            FROM ubicacion_tecnicos u
            JOIN tecnicos t ON t.codigo_trabajador = u.codigo_trabajador;

        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tickets:', error);
        res.status(500).send('Error obteniendo tickets');
    }
});

// Ruta: PUT /api/tecnico/permisoubicacion
app.put('/api/mapa/tecnico/permisoubicacion', autenticarToken, async (req, res) => {
  const { codigo_trabajador, permiso_ubicacion } = req.body;

  try {
    await pool.query(
      'UPDATE tecnicos SET permiso_ubicacion = $1 WHERE codigo_trabajador = $2',
      [permiso_ubicacion, codigo_trabajador]
    );

    // Registrar notificación en la BD
    await pool.query(
      `INSERT INTO notificaciones (
         user_id, tipo, entidad, entidad_id, mensaje, datos_extra
       ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        req.user.id,
        'ACTUALIZAR_PERMISO_UBICACION',
        'tecnicos',
        codigo_trabajador,
        `Permiso de ubicación actualizado para técnico ${codigo_trabajador}: ${permiso_ubicacion}`,
        JSON.stringify({ actualizadoPor: req.user.usuario })
      ]
    );

    // Emitir notificación en tiempo real
    emitirNotificacion({
      mensaje: `Permiso de ubicación actualizado para técnico ${codigo_trabajador}: ${permiso_ubicacion}`,
      tipo: 'ACTUALIZAR_PERMISO_UBICACION',
      leida: false,
      fecha: new Date(),
      usuario: req.user.usuario
    });

    res.json({ message: 'Permiso de ubicación actualizado' });
  } catch (err) {
    console.error('Error actualizando permiso:', err);
    res.status(500).json({ message: 'Error al actualizar permiso' });
  }
});



// Ruta: GET /api/mapa/ubicacion/ultima/:codigo_trabajador
app.get('/api/mapa/ubicacion/ultima/:codigo_trabajador', autenticarToken, async (req, res) => {
  const { codigo_trabajador } = req.params;

  try {
    const result = await pool.query(`
      SELECT latitud, longitud, fecha_actualizacion
      FROM ubicacion_tecnicos
      WHERE codigo_trabajador = $1
      ORDER BY fecha_actualizacion DESC
      LIMIT 1
    `, [codigo_trabajador]);

    if (result.rows.length === 0) {
      return res.status(404).json({ mensaje: 'No se encontró ubicación para el técnico.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener la última ubicación:', error);
    res.status(500).json({ error: 'Error al obtener la última ubicación' });
  }
});




servidorHttp.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
});
