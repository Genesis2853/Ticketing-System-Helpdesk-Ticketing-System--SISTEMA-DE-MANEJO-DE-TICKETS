import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
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
});

// Ajustamos flex para cada columna según contenido esperado
const getFlex = (col) => {
  switch (col) {
    case 'codigo':
      return 1.5;
    case 'motivoVisita':
    case 'motivoCierre':
      return 1.2;
    case 'fechaCierre':
      return 1;
    case 'tecnico':
      return 1.5;
    case 'cliente':
      return 1.5;
    default:
      return 1;
  }
};

const ReporteGCerrado = ({ solicitudes = [] }) => {
  const fechaDescarga = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer} fixed>
          {/* Logo izquierda */}
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.image} />
          </View>

          {/* Título centrado */}
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Reporte de Solicitudes Cerradas</Text>
          </View>

          {/* Fecha derecha */}
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          {/* Encabezados */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: getFlex('codigo') }]}>Código Ticket</Text>
            <Text style={[styles.headerCell, { flex: getFlex('motivoVisita') }]}>Motivo Visita</Text>
            <Text style={[styles.headerCell, { flex: getFlex('motivoCierre') }]}>Motivo Cierre</Text>
            <Text style={[styles.headerCell, { flex: getFlex('fechaCierre') }]}>Fecha Cierre</Text>
            <Text style={[styles.headerCell, { flex: getFlex('tecnico') }]}>Técnico</Text>
            <Text style={[styles.headerCell, { flex: getFlex('cliente') }]}>Cliente</Text>
          </View>

          {/* Filas */}
          {solicitudes.map((s, idx) => (
            <View
              style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
              ]}
              key={idx}
              wrap={false}
            >
              <Text style={[styles.cell, { flex: getFlex('codigo') }]}>{s.codigo_ticket || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('motivoVisita') }]}>{s.motivo_visita || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('motivoCierre') }]}>{s.motivo_cierre || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('fechaCierre') }]}>
                {s.fecha_cierre ? formatDate(s.fecha_cierre) : '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('tecnico') }]}>
                {`${s.nombre_tecnico || ''} ${s.apellido_tecnico || ''}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('cliente') }]}>
                {`${s.nombre_cliente || ''} ${s.apellido_cliente || ''}`.trim() || '-'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteGCerrado;
