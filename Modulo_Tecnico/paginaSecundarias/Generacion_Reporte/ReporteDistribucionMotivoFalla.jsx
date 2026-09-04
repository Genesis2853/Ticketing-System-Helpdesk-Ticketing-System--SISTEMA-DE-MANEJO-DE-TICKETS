import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import logo from './logo.png'; // Importa el logo igual que en el otro archivo

// Obtener fecha y hora actual formateada
const obtenerFechaHora = () => {
  const hoy = new Date();
  return hoy.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Estilos actualizados
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Espacio entre los 3 elementos
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  logo: {
    width: 80,
    height: 40,
    objectFit: 'contain',
  },
  titulo: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#c62828',
    textAlign: 'center',
  },
  fecha: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
    minWidth: 100,
  },
  sectionTitle: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#d32f2f',
    backgroundColor: '#d32f2f',
    color: '#fff',
    paddingBottom: 4,
    paddingTop: 2,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    paddingVertical: 2,
  },
  cell: {
    flex: 1,
    paddingHorizontal: 5,
  },
});

const ReporteDistribucionMotivoFalla = ({ datos }) => (
  <Document>
    <Page style={styles.page}>
      {/* Header con logo, título y fecha/hora */}
      <View style={styles.header}>
        <Image style={styles.logo} src={logo} />
        <Text style={styles.titulo}>Distribución de Fallas</Text>
        <Text style={styles.fecha}>Fecha: {obtenerFechaHora()}</Text>
      </View>

      <Text style={styles.sectionTitle}>Reporte Estructurado: Motivo de Visita vs Fallas</Text>

      {Object.entries(datos).map(([motivo, fallas], idx) => (
        <View key={idx}>
          <Text style={{ fontSize: 14, marginTop: 15, marginBottom: 5, fontWeight: 'bold' }}>{motivo}</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.cell, { flex: 2 }]}>Falla encontrada</Text>
            <Text style={styles.cell}>Total</Text>
          </View>
          {fallas.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.cell, { flex: 2 }]}>{item.falla}</Text>
              <Text style={styles.cell}>{item.total}</Text>
            </View>
          ))}
        </View>
      ))}
    </Page>
  </Document>
);

export default ReporteDistribucionMotivoFalla;
