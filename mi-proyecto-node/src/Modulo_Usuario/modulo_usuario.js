//import { pool } from "../bd/serverPGSQL.js";
import express from 'express';
import { Router } from "express";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import config from '../config.js';
import http from 'http';
import { corsOptions } from "../corsOptions.js";
// ⬇️ Aquí llamas al módulo WebSocket solo una vez
import { configurarSocket } from './socketio.js'; // usa la ruta correcta\src\Modulo_Usuario\socketio.js


import { getPool, crearPool } from "../db.js";



import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
console.log("__dirname:", __dirname);
console.log("✅ El script se ejecutó correctamente.");

dotenv.config();

const app = express();

const port = config.portUsuGestion || 3042;

app.use(express.json());
app.use(bodyParser.json());


crearPool();

app.use(corsOptions); 
const server = http.createServer(app);
const router = Router(); // Crear una instancia del enrutador
const JWT_SECRET = process.env.JWT_SECRET; // En producción, usar variable de entorno seguro
configurarSocket(server);

// Define tus rutas y tu lógica como normalmente
app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend funcionando!' });
});

// Funciones DB
async function crearUsuario({ usuario, contrasenaHash, tipo_usuario = 'tecnico', codigo_trabajador, permisos_usuarios }) {
  const pool = getPool();
  const permisosJson = Array.isArray(permisos_usuarios) ? JSON.stringify(permisos_usuarios) : null;
  
  const result = await pool.query(
      'INSERT INTO modulo_usuarios (usuario, contrasena_hash, tipo_usuario, codigo_trabajador, permisos_usuarios) VALUES ($1, $2, $3, $4, $5) RETURNING id_modulo_usuario, usuario, tipo_usuario, codigo_trabajador, permisos_usuarios, fecha_creacion_usuario',
      [usuario, contrasenaHash, tipo_usuario, codigo_trabajador || null, permisosJson]
    );
    return result.rows[0];
  }
  
async function buscarUsuarioPorUsername(usuario) {
  const pool = getPool();
    const result = await pool.query('SELECT * FROM modulo_usuarios WHERE usuario = $1', [usuario]);
    return result.rows[0];
}

  async function obtenerTodosLosUsuarios() {
     try {
      const pool = getPool();
       const result = await pool.query('SELECT id_modulo_usuario, usuario, tipo_usuario, codigo_trabajador, permisos_usuarios, fecha_creacion_usuario FROM modulo_usuarios');
       return result.rows; // Asegúrate de que id_modulo_usuario esté presente
     } catch (error) {
       console.error('Error al obtener usuarios:', error);
       throw new Error('Error al obtener usuarios');
     }
   }

// Registro
app.post('/api/autentica/registro', async (req, res) => {
    try {
        const { usuario, contrasena_hash, tipo_usuario, codigo_trabajador, permisos_usuarios } = req.body;

        if (!usuario || !contrasena_hash) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const usuarioExistente = await buscarUsuarioPorUsername(usuario);

        if (usuarioExistente) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const contrasenaHash = await bcrypt.hash(contrasena_hash, 10);

        const nuevoUsuario = await crearUsuario({ usuario, contrasenaHash, tipo_usuario: tipo_usuario || 'tecnico', codigo_trabajador, permisos_usuarios: permisos_usuarios || 'null' });

        const token = jwt.sign(
            { id: nuevoUsuario.id_modulo_usuario, usuario: nuevoUsuario.usuario, tipo_usuario: nuevoUsuario.tipo_usuario, codigo_trabajador: nuevoUsuario.codigo_trabajador, permisos_usuarios: nuevoUsuario.permisos_usuarios },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({ token, usuario: nuevoUsuario.usuario, tipo_usuario: nuevoUsuario.tipo_usuario, codigo_trabajador: nuevoUsuario.codigo_trabajador, permisos_usuarios: nuevoUsuario.permisos_usuarios });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error de servidor' });
    }
});

// Login
app.post('/api/autentica/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        if (!usuario || !contrasena) {
            return res.status(400).json({ message: 'Faltan datos obligatorios' });
        }

        const usuarioU = await buscarUsuarioPorUsername(usuario);

        if (!usuarioU) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const esPasswordValido = await bcrypt.compare(contrasena, usuarioU.contrasena_hash);

        if (!esPasswordValido) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { id: usuarioU.id_modulo_usuario, usuario: usuarioU.usuario, tipo_usuario: usuarioU.tipo_usuario, codigo_trabajador: usuarioU.codigo_trabajador, permisos_usuarios: usuarioU.permisos_usuarios },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, usuario: usuarioU.usuario, tipo_usuario: usuarioU.tipo_usuario });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error de servidor' });
    }
});

// Middleware para proteger rutas y obtener info de usuario
export function autenticarToken(req, res, next) {
    const autenHeader = req.headers['authorization'];
    const token = autenHeader && autenHeader.split(' ')[1]; // Bearer token

    if (!token) return res.status(401).json({ message: 'Token requerido' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Token inválido' });
        req.user = user;
        next();
    });

    console.log('Token recibido:', token);
    console.log('Usuario verificado:', req.user);
}

// Middleware para autorizar roles
export function autorizarRoles(...rolesPermitidos) {
    return (req, res, next) => {
        console.log('Tipo de usuario:', req.user.tipo_usuario);
        if (!req.user) return res.status(401).json({ message: 'No autenticado' });
        if (!rolesPermitidos.includes(req.user.tipo_usuario)) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        next();
    };
}

// Middleware para autorización por permisos (sólo para moderador)
export function autorizarPorPermiso(permisoRequerido) {
    return (req, res, next) => {
        console.log('Permisos del usuario:', req.user.permisos_usuarios);
        if (!req.user) {
            return res.status(401).json({ message: 'Usuario no autenticado' });
        }
        const rolUsuario = req.user.tipo_usuario;
        if (rolUsuario === 'Moderador') {
            let permisos_usuarios = req.user.permisos_usuarios;
            if (typeof permisos_usuarios === 'string') {
                try {
                    permisos_usuarios = JSON.parse(permisos_usuarios);
                } catch (e) {
                    return res.status(500).json({ message: 'Error leyendo permisos' });
                }
            }
            if (!Array.isArray(permisos_usuarios) || !permisos_usuarios.includes(permisoRequerido)) {
                return res.status(403).json({ message: 'Permiso denegado para esta acción' });
            }
        }
        next();
    };
}

async function actualizarUsuario(id, campos) {
  try {
    const pool = getPool();
    let permisosJson = null;
    if (campos.permisos_usuarios) {
      permisosJson = Array.isArray(campos.permisos_usuarios) ? JSON.stringify(campos.permisos_usuarios) : campos.permisos_usuarios;
    }

    const result = await pool.query(
      `UPDATE modulo_usuarios SET usuario = $1, tipo_usuario = $2, codigo_trabajador = $3, permisos_usuarios = $4, contrasena_hash = COALESCE($5, contrasena_hash) WHERE id_modulo_usuario = $6 RETURNING *`,
      [
        campos.usuario,
        campos.tipo_usuario,
        campos.codigo_trabajador || null,
        permisosJson,
        campos.contrasena_hash || null,
        id
      ]
    );
    return result.rows[0];
  } catch (error) {
    console.error("Error en actualizarUsuario:", error);
    throw error;
  }
}

async function eliminarUsuario(id) {
  try {
    const pool = getPool();
    // Primero obtenemos el usuario para verificar si es Admin
    const result = await pool.query(
      'SELECT tipo_usuario FROM modulo_usuarios WHERE id_modulo_usuario = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }

    const tipo = result.rows[0].tipo_usuario;
    if (tipo === 'Admin') {
      throw new Error('No se puede eliminar un usuario tipo Admin');
    }

    // Luego eliminamos
    await pool.query('DELETE FROM modulo_usuarios WHERE id_modulo_usuario = $1', [id]);
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    throw error;
  }
}




// Rutas para técnicos
app.get('/api/tecnico/dashboard', autenticarToken, autorizarRoles('Tecnico'), (req, res) => {
    res.json({ message: 'Bienvenido al panel del técnico', user: req.user });
});

// Rutas para moderadores
app.get('/api/moderador/dashboard', autenticarToken, autorizarRoles('Moderador'), (req, res) => {
    res.json({ message: 'Bienvenido al panel del moderador', user: req.user });
});

// Rutas para administradores
app.get('/api/admin/dashboard', autenticarToken, autorizarRoles('Admin'), (req, res) => {
    res.json({ message: 'Bienvenido al panel de administración', user: req.user });
});

// Middleware para autorizar admin
function authorizeAdmin(req, res, next) {
    if (req.user && req.user.tipo_usuario === 'Admin') {
        next(); // es admin, puede continuar
    } else {
        res.status(403).json({ message: 'No autorizado: solo administradores' });
    }
}

app.use('/api/autentica', router);

// Rutas protegidas
router.get('/usuariosobtener', autenticarToken, authorizeAdmin, async (req, res) => {
    const usuarios = await obtenerTodosLosUsuarios();
    res.json(usuarios);
});

router.post('/usuarioscrear', autenticarToken, authorizeAdmin, async (req, res) => {
    const nuevoUsuario = await crearUsuario(req.body);
    res.status(201).json(nuevoUsuario);
});

router.put('/usuariosobtener/:id', autenticarToken, authorizeAdmin, async (req, res) => {
  const { id } = req.params;
  const { usuario, tipo_usuario, codigo_trabajador, permisos_usuarios, contrasena_hash } = req.body;

  try {
    const updateFields = { usuario, tipo_usuario, codigo_trabajador, permisos_usuarios };

    if (contrasena_hash && contrasena_hash.trim() !== '') {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(contrasena_hash, saltRounds);
      updateFields.contrasena_hash = hashedPassword;
    }

    const updatedUser = await actualizarUsuario(id, updateFields);

    // No enviar la contraseña en la respuesta
    delete updatedUser.contrasena_hash;

    res.json(updatedUser);
  } catch (err) {
    console.error('Error al actualizar usuario:', err);
    res.status(500).json({ message: 'Error al actualizar usuario' });
  }
});



router.delete('/usuariosobtener/:id', autenticarToken, authorizeAdmin, async (req, res) => {
    const { id } = req.params; // <-- Cambio aquí
    try {
        await eliminarUsuario(id);
        res.json({ message: 'Usuario eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
});


if (process.argv[1] === __filename) {
  server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor backend iniciado en http://localhost:${port}`);
});

}


app.get('/api/autentica/notificaciones/:id', autenticarToken, async (req, res) => {
  const { id } = req.params;
const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT id, user_id, tipo, entidad, entidad_id, mensaje, datos_extra, leida, fecha
       FROM notificaciones
       WHERE user_id = $1
          OR EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(destinatarios) elem
            WHERE elem = $1::text
          )
       ORDER BY fecha DESC;`,
      [id]
    );

    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error obteniendo notificaciones:', error);
    res.status(500).json({ message: 'Error obteniendo notificaciones' });
  }
});




app.put('/api/autentica/notificaciones/marcar-leidas/:id', async (req, res) => {
  const pool = getPool();
  try {
    await pool.query(
      `UPDATE notificaciones SET leida = true WHERE user_id = $1 AND leida = false`,
      [req.params.id]
    );
    res.json({ message: 'Notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error marcando como leídas:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
});
