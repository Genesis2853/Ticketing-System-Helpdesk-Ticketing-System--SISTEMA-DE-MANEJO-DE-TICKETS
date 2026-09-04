import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
} from '@react-pdf/renderer';

// ——— Paleta corporativa ———
const rojo = '#c62828';
const gris = '#555';

// ——— Estilos ———
const styles = StyleSheet.create({
  page: {
    padding: 32,              // margen respetado
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    color : rojo,
    fontWeight: 'bold',
  },
  dateStamp: {
    fontSize: 9,
    color : gris,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: rojo,
    color: '#fff',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  th:  { flex: 1, fontWeight: 'bold' },

  row: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottom: '1px solid #eee',
  },
  td:  { flex: 1 },
});

/** feedbacks: array ya filtrado */
const FeedbackPDFDocument = ({ feedbacks }) => {
  // Fecha de descarga → esquina superior derecha
  const hoy = new Date().toLocaleDateString('es-VE', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.headerBar}>
          <Text style={styles.title}>Reporte de Feedbacks</Text>
          <Text style={styles.dateStamp}>Descargado: {hoy}</Text>
        </View>

        {/* Tabla */}
        <View style={styles.tableHeader}>
          <Text style={styles.th}>ID</Text>
          <Text style={styles.th}>Técnico</Text>
          <Text style={styles.th}>Cliente</Text>
          <Text style={styles.th}>Calif.</Text>
          <Text style={styles.th}>Fecha</Text>
        </View>

        {feedbacks.map(fb => {
          const fecha = fb.fecha_feedback_prueba ? new Date(fb.fecha_feedback_prueba) : null;
          const fechaValida = fecha && !isNaN(fecha);

          return (
            <View key={fb.id_feedback} style={styles.row} wrap={false}>
              <Text style={styles.td}>{fb.id_feedback ?? '-'}</Text>
              <Text style={styles.td}>{fb.nombre_tecnico ?? '-'}</Text>
              <Text style={styles.td}>{fb.nombre_apellido_cliente ?? '-'}</Text>
              <Text style={styles.td}>{fb.calificacion_cliente ?? '-'}</Text>
              <Text style={styles.td}>
                {fechaValida ? fecha.toLocaleDateString('es-VE') : '-'}
              </Text>
            </View>
          );
        })}
      </Page>
    </Document>
  );
};

export default FeedbackPDFDocument;
