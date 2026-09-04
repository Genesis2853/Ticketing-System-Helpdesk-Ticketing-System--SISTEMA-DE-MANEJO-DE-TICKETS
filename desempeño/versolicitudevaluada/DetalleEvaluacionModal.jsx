import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { PDFDownloadLink } from '@react-pdf/renderer';
import ReporteEvaluacionIndividual from './ReporteEvaluacionIndividual';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { PDFViewer } from '@react-pdf/renderer';
import './reportedesempeno.css';

function formatTiempoInvertido(tiempo) {
  if (!tiempo || typeof tiempo !== 'object') return 'Tiempo no disponible';
  
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = tiempo;
  
  if (days > 0) {
    return `${days} día${days !== 1 ? 's' : ''}, ${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}` + (seconds > 0 ? `, ${seconds} segundo${seconds !== 1 ? 's' : ''}` : '');
  }
  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
}

const DetalleEvaluacionModal = ({ evaluacion, open, onClose }) => {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm')); // <600px (celulares)
  const { 
    codigo_solicitud, 
    fecha_solicitud, 
    nombre_tecnico,
    apellido_tecnico, 
    codigo_ticket, 
    motivo_visita, 
    descripcion_servicio, 
    estado_solicitud, 
    prioridad_solicitud, 
    tipo_solucion_falla, 
    comentario_trabajo_realizado, 
    herramientas_utilizadas, 
    tiempo_invertido, 
    fecha_caso_cerrado,
    // Datos de evaluación
    puntuacion_tecnico,
    comentario_puntuacion_tecnico,
    calificacion_cliente,
    comentarios_cliente
  } = evaluacion;

  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <>
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}  // aquí activas pantalla completa en móvil
    >
      
      <DialogTitle>
        Detalles de Evaluación - Solicitud #{codigo_ticket}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Sección: Datos de la solicitud */}
  <div className="detalle-solicitudComplTec-container">
    <div className="detalle-solicitudComplTec-card">
      
      <div className="detalle-solicitudComplTec-header">
        <p><span className="negrita">ID:</span> {codigo_ticket}</p>
        <p><span className="negrita">Fecha Creación:</span> {new Date(fecha_solicitud).toLocaleDateString()}</p>
      </div>
      
      <h3 className="detalle-solicitudComplTec-title">Datos de la Solicitud</h3>
      
      <div className="detalle-solicitudComplTec-body">
        <p className='p-mui-eva'><span className="negrita">Técnico:</span> {nombre_tecnico} {apellido_tecnico}</p>
        <p className='p-mui-eva'><span className="negrita">Cliente:</span> {evaluacion.nombre_cliente} {evaluacion.apellido_cliente}</p>
        <p className='p-mui-eva'><span className="negrita">Motivo Visita:</span> {motivo_visita}</p>
        <p className='p-mui-eva'><span className="negrita">Estado:</span> {estado_solicitud}</p>
        <p className='p-mui-eva'><span className="negrita">Prioridad:</span> {prioridad_solicitud}</p>
        <p className='p-mui-eva'><span className="negrita">Descripción:</span></p>
        <p className="detalle-solicitudComplTec-descripcion">{descripcion_servicio}</p>
      </div>
    </div>
  </div>

        {/* Sección: Datos de cierre técnico */}
        <div className='datos-cierre-tec-conteiner'>
          <section className='datos-cierre-tec-card'>
            <h2 className='datos-cierre-tec-titulo'>Detalles de Cierre Técnico</h2>
            <div className='datos-cierre-tec-parrafo'>
              <p>Tipo Solución/Falla: {tipo_solucion_falla}</p>
              <p>Comentarios: {comentario_trabajo_realizado}</p>
              <p>Herramientas: {herramientas_utilizadas}</p>
              <p>Tiempo Invertido: {formatTiempoInvertido(tiempo_invertido)}</p>
              <p>Fecha Cierre: {new Date(fecha_caso_cerrado).toLocaleDateString()}</p>
            </div>
          </section>
        </div>

        {/* Sección: Evaluación Técnica */}
        <div className='datos-evaluacion-conteiner'>
          <section className='datos-evaluacion-card'>
            <h2 className='datos-evaluacion-titulo'>Evaluación Técnica</h2>
            <div className='datos-evaluacion-parrafo'>
              <p><span className="negrita">Puntuación:</span> {puntuacion_tecnico || 'No evaluado'}</p>
              <p><span className="negrita">Comentario:</span> {comentario_puntuacion_tecnico || 'Sin comentarios'}</p>
            </div>
          </section>
        </div>

        {/* Sección: Evaluación del Cliente */}
        <div className='datos-cliente-conteiner'>
          <section className='datos-cliente-card'>
            <h2 className='datos-cliente-titulo'>Evaluación del Cliente</h2>
            <div className='datos-cliente-parrafo'>
              <p><span className="negrita">Calificación:</span> {calificacion_cliente || 'No calificado'}</p>
              <p><span className="negrita">Comentarios:</span> {comentarios_cliente || 'Sin comentarios'}</p>
            </div>
          </section>
        </div>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>
        <Button 
        variant="outlined" 
        color="secondary" 
        onClick={() => setShowPreview(true)}
      >
        Previsualizar
      </Button>
        <PDFDownloadLink
          document={<ReporteEvaluacionIndividual evaluacion={evaluacion} />}
          fileName={`evaluacion_${codigo_solicitud}.pdf`}
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <Button variant="contained" color="primary" disabled={loading}>
              {loading ? 'Generando...' : 'Descargar Reporte'}
            </Button>
          )}
        </PDFDownloadLink>
      </DialogActions>
    </Dialog>
    <Dialog
  open={showPreview}
  onClose={() => setShowPreview(false)}
  fullWidth
  maxWidth="lg"
  fullScreen={useMediaQuery(theme.breakpoints.down('md'))} // pantalla completa en móvil y tablets
>
  <DialogTitle>
    Vista previa del reporte
  </DialogTitle>
  <DialogContent dividers style={{ height: '80vh', padding: 0 }}>
    <PDFViewer width="100%" height="100%">
      <ReporteEvaluacionIndividual evaluacion={evaluacion} />
    </PDFViewer>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setShowPreview(false)}>Cerrar vista previa</Button>
  </DialogActions>
</Dialog>
</>
  );
};

export default DetalleEvaluacionModal;
