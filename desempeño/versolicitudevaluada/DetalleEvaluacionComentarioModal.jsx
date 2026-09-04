import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import ReporteEvaluacionIndividual from './ReporteEvaluacionIndividual';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

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

const DetalleEvaluacionComentarioModal = ({ evaluacion, open, onClose }) => {
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
    id_soli_norealizada, comentario_trabajo_norealizado, motivo_norealizacion, fecha_cierre_norealizado,
        id_soli_cerrada, motivo_cierre, comentarios_tecnico,  fecha_cierre,
    // Datos de evaluación
    comentario,
        fecha_comentario,
  } = evaluacion;

  const handlePreview = async () => {
    const blob = await pdf(<ReporteEvaluacionIndividual evaluacion={evaluacion} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };



  return (
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
        <div className="detalle-solicitudComplTec-conteinerr">
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
{(evaluacion.estado_solicitud === 'Cerrado' || evaluacion.estado_solicitud === 'No Realizado') && (
  <div className='datos-cierre-tec-conteiner'>
    <section className='datos-cierre-tec-card'>
      <h2 className='datos-cierre-tec-titulo'>Detalles de Cierre Técnico</h2>
      <div className='datos-cierre-tec-parrafo'>
        {estado_solicitud === 'Cerrado' ? (
          <>
            <p><strong>Comentarios:</strong> {comentarios_tecnico || 'Sin comentarios'}</p>
            <p><strong>Motivo:</strong> {motivo_cierre}</p>
            <p><strong>Fecha Cierre:</strong> {new Date(fecha_cierre).toLocaleDateString()}</p>
          </>
        ) : (
          <>
            <p><strong>Comentarios:</strong> {comentario_trabajo_norealizado || 'Sin comentarios'}</p>
            <p><strong>Motivo:</strong> {motivo_norealizacion}</p>
            <p>
  <strong>Fecha Cierre:</strong>{' '}
  {fecha_cierre_norealizado
    ? new Date(fecha_cierre_norealizado).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin fecha'}
</p>


          </>
        )}
      </div>
    </section>
  </div>
)}

        {/* Sección: Evaluación Técnica */}
        <div className='datos-evaluacion-conteiner'>
          <section className='datos-evaluacion-card'>
            <h2 className='datos-evaluacion-titulo'>Evaluación Técnica</h2>
            <div className='datos-evaluacion-parrafo'>
              <p><span className="negrita">Comentario:</span> {comentario || 'No evaluado'}</p>
                          <p>
  <strong>Fecha Cierre:</strong>{' '}
  {fecha_cierre_norealizado
    ? new Date(fecha_comentario).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Sin fecha'}
</p>
            </div>
          </section>
        </div>

        
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cerrar</Button>

        {/* ✅ Botón de Previsualización */}
        <Button variant="outlined" color="primary" onClick={handlePreview}>
          Previsualizar PDF
        </Button>

        {/* ✅ Botón de descarga PDF */}
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
  );
};

export default DetalleEvaluacionComentarioModal;
