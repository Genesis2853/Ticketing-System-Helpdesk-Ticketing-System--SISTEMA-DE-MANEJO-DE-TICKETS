// src/Modulo_Evaluaciones/Generacion_Reporte/ReporteEvaluaciones.jsx
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from '@react-pdf/renderer';

// Color corporativo (rojo)
const primary = '#c62828';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: 'bold',
    color: primary,
  },
  sectionHeader: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    color: primary,
  },
  table: { 
    width: '100%', 
    marginBottom: 20,
    border: `1px solid ${primary}`,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primary,
    color: '#fff',
  },
  headerCell: {
    flex: 1,
    padding: 8,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    borderBottom: `1px solid ${primary}`,
  },
  cell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
    textAlign: 'center',
  },
  feedbackCell: {
    flex: 1,
    padding: 8,
    fontSize: 10,
  },
  feedbackStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
});

const ReporteEvaluaciones = ({ evaluaciones = [] }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Reporte de Evaluaciones Técnicas</Text>
      
      {/* Sección 1: Información de Solicitudes */}
      <Text style={styles.sectionHeader}>1. Información de Solicitudes</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>ID Solicitud</Text>
          <Text style={styles.headerCell}>Técnico</Text>
          <Text style={styles.headerCell}>Cliente</Text>
        </View>
        
        {evaluaciones.map((evaluacion, idx) => (
          <View style={styles.row} key={`solicitud-${idx}`}>
            <Text style={styles.cell}>{evaluacion.id_soli_completada}</Text>
            <Text style={styles.cell}>
              {`${evaluacion.nombre_tecnico} ${evaluacion.apellido_tecnico}`.trim() || '-'}
            </Text>
            <Text style={styles.cell}>
              {`${evaluacion.nombre_cliente} ${evaluacion.apellido_cliente}`.trim() || '-'}
            </Text>
          </View>
        ))}
      </View>

      {/* Sección 2: Evaluaciones */}
      <Text style={styles.sectionHeader}>2. Detalle de Evaluaciones</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.headerCell}>Puntuación Técnica</Text>
          <Text style={styles.headerCell}>Comentario Técnico</Text>
          <Text style={styles.headerCell}>Calificación Cliente</Text>
          <Text style={styles.headerCell}>Comentarios Cliente</Text>
          <Text style={styles.headerCell}>Feedback</Text>
        </View>
        
        {evaluaciones.map((evaluacion, idx) => (
          <View style={styles.row} key={`evaluacion-${idx}`}>
            <Text style={styles.cell}>{evaluacion.puntuacion_tecnico || '-'}</Text>
            <Text style={styles.feedbackCell}>{evaluacion.comentario_puntuacion_tecnico || '-'}</Text>
            <Text style={styles.cell}>{evaluacion.calificacion_cliente || '-'}</Text>
            <Text style={styles.feedbackCell}>{evaluacion.comentarios_cliente || '-'}</Text>
            <View style={[styles.cell, styles.feedbackStatus]}>
              <Text>✅</Text>
              {evaluacion.id_feedback ? <Text>✅</Text> : <Text>❌</Text>}
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default ReporteEvaluaciones;
