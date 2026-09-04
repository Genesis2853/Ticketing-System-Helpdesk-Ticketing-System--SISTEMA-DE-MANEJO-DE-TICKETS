import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import logo from './logo.png';

// Color corporativo
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

  table: { width: '100%', marginBottom: 10 },
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
  // Ajustes de ancho
  contrato: { flex: 0.6 },
  nombreApellido: { flex: 1.5 },
  telefono: { flex: 0.9 },
  correo: { flex: 1.4 },
  direccion: { flex: 1.2 },
  servicio: { flex: 0.6 },
});

const ReporteClientes = ({ clientes = [] }) => {
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
    <Text style={styles.headerText}>Clientes</Text>
  </View>

  {/* Fecha derecha */}
  <View style={styles.headerRight}>
    <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
  </View>
</View>


        <View style={styles.table}>
          {/* Encabezado */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, styles.contrato]}>N.º Cto.</Text>
            <Text style={[styles.headerCell, styles.nombreApellido]}>Nombre y Apellido</Text>
            <Text style={[styles.headerCell, styles.telefono]}>Teléfono</Text>
            <Text style={[styles.headerCell, styles.correo]}>Correo</Text>
            <Text style={[styles.headerCell, styles.direccion]}>Dirección</Text>
            <Text style={[styles.headerCell, styles.servicio]}>Servicio</Text>
          </View>

          {/* Filas */}
          {clientes.map((c, idx) => (
            <View style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
              ]} key={idx}>
              <Text style={[styles.cell, styles.contrato]}>{c.nro_contrato || '-'}</Text>
              <Text style={[styles.cell, styles.nombreApellido]}>
                {`${c.nombre_cliente} ${c.apellido_cliente}`.trim() || '-'}
              </Text>
              <Text style={[styles.cell, styles.telefono]}>{c.n_tlf_cliente || '-'}</Text>
              <Text style={[styles.cell, styles.correo]}>{c.email_cliente || '-'}</Text>
              <Text style={[styles.cell, styles.direccion]}>{c.direccion_cliente || '-'}</Text>
              <Text style={[styles.cell, styles.servicio]}>{c.tipo_servicio || '-'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteClientes;
