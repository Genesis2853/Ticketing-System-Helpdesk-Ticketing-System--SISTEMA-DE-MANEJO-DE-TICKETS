import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1
  },
  title: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold'
  },
  text: {
    fontSize: 12,
    marginBottom: 5
  }
});

const PerformanceReportPDF = ({ evaluacion, solicitud, feedback }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.title}>Reporte de Desempeño Técnico</Text>
        {/* ... (igual que el componente PDF anterior) */}
      </View>
    </Page>
  </Document>
);

const ReporteDesempeno = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { evaluacion, solicitud, feedback } = state || {};

  if (!evaluacion || !solicitud) {
    return <div>No se encontraron datos del reporte</div>;
  }

  return (
    <main className="main-Tec">
      <div className='div-contenedor-botonvolver'>
        <button className='Boton-volver' onClick={() => navigate(-1)}>Volver</button>
      </div>

      <div className="pdf-reporte-conteiner">
        <h2>Reporte de Desempeño - Solicitud #{solicitud.codigo_solicitud}</h2>
        
        <div className="reporte-detalle">
          <h3>Información del Servicio</h3>
          <p><strong>Técnico:</strong> {solicitud.nombre_tecnico} {solicitud.apellido_tecnico}</p>
          <p><strong>Cliente:</strong> {solicitud.nombre_cliente} {solicitud.apellido_cliente}</p>
          {/* ... resto de campos ... */}
          
          <div className="pdf-preview">
            <PDFViewer style={{ width: '100%', height: '500px' }}>
              <PerformanceReportPDF 
                evaluacion={evaluacion} 
                solicitud={solicitud} 
                feedback={feedback} 
              />
            </PDFViewer>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ReporteDesempeno;
