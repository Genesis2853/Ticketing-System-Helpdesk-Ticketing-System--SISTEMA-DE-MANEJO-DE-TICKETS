// routes/backups.js
import express  from 'express';
import multer   from 'multer';
import fs       from 'fs';
import path     from 'path';
import { exec } from 'child_process';
import unzipper from 'unzipper';
import archiver from 'archiver';          // 👈 importa aquí, sin await
import { fileURLToPath } from 'url';
import modoMantenimiento, { activarMantenimiento, desactivarMantenimiento } from './modoMantenimiento.js';
import { autenticarToken, autorizarRoles, autorizarPorPermiso } from "./Modulo_Usuario/modulo_usuario.js";
import pkg from 'pg';
const { Pool, Client } = pkg;
import { reiniciarPool, getPool } from './db.js';  // ajusta la ruta si es necesario




// Pool normal para app, conectado a bd_soportetecnico
const poolApp = new Pool({
  user: 'soporte',
  password: '1859',
  host: 'localhost',
  database: 'bd_soportetecnico',
  port: 5432,
});

// Cliente para administración, conectado a base 'postgres'
const clientAdmin = new Client({
  user: 'soporte',
  password: '1859',
  host: 'localhost',
  database: 'postgres', // base administrativa
  port: 5432,
});

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const carpetaBackups = path.join(__dirname, '..', 'backups');



// ---------- Multer ----------
const storage = multer.diskStorage({
  destination: carpetaBackups,
  filename: (req, file, cb) => cb(null, file.originalname),
});
const upload = multer({ storage });

// ---------- GET /api/backups ----------
router.get('/', (req, res) => {
  if (!fs.existsSync(carpetaBackups)) fs.mkdirSync(carpetaBackups);
  const archivos = fs.readdirSync(carpetaBackups).filter(f => f.endsWith('.zip'));
  res.json(archivos);
});

// ---------- POST /api/backups (crear) ----------
// ---------- POST /api/backups (crear) ----------
router.post('/', (req, res) => {
  const fecha     = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreSQL = `backup_${fecha}.sql`;
  const rutaSQL   = path.join(carpetaBackups, nombreSQL);
  const zipPath   = path.join(carpetaBackups, `backup_${fecha}.zip`);

  const user     = 'soporte';
  const password = '1859';
  const db       = 'bd_soportetecnico';
  const host     = 'localhost';
  const port     = 5432;

  const comando =
    `SET PGPASSWORD=${password}&& pg_dump -U ${user} -h ${host} -p ${port} -F p -f "${rutaSQL}" ${db}`;

  exec(comando, (error, stdout, stderr) => {
    if (error) {
      console.error('Error al ejecutar pg_dump:', error);
      console.error('stderr:', stderr);
      return res.status(500).send('Error creando backup');
    }

    const output  = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      fs.unlinkSync(rutaSQL);          // borrar .sql temporal
      res.send('Backup creado');
    });

    archive.pipe(output);
    archive.file(rutaSQL, { name: nombreSQL });
    archive.finalize();
  });
});


// ---------- POST /api/backups/upload ----------
router.post('/upload', upload.single('backup'), (req, res) => {
  res.send('Backup subido');
});

// ---------- POST /api/backups/:file/restore ----------
// ---------- POST /api/backups/:file/restore ----------
router.post('/:file/restore', async (req, res) => {
  const nombreZip = req.params.file;
  const rutaZip = path.join(carpetaBackups, nombreZip);
  const tmp = path.join(carpetaBackups, 'tmp_restore');

  if (!fs.existsSync(rutaZip)) return res.status(404).send('Archivo no encontrado');

  console.log(`📦 Restaurando backup desde: ${nombreZip}`);

  try {
    // Descomprimir ZIP
    await fs.createReadStream(rutaZip)
      .pipe(unzipper.Extract({ path: tmp }))
      .promise();
  } catch (err) {
    console.error('❌ Error descomprimiendo ZIP:', err);
    return res.status(500).send('Error descomprimiendo ZIP');
  }

  const archivoSQL = fs.readdirSync(tmp).find(f => f.endsWith('.sql'));
  if (!archivoSQL) {
    fs.rmSync(tmp, { recursive: true, force: true });
    return res.status(400).send('El zip no contiene un archivo .sql');
  }

  const rutaSQL = path.join(tmp, archivoSQL);

  const user = 'soporte';
  const password = '1859';
  const db = 'bd_soportetecnico';
  const host = 'localhost';
  const port = 5432;

  const execAsync = (cmd) =>
    new Promise((resolve, reject) => {
      console.log(`📣 Ejecutando: ${cmd}`);
      exec(cmd, (err, stdout, stderr) => {
        if (stdout) console.log('📤 STDOUT:', stdout);
        if (stderr) console.error('📥 STDERR:', stderr);
        if (err) return reject(err);
        resolve();
      });
    });

  try {
    // 🛑 TERMINAR CONEXIONES ACTIVAS
    await clientAdmin.connect();
    console.log('🔌 Terminando sesiones activas...');
    await clientAdmin.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `, [db]);
    await clientAdmin.end();

    // 🚫 DROP
    console.log(`🚫 Eliminando base de datos "${db}"...`);
    await execAsync(`SET PGPASSWORD=${password}&& dropdb -U ${user} -h ${host} -p ${port} ${db}`);

    // 🆕 CREATE
    console.log(`🆕 Creando base de datos "${db}"...`);
    await execAsync(`SET PGPASSWORD=${password}&& createdb -U ${user} -h ${host} -p ${port} ${db}`);

    // 🔁 RESTAURAR
    console.log(`🔁 Restaurando backup en "${db}"...`);
    await execAsync(`SET PGPASSWORD=${password}&& psql -U ${user} -h ${host} -p ${port} -d ${db} -f "${rutaSQL}"`);

await reiniciarPool();

try {
  const pool = getPool();
  await pool.query('SELECT 1'); // validación
  console.log('✅ Conexión validada tras restaurar');
} catch (err) {
  console.error('❌ Falló validación tras reiniciar pool:', err.message);
}
console.log('✅ Backup restaurado correctamente');
res.send('✅ Backup restaurado correctamente');




  } catch (e) {
    console.error('❌ Error durante la restauración:', e.message || e);
    res.status(500).send('❌ Error al restaurar backup');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});





let ultimoBackupTimestamp = Date.now();

function crearBackupAutomatico() {
  const fecha     = new Date().toISOString().replace(/[:.]/g, '-');
  const nombreSQL = `backup_auto_${fecha}.sql`;
  const rutaSQL   = path.join(carpetaBackups, nombreSQL);
  const zipPath   = path.join(carpetaBackups, `backup_auto_${fecha}.zip`);

  const user     = 'soporte';
  const password = '1859';
  const db       = 'bd_soportetecnico';
  const host     = 'localhost';
  const port     = 5432;

  const comando =
    `SET PGPASSWORD=${password}&& pg_dump -U ${user} -h ${host} -p ${port} -F p -f "${rutaSQL}" ${db}`;

  exec(comando, (error, stdout, stderr) => {
    if (error) {
      console.error('Error al ejecutar pg_dump automático:', error);
      console.error('stderr:', stderr);
      return;
    }

    const output  = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      fs.unlinkSync(rutaSQL);
      ultimoBackupTimestamp = Date.now();  // <----- Actualizamos timestamp aquí
      console.log(`Backup automático creado: ${zipPath}`);
    });

    archive.pipe(output);
    archive.file(rutaSQL, { name: nombreSQL });
    archive.finalize();
  });
}

// Intervalo en ms para backups
const intervaloBackupMs = 24 * 60 * 60 * 1000;

setInterval(crearBackupAutomatico, intervaloBackupMs);
//crearBackupAutomatico();



router.get('/tiempo-restante', (req, res) => {
  const ahora = Date.now();
  const tiempoTranscurrido = ahora - ultimoBackupTimestamp;
  let tiempoRestante = intervaloBackupMs - tiempoTranscurrido;
  if (tiempoRestante < 0) tiempoRestante = 0;

  res.json({ tiempoRestante }); // tiempo en ms
});



router.post('/activar-mantenimiento', autenticarToken, autorizarRoles('Admin'), (req, res) => {
  if (req.user?.tipo_usuario !== 'Admin') return res.sendStatus(403);
  activarMantenimiento();
  res.json({ ok: true, message: 'Modo mantenimiento activado' });
});

router.post('/desactivar-mantenimiento', autenticarToken, autorizarRoles('Admin'), (req, res) => {
  if (req.user?.tipo_usuario !== 'Admin') return res.sendStatus(403);
  desactivarMantenimiento();
  res.json({ ok: true, message: 'Modo mantenimiento desactivado' });
});

export default router;
