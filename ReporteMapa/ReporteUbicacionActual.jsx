import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo from './logo.png';

const primary = '#c62828';
const borderColor = '#fdecea';

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

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    height: 40,
  },
  headerLeft: {
    width: 60,
    justifyContent: 'center',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  image: {
    width: 60,
    height: 60,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 9,
    color: '#555',
  },
  table: {
    width: '100%',
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primary,
    color: '#fff',
  },
  headerCell: {
    flex: 1,
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    borderRightWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    padding: 6,
    fontSize: 10,
    borderRightWidth: 0.5,
    borderTopWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
  },
  oddRow: {
    backgroundColor: '#fdf0f0a2',
  },
  noData: {
    fontStyle: 'italic',
    color: '#888',
    marginTop: 20,
    textAlign: 'center',
  },
});

const ReporteUbicacionActual = ({ tecnico, ubicacion = [] }) => {
  const fechaDescarga = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.image} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Registro de Ubicación Actual</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA DE UBICACIONES */}
        {ubicacion.length > 0 ? (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Técnico</Text>
              <Text style={styles.headerCell}>Fecha</Text>
              <Text style={styles.headerCell}>Latitud</Text>
              <Text style={styles.headerCell}>Longitud</Text>
            </View>
            {ubicacion.map((u, idx) => (
              <View
                key={idx}
                style={[styles.row, idx % 2 === 0 ? styles.oddRow : null]}
                wrap={false}
              >
                <Text style={styles.cell}>{tecnico(u.codigo_trabajador) || 'N/D'}</Text>
                <Text style={styles.cell}>{formatDate(u.fecha_actualizacion)}</Text>
                <Text style={styles.cell}>{u.latitud}</Text>
                <Text style={styles.cell}>{u.longitud}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noData}>No hay ubicaciones disponibles.</Text>
        )}
      </Page>
    </Document>
  );
};

export default ReporteUbicacionActual;
