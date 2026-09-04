import React, { useState, useEffect } from 'react';
import DistribucionMotivoFalla from '../apartadoestadisticayresolusion/DistribucionMotivoFalla';
import ReporteEstadistico from '../Modulo_Tecnico/paginaSecundarias/Generacion_Reporte/GenerarReporte_Estadistico';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import ComparativaTiemposChart from '../apartadoestadisticayresolusion/ComparativaTiemposChart';
import { Modal, Button, Table } from '@mui/material';
import { pdf } from '@react-pdf/renderer';
import './SistemaReso.css';
import './DatosEsatadisticos.css';
import { 

 
  TableHead, 
  TableBody, 
  TableRow, 
  TableCell, 
  Paper,
  Box,
  Typography,
  Container,
  useTheme,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ConstructionIcon from '@mui/icons-material/Construction';
import PersonIcon from '@mui/icons-material/Person';

// Convierte minutos a horas, minutos y segundos
const convertirMinutosAHMS = (minutos) => {
  const totalSegundos = minutos * 60;
  const horas = Math.floor(totalSegundos / 3600);
  const restoSegundos = totalSegundos % 3600;
  const minutosRestantes = Math.floor(restoSegundos / 60);
  const segundos = Math.round(restoSegundos % 60);  // <-- aquí redondeo
  return { horas, minutos: minutosRestantes, segundos };
};


// Calcula promedio por técnico y devuelve el código de trabajador
const calcularPromedioPorTecnicoCompleto = (tecnicos, solicitudes) => {
  const tiemposPorTecnico = {};
  
  // Inicializar técnicos
  tecnicos.forEach(({ codigo_trabajador, nombre_tecnico, apellido_tecnico }) => {
    const clave = `${nombre_tecnico} ${apellido_tecnico}`;
    tiemposPorTecnico[clave] = { totalTiempo: 0, cantidad: 0, codigo_trabajador, solicitudes: [] };
  });

  // Acumular tiempos y solicitudes
  solicitudes.forEach(({ nombre_tecnico, apellido_tecnico, tiempo_invertido, ...rest }) => {
    const clave = `${nombre_tecnico} ${apellido_tecnico}`;
    if (tiemposPorTecnico[clave]) {
      tiemposPorTecnico[clave].totalTiempo += tiempo_invertido; // Asegúrate de que tiempo_invertido esté en minutos
      tiemposPorTecnico[clave].cantidad += 1;
      tiemposPorTecnico[clave].solicitudes.push({ ...rest, tiempo_invertido }); // Agregar la solicitud
    }
  });

  // Calcular promedios
  const promedios = [];
  for (const tecnico in tiemposPorTecnico) {
    const datos = tiemposPorTecnico[tecnico];
    const promedio = datos.cantidad > 0 ? datos.totalTiempo / datos.cantidad : 0;
    promedios.push({ tecnico, promedio, codigo_trabajador: datos.codigo_trabajador, solicitudes: datos.solicitudes });
  }
  return promedios;
};


const PromediosPorTecnico = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [promedios, setPromedios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [verPreview, setVerPreview] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [solicitudesDelTecnico, setSolicitudesDelTecnico] = useState([]);


  const theme = useTheme();
  useEffect(() => {
    const fetchDatos = async () => {
      setLoading(true);
      setError(null);
      try {
        const [respSolicitudes, respTecnicos] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL_SISTEMARESOLU}/api/sistemaresolucion/solicitudes_completadas`),
          fetch(`${process.env.REACT_APP_API_URL_SISTEMARESOLU}/api/sistemaresolucion/tecnicos`),
        ]);

        if (!respSolicitudes.ok) throw new Error(`Error solicitudes: ${respSolicitudes.statusText}`);
        if (!respTecnicos.ok) throw new Error(`Error técnicos: ${respTecnicos.statusText}`);

        const dataSolicitudes = await respSolicitudes.json();
        const dataTecnicos = await respTecnicos.json();

        setSolicitudes(dataSolicitudes);
        setTecnicos(dataTecnicos);
      } catch (err) {
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  useEffect(() => {
    if (solicitudes.length > 0 && tecnicos.length > 0) {
      const promediosCalculados = calcularPromedioPorTecnicoCompleto(tecnicos, solicitudes);
      setPromedios(promediosCalculados);
      console.log('Promedios calculados:', promediosCalculados);
    }
  }, [solicitudes, tecnicos]);

  // Filtra solicitudes del técnico seleccionado
  const handleOpenModal = (tecnico) => {
    const solicitudesFiltradas = solicitudes.filter(({ nombre_tecnico, apellido_tecnico }) => 
      tecnico === `${nombre_tecnico} ${apellido_tecnico}`
    );
    setSolicitudesDelTecnico(solicitudesFiltradas);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSolicitudesDelTecnico([]);
  };

  const handleAbrirVistaPrevia = async () => {
  const blob = await pdf(<ReporteEstadistico datos={{ tecnicos: promedios }} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};





  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      {promedios.length > 0 && (
  <PDFDownloadLink
    document={<ReporteEstadistico datos={{ tecnicos: promedios }} />}
    fileName="reporte_promedios_tecnicos.pdf"
    style={{
      padding: 10,
      backgroundColor: '#1976d2',
      color: '#fff',
      textDecoration: 'none',
      borderRadius: 4,
      display: 'inline-block',
      marginBottom: 20
    }}
  >
    {({ loading }) => loading ? 'Generando PDF...' : '📄 Descargar Reporte'}
  </PDFDownloadLink>
)}


<button
  onClick={handleAbrirVistaPrevia}
  style={{
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '12px 16px', // aumenté el padding vertical de 8px a 12px
    
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#115293')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
>
  👁️ Ver Vista Previa
</button>


      {verPreview && (
        <PDFViewer style={{ width: '100%', height: '600px', marginTop: 20 }}>
          <ReporteEstadistico datos={{ tecnicos: promedios }} />
        </PDFViewer>
      )}

      <h2>Promedio de Tiempo por Técnico</h2>

      {loading && <p>Cargando datos...</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {!loading && !error && (
        <>
          <Table style={{ width: '100%', marginBottom: 30 }}>
            <thead>
              <tr style={{ backgroundColor: '#222', color: '#fff' }}>
                <th style={{ padding: '12px', border: '1px solid #ddd', cursor: 'pointer' }}>Técnico</th>
                <th style={{ padding: '12px', border: '1px solid #ddd' }}>Promedio (H:M:S)</th>
              </tr>
            </thead>
            <tbody>
              {promedios.length > 0 ? promedios.map(({ tecnico, promedio, codigo_trabajador }) => {
                const { horas, minutos, segundos } = convertirMinutosAHMS(promedio);
                return (
                  <tr 
                    key={codigo_trabajador} 
                    style={{ borderBottom: '1px solid #ccc', cursor: 'pointer' }}
                    onClick={() => handleOpenModal(tecnico)}
                  >
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{tecnico}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{`${horas}h ${minutos}m ${segundos}s`}</td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="2" style={{ padding: '10px', textAlign: 'center' }}>No hay datos disponibles</td></tr>
              )}
            </tbody>
          </Table>

         


<Modal
  open={modalOpen}
  onClose={handleCloseModal}
  aria-labelledby="detalles-tecnico-modal"
  sx={{ 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(3px)'
  }}
>
  <Container maxWidth="md" sx={{ outline: 'none' }}>
    <Paper 
      elevation={10}
      sx={{ 
        p: 3,
        borderRadius: 2,
        maxHeight: '80vh',
        overflow: 'auto',
        position: 'relative'
      }}
    >
      <IconButton
        onClick={handleCloseModal}
        sx={{
          position: 'absolute',
          right: 16,
          top: 16,
          color: theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box 
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          mb: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: 2
        }}
      >
        <PersonIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
        <div>
          <Typography variant="h5" component="h2">
            Detalles del Técnico
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Solicitudes completadas
          </Typography>
        </div>
      </Box>

      {solicitudesDelTecnico.length > 0 ? (
        <Table 
          size="medium" 
          sx={{ 
            '& .MuiTableCell-root': {
              py: 1.5
            }
          }}
        >
          <TableHead>
            <TableRow sx={{ bgcolor: theme.palette.grey[200] }}>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <Box display="flex" alignItems="center">
                  <ConstructionIcon color="primary" sx={{ mr: 1 }} />
                  Motivo de Visita
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                Falla Encontrada
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <Box display="flex" alignItems="center">
                  <AccessTimeIcon color="primary" sx={{ mr: 1 }} />
                  Tiempo Invertido
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {solicitudesDelTecnico.map(({ motivo_visita, tipo_solucion_falla, tiempo_invertido }, idx) => {
              const { horas, minutos, segundos } = convertirMinutosAHMS(tiempo_invertido);
              return (
                <TableRow
                  key={idx}
                  hover
                  sx={{
                    '&:nth-of-type(odd)': {
                      backgroundColor: theme.palette.action.hover,
                    },
                    '&:last-child td': {
                      borderBottom: 0
                    }
                  }}
                >
                  <TableCell>{motivo_visita || 'Sin motivo registrado'}</TableCell>
                  <TableCell>{tipo_solucion_falla || 'Sin falla registrada'}</TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      {horas}h {minutos}m {segundos}s
                    </Box>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      ) : (
        <Box 
          textAlign="center" 
          p={4} 
          sx={{ 
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1
          }}
        >
          <Typography variant="body1" color="text.secondary">
            No hay solicitudes completadas para este técnico
          </Typography>
        </Box>
      )}

      <Box mt={3} textAlign="right">
        <Button 
          onClick={handleCloseModal}
          variant="contained"
          color="primary"
          size="large"
          startIcon={<CloseIcon />}
          sx={{
            px: 4,
            borderRadius: 2,
            textTransform: 'none',
            boxShadow: theme.shadows[2]
          }}
        >
          Cerrar
        </Button>
      </Box>
    </Paper>
  </Container>
</Modal>

        </>
      )}

      <DistribucionMotivoFalla />
      <ComparativaTiemposChart />
    </div>
  );
};

export default PromediosPorTecnico;
