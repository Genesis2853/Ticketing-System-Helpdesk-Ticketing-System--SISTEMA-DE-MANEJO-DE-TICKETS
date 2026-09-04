import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFViewer,
  PDFDownloadLink,
  Image,
} from '@react-pdf/renderer';
import { useLocation, useNavigate } from 'react-router-dom';

import logo from './logo.png';

const primary = '#c62828';

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  image: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  box: {
    border: '1px solid #cccccc',
    borderRadius: 4,
    padding: 10,
    marginBottom: 12,
  },
  boxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: primary,
    marginBottom: 6,
    borderBottom: '1px solid #cccccc',
    paddingBottom: 4,
  },
  item: {
    fontSize: 11,
    marginVertical: 2,
  },
  documentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  column: {
    width: '48%',
    marginBottom: 6,
  },
});

const formatDate = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

function formatTiempoInvertido(tiempo) {
        if (!tiempo || typeof tiempo !== 'object') {
            return 'Tiempo no disponible';
        }
        const {
            days = 0,
            hours = 0,
            minutes = 0,
            seconds = 0,
        } = tiempo;
        // Mostrar solo hasta el nivel máximo significativo con formato legible:
        if (days > 0) {
            return `${days} día${days !== 1 ? 's' : ''}, ${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        if (hours > 0) {
            return `${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        if (minutes > 0) {
            return `${minutes} minuto${minutes !== 1 ? 's' : ''}` + (seconds > 0 ? `, ${seconds} segundo${seconds !== 1 ? 's' : ''}` : '');
        }
        // Si solo hay segundos
        return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
    }


const MyDocumentTec = ({ solicitud, user, evaluaciones }) => {
  const fechaDescarga = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View fixed style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #cccccc', paddingBottom: 10 }}>
          <Image src={logo} style={styles.image} />
          <Text style={{ ...styles.documentTitle, margin: 0, flex: 1, textAlign: 'center' }}>Reporte de Servicio</Text>
          <Text style={{ fontSize: 10, color: '#555' }}>Fecha: {fechaDescarga}</Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Estado: {solicitud.estado_solicitud || '-'}</Text>
        </View>

        {/* INFORMACIÓN GENERAL */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Datos del Técnico</Text>
          <View style={styles.row}>
            <View style={styles.column}><Text style={styles.item}>  <Text style={{ fontWeight: 'bold' }}>Técnico: </Text> {`${solicitud.nombre_tecnico || ''} ${solicitud.apellido_tecnico || ''}`.trim() || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Cédula:</Text> {solicitud.ci_tecnico || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>TLF:</Text> {solicitud.n_tlf_tecnico || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Correo:</Text> {solicitud.email_tecnico || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Cuadrilla:</Text> {solicitud.cuadrilla || '-'}</Text></View>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxTitle}>Datos de la Solicitud</Text>
          <View style={styles.row}>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Creación de Ticket:</Text> {formatDate(solicitud.fecha_solicitud)}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Código de Solicitud:</Text> {solicitud.codigo_ticket}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Cliente:</Text> {`${solicitud.nombre_cliente} ${solicitud.apellido_cliente}`}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Número de Contrato:</Text> {solicitud.nro_contrato || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Correo:</Text> {solicitud.email_cliente}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>TLF:</Text> {solicitud.n_tlf_cliente}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Motivo de Visita:</Text> {solicitud.motivo_visita || '-'}</Text></View>
            <View style={styles.column}><Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Prioridad:</Text> {solicitud.prioridad_solicitud}</Text></View>
          </View>
          <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Descripción del Servicio o Incidencia:</Text> {solicitud.descripcion_servicio || '-'}</Text>
        </View>

        {/* DATOS DE COMPLETACIÓN / NO REALIZADA / CERRADA */}
        <View style={styles.box}>
          <Text style={styles.boxTitle}>Resultado del Servicio</Text>
          {solicitud.estado_solicitud === 'Completado' ? (
            <>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Tipo Falla-Solucion:</Text> {solicitud.tipo_solucion_falla || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Comentario del Técnico:</Text> {solicitud.comentario_trabajo_realizado || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Herramientas Utilizadas:</Text> {solicitud.herramientas_utilizadas || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Tiempo Invertido:</Text> {formatTiempoInvertido(solicitud.tiempo_invertido) || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Fecha de Cierre:</Text> {formatDate(solicitud.fecha_caso_cerrado)}</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.boxTitle}>Datos de Visita</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Dirección:</Text> {solicitud.direccion_cliente || '-'}</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Días Disponibles del Cliente:</Text> {solicitud.dias_disponibles || '-'}</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Comentario:</Text> {solicitud.comentario_datosvisita || '-'}</Text>
              </View>
            </>
          ) : solicitud.estado_solicitud === 'No Realizado' ? (
            <>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Motivo de No Realización:</Text> {solicitud.motivo_norealizacion || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Comentarios:</Text> {solicitud.comentario_trabajo_norealizado || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Fecha de Cierre:</Text> {formatDate(solicitud.fecha_cierre_norealizado)}</Text>
            </>
          ) : solicitud.estado_solicitud === 'Cerrado' ? (
            <>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Motivo del Cierre:</Text> {solicitud.motivo_cierre || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Comentarios:</Text> {solicitud.comentarios_tecnico || '-'}</Text>
              <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Fecha de Cierre:</Text> {formatDate(solicitud.fecha_cierre)}</Text>

              <View style={{ marginTop: 10 }}>
                <Text style={styles.boxTitle}>Datos de Visita</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Dirección:</Text> {solicitud.direccion_cliente || '-'}</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Días Disponibles del Cliente:</Text> {solicitud.dias_disponibles || '-'}</Text>
                <Text style={styles.item}><Text style={{ fontWeight: 'bold' }}>Comentario:</Text> {solicitud.comentario_datosvisita || '-'}</Text>
              </View>
            </>
          ) : (
            <Text style={styles.item}>Estado no reconocido: {solicitud.estado_solicitud}</Text>
          )}
          </View>

          <View style={styles.box}>
  <Text style={styles.boxTitle}>Evaluaciones de la Solicitud</Text>
  {Array.isArray(evaluaciones) && evaluaciones.length > 0 ? (
    evaluaciones.map((evalItem, index) => (
      <View key={index} style={{ marginBottom: 10 }}>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Código Ticket:</Text> {evalItem.codigo_ticket || '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Código Trabajador:</Text> {evalItem.codigo_trabajador || '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Puntuación Técnico:</Text> {evalItem.puntuacion_tecnico ?? '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Comentario Técnico:</Text> {evalItem.comentario_puntuacion_tecnico || '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Fecha Evaluación:</Text>{' '}
          {evalItem.fecha_evaluacion_tecnico ? formatDate(evalItem.fecha_evaluacion_tecnico) : '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Comentarios del Cliente:</Text> {evalItem.comentarios_cliente || '-'}
        </Text>
        <Text style={styles.item}>
          <Text style={{ fontWeight: 'bold' }}>Calificación Cliente:</Text> {evalItem.calificacion_cliente ?? '-'}
        </Text>
        {index < evaluaciones.length - 1 && (
          <View style={{ marginVertical: 6, borderBottom: '1px dashed #aaa' }} />
        )}
      </View>
    ))
  ) : (
    <Text style={styles.item}>No se encontraron evaluaciones para esta solicitud.</Text>
  )}
</View>

       

      </Page>
    </Document>
  );
};

const DescargaReporteTec = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { solicitud, evaluaciones } = location.state || {};

  if (!solicitud) return <div>No se encontró la solicitud.</div>;

  return (
    <main className="main-Tec" style={{ padding: '20px' }}>
      <div
        className="div-contenedor-botonypdf"
        style={{ maxWidth: 'none', margin: '0 auto', width: '95vw' }}
      >
        <div
          className="div-contenedor-botonvolver-solicitudComplTec"
          style={{ marginBottom: 20 }}
        >
          <button className="Boton-volver" onClick={() => navigate(-1)}>
            Volver
          </button>
        </div>

        <div className="pdf-reporte-conteiner">
          <h2 className="pdf-reporte-titulo" style={{ marginBottom: 20 }}>
            Descargar Reporte de Servicio
          </h2>

          <PDFDownloadLink
            document={<MyDocumentTec solicitud={solicitud} evaluaciones={evaluaciones} />}
            fileName={`reporte_solicitud_${solicitud.codigo_ticket}.pdf`}
            style={{
              display: 'inline-block',
              textAlign: 'center',
              padding: '10px 15px',
              backgroundColor: primary,
              color: '#fff',
              borderRadius: 4,
              textDecoration: 'none',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {({ loading }) => (loading ? 'Generando PDF…' : '📥 Descargar PDF')}
          </PDFDownloadLink>

          <div
            style={{
              marginTop: 20,
              border: '1px solid #ccc',
              borderRadius: 4,
              overflow: 'hidden',
              height: '90vh',
            }}
          >
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <MyDocumentTec solicitud={solicitud} evaluaciones={evaluaciones}/>
            </PDFViewer>
          </div>
        </div>
      </div>
    </main>
  );
};

export default DescargaReporteTec;
