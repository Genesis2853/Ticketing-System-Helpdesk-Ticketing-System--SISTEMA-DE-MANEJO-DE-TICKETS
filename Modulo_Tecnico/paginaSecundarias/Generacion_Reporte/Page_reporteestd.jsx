import React from 'react';
import ReporteEstadistico from './GenerarReporte_Estadistico';
import { PDFDownloadLink } from '@react-pdf/renderer';

const SeccionEstadistica = ({ datosAgrupados }) => (
  <div>
    <h2>📊 Estadísticas Generales</h2>

    <PDFDownloadLink
      document={<ReporteEstadistico datos={datosAgrupados} />}
      fileName="reporte_estadistico.pdf"
      style={{
        padding: 10,
        backgroundColor: '#1976d2',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: 4
      }}
    >
      {({ loading }) => (loading ? 'Generando PDF...' : '📄 Descargar Reporte')}
    </PDFDownloadLink>

    {/* Aquí puedes mostrar tus tablas o gráficas visibles */}
  </div>
);

export default SeccionEstadistica;
