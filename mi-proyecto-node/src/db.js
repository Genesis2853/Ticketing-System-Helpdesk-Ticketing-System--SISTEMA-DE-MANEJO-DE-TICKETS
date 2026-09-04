// db.js
import pg from 'pg';
const { Pool } = pg;

let pool = null;

function crearPool() {
  pool = new Pool({
    user: 'soporte',
    host: 'localhost',
    database: 'bd_soportetecnico',
    password: '1859',
    port: 5432,
  });

  pool.on('error', (err) => {
    console.error('🔥 Error inesperado en el pool:', err);
  });

  return pool;
}

async function reiniciarPool() {
  if (pool) {
    await pool.end();
    console.log('♻️ Pool de conexiones cerrado');
  }
  pool = crearPool();
  console.log('✅ Pool reiniciado');
}

crearPool();

export function getPool() {
  return pool;
}

export { reiniciarPool, crearPool };
