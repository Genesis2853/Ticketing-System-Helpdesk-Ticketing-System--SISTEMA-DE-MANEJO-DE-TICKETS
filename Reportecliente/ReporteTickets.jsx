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

// Formateo de fecha y hora actual
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

// Estilos
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

// Lógica para tamaños de columnas
const getFlex = (col) => {
  switch (col) {
    case 'cliente':
      return 1.5;
    case 'prioridad':
    case 'fecha':
      return 0.7;
    case 'descripcion':
      return 2;
    default:
      return 1;
  }
};

const ReporteTickets = ({ tickets = [] }) => {
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
            <Text style={styles.headerText}>Historial de Tickets</Text>
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
            <Text style={[styles.headerCell, { flex: getFlex() }]}>Código</Text>
            <Text style={[styles.headerCell, { flex: getFlex('cliente') }]}>Cliente</Text>
            <Text style={[styles.headerCell, { flex: getFlex() }]}>Motivo</Text>
            <Text style={[styles.headerCell, { flex: getFlex('prioridad') }]}>Prioridad</Text>
            <Text style={[styles.headerCell, { flex: getFlex('fecha') }]}>Fecha</Text>
            <Text style={[styles.headerCell, { flex: getFlex('descripcion') }]}>Descripción del Servicio</Text>
          </View>

          {/* Filas */}
          {tickets.map((t, idx) => (
            <View style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
              ]} key={idx} wrap={false}>
              <Text style={[styles.cell, { flex: getFlex() }]}>{t.codigo_ticket || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('cliente') }]}>
                {`${t.nombre_cliente} ${t.apellido_cliente}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex() }]}>{t.motivo_visita || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('prioridad') }]}>{t.prioridad_solicitud || '-'}</Text>
              <Text style={[styles.cell, { flex: getFlex('fecha') }]}>
                {t.fecha_creacion ? t.fecha_creacion.slice(0, 10) : '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('descripcion') }]}>{t.descripcion_servicio || '-'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteTickets;
