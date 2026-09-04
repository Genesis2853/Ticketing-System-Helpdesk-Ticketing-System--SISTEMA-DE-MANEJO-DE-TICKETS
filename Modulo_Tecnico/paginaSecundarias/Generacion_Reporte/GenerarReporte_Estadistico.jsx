import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer';
import logo from './logo.png'; // Asegúrate que esta ruta sea válida

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 10,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    flex: 1,
  },
  dateText: {
    fontSize: 10,
    color: '#666',
    textAlign: 'right',
  },
  section: {
    marginBottom: 30,
  },
  subHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#c62828',
    borderBottomWidth: 2,
    borderBottomColor: '#c62828',
    paddingBottom: 5,
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    backgroundColor: '#c62828',
    color: 'white',
    flexDirection: 'row',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tableCell: {
    padding: 8,
    fontSize: 12,
    flex: 1,
  },
  smallCell: {
    padding: 8,
    fontSize: 12,
    flex: 0.5,
  },
  timeCell: {
    padding: 8,
    fontSize: 12,
    textAlign: 'right',
    flex: 1,
  },
  headerCell: {
    padding: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
  },
});

const convertirMinutosAHMS = (minutos) => {
  const totalSegundos = Math.round(minutos * 60);
  const horas = Math.floor(totalSegundos / 3600);
  const minutosRestantes = Math.floor((totalSegundos % 3600) / 60);
  const segundos = totalSegundos % 60;
  return { horas, minutos: minutosRestantes, segundos };
};

const ReporteEstadistico = ({ datos }) => {
  const fechaGeneracion = new Date().toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const Header = () => (
    <View style={styles.headerContainer} fixed>
      <Image src={logo} style={styles.logo} />
      <Text style={styles.headerTitle}>Reporte Promedios de Técnicos</Text>
      <Text style={styles.dateText}>Fecha: {fechaGeneracion}</Text>
    </View>
  );

  return (
    <Document>
      {/* Página 1: Resumen general */}
      <Page size="A4" style={styles.page}>
        <Header />
        <View style={styles.section}>
          <Text style={styles.subHeader}>Resumen General</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Técnico</Text>
              <Text style={styles.headerCell}>Promedio</Text>
              <Text style={styles.headerCell}>Total Solicitudes</Text>
            </View>
            {datos?.tecnicos?.map((t, i) => {
              const { horas, minutos, segundos } = convertirMinutosAHMS(t.promedio);
              return (
                <View style={styles.tableRow} key={i}>
                  <Text style={styles.tableCell}>{t.tecnico}</Text>
                  <Text style={styles.timeCell}>{`${horas}h ${minutos}m ${segundos}s`}</Text>
                  <Text style={styles.tableCell}>{t.solicitudes?.length || 0}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </Page>

      {/* Páginas siguientes: Detalle individual por técnico */}
      {datos?.tecnicos?.map((t, i) => {
        const { horas, minutos, segundos } = convertirMinutosAHMS(t.promedio);
        return (
          <Page key={i} size="A4" style={styles.page} wrap>
            <Header />
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>{t.tecnico}</Text>
            <Text style={{ fontSize: 12, marginBottom: 15 }}>
              Promedio: {horas}h {minutos}m {segundos}s | Total solicitudes: {t.solicitudes?.length || 0}
            </Text>

            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.headerCell, styles.smallCell]}>#</Text>
                <Text style={styles.headerCell}>Código</Text>
                <Text style={styles.headerCell}>Motivo de Visita</Text>
                <Text style={styles.headerCell}>Falla Encontrada</Text>
                <Text style={styles.headerCell}>Tiempo Invertido</Text>
              </View>
              {t.solicitudes?.map((solicitud, idx) => {
                const tiempo = convertirMinutosAHMS(solicitud.tiempo_invertido);
                return (
                  <View style={styles.tableRow} key={idx}>
                    <Text style={[styles.tableCell, styles.smallCell]}>{idx + 1}</Text>
                    <Text style={styles.tableCell}>{solicitud.codigo_ticket || 'No Código'}</Text>
                    <Text style={styles.tableCell}>{solicitud.motivo_visita || 'Sin motivo'}</Text>
                    <Text style={styles.tableCell}>{solicitud.tipo_solucion_falla || 'Sin falla'}</Text>
                    <Text style={styles.timeCell}>
                      {`${tiempo.horas}h ${tiempo.minutos}m ${tiempo.segundos}s`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Page>
        );
      })}
    </Document>
  );
};

export default ReporteEstadistico;
