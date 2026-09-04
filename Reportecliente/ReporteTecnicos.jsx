import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import logo from './logo.png'; // Ajusta la ruta a tu logo

const primary = '#c62828';
const borderColor = '#fdecea'; // color clarito rojito para filas alternadas

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

  // Header
  headerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    height: 50,
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
    width: 50,
    height: 50,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: primary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 9,
    color: '#555',
  },

  // Tabla
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primary,
    color: '#fff',
  },
  headerCell: {
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    padding: 6,
    fontSize: 10,
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
  },

  // Anchos por columna
  codigo: { flex: 1.2 },
  cedula: { flex: 0.8 },
  nombre: { flex: 1.8 },
  telefono: { flex: 0.8 },
  correo: { flex: 1.5 },
});

const ReporteTecnicos = ({ tecnicos = [] }) => {
  const fechaDescarga = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.image} />
          </View>

          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Técnicos</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          {/* Encabezado */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.codigo]}>Código</Text>
            <Text style={[styles.headerCell, styles.cedula]}>Cédula</Text>
            <Text style={[styles.headerCell, styles.nombre]}>Nombre y Apellido</Text>
            <Text style={[styles.headerCell, styles.telefono]}>Teléfono</Text>
            <Text style={[styles.headerCell, styles.correo]}>Correo</Text>
          </View>

          {/* Filas */}
          {tecnicos.map((t, idx) => (
            <View
              key={idx}
              style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.cell, styles.codigo]}>{t.codigo_trabajador || '-'}</Text>
              <Text style={[styles.cell, styles.cedula]}>{t.ci_tecnico || '-'}</Text>
              <Text style={[styles.cell, styles.nombre]}>
                {`${t.nombre_tecnico || ''} ${t.apellido_tecnico || ''}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, styles.telefono]}>{t.n_tlf_tecnico || '-'}</Text>
              <Text style={[styles.cell, styles.correo]}>{t.email_tecnico || '-'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteTecnicos;
