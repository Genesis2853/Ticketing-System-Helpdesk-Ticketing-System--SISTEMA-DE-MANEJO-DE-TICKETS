let mantenimientoActivo = false;

export function activarMantenimiento() {
  mantenimientoActivo = true;
}

export function desactivarMantenimiento() {
  mantenimientoActivo = false;
}

export default function modoMantenimiento(req, res, next) {
  const enMantenimiento = process.env.MODO_MANTENIMIENTO === 'true';

  // Rutas que se permiten aún en mantenimiento (como activación/desactivación)
  const rutasPermitidas = [
    '/api/backups/activar-mantenimiento',
    '/api/backups/desactivar-mantenimiento',
    '/api/backups/restaurar',
  ];

  if (enMantenimiento && !rutasPermitidas.includes(req.path)) {
    if (req.user?.tipo_usuario === 'Admin') {
      return next();
    }
    return res.status(503).json({ message: 'Sistema en mantenimiento' });
  }

  next();
}

