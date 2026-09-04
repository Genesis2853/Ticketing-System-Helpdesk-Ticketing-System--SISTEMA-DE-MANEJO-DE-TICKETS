import express from 'express';


// tecnico.js

const router = express.Router();

const tecnicoPorPuerto = {
  3001: 'tecnicoA',
  3002: 'tecnicoB',
};

const filtrarSolicitudesPorTecnico = (req, res, next) => {
  const puerto = req.socket.localPort;
  const tecnico = tecnicoPorPuerto[puerto];
  if (!tecnico) return res.sendStatus(404);

  req.tecnico = tecnico;
  next();
};

router.get('/solicitudes', filtrarSolicitudesPorTecnico, (req, res) => {
  const tecnico = req.tecnico;
  Solicitudes.find({ asignadoA: tecnico }, (err, solicitudes) => {
    if (err) return res.sendStatus(500);
    res.json(solicitudes);
  });
});

export default router;