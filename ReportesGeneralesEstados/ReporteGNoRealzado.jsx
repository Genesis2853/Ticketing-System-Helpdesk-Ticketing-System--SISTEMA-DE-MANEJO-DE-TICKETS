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
  return `${dd}/${mm}/${yyyy}`;
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

// Flex según columna, ajustado para que se vea ordenado
const getFlex = (col) => {
  switch (col) {
    case 'codigo':
      return 1.5;
    case 'contrato':
      return 1.1;
    case 'cliente':
      return 1.5;
    case 'fechaNoRealizacion':
      return 1.2;
    case 'motivoNoRealizacion':
      return 1.7;
    case 'motivoVisita':
      return 1.2;
    case 'tecnico':
      return 1.5;
    case 'prioridad':
      return 0.7;
    default:
      return 1;
  }
};

const ReporteNoRealizadasPDF = ({ solicitudes = [] }) => {
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
            <Text style={styles.headerText}>Reporte de Solicitudes No Realizadas</Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: getFlex('codigo') }]}>Código Ticket</Text>
            <Text style={[styles.headerCell, { flex: getFlex('contrato') }]}>Número Contrato</Text>
            <Text style={[styles.headerCell, { flex: getFlex('cliente') }]}>Cliente</Text>
            <Text style={[styles.headerCell, { flex: getFlex('fechaNoRealizacion') }]}>Fecha No Realización</Text>
            <Text style={[styles.headerCell, { flex: getFlex('motivoNoRealizacion') }]}>Motivo de No Realización</Text>
            <Text style={[styles.headerCell, { flex: getFlex('motivoVisita') }]}>Motivo Visita</Text>
            <Text style={[styles.headerCell, { flex: getFlex('tecnico') }]}>Técnico</Text>
            <Text style={[styles.headerCell, { flex: getFlex('prioridad') }]}>Prioridad</Text>
          </View>

          {solicitudes.map((s, idx) => (
            <View
              key={s.id_soli_norealizada || s.codigo_ticket}
              style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
              ]}
              wrap={false}
            >
              <Text style={[styles.cell, { flex: getFlex('codigo') }]}>
                {s.codigo_ticket || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('contrato') }]}>
                {s.nro_contrato || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('cliente') }]}>
                {`${s.nombre_cliente ?? ''} ${s.apellido_cliente ?? ''}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('fechaNoRealizacion') }]}>
                {s.fecha_cierre_norealizado ? formatDate(s.fecha_cierre_norealizado) : '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('motivoNoRealizacion') }]}>
                {s.motivo_norealizacion || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('motivoVisita') }]}>
                {s.motivo_visita || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('tecnico') }]}>
                {`${s.nombre_tecnico ?? ''} ${s.apellido_tecnico ?? ''}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, { flex: getFlex('prioridad') }]}>
                {s.prioridad_solicitud || '-'}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteNoRealizadasPDF;
