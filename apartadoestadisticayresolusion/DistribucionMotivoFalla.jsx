import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Modal, Button, Box, Typography, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import ReporteDistribucionMotivoFalla from '../Modulo_Tecnico/paginaSecundarias/Generacion_Reporte/ReporteDistribucionMotivoFalla';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import { pdf } from '@react-pdf/renderer';


ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

const DistribucionMotivoFalla = () => {
  const [datos, setDatos] = useState([]);
  const [agrupado, setAgrupado] = useState({});
  const [filtroTecnico, setFiltroTecnico] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroMotivo, setFiltroMotivo] = useState('');
  const [visibleMotivos, setVisibleMotivos] = useState({});
  const [tipoGrafico, setTipoGrafico] = useState('barra');
  const [modalOpen, setModalOpen] = useState(false);
  const [graficoData, setGraficoData] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [verPreview, setVerPreview] = useState(false);



  const handleAbrirVistaPrevia = async () => {
  const blob = await pdf(<ReporteDistribucionMotivoFalla datos={agrupado} />).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

const generateColors = (numColors) => {
  const baseColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#C9CBCF', '#8BC34A', '#E91E63', '#03A9F4'
  ];
  const colors = [];

  for (let i = 0; i < numColors; i++) {
    colors.push(baseColors[i % baseColors.length]);
  }

  return colors;
};


  const filtrarDatos = () => {
    let filtrado = [...datos];

    if (filtroTecnico) {
      filtrado = filtrado.filter(row =>
        row.codigo_trabajador?.toLowerCase().includes(filtroTecnico.toLowerCase()) ||
        row.nombre_tecnico?.toLowerCase().includes(filtroTecnico.toLowerCase())
      );
    }

    if (filtroDesde) {
      const desde = new Date(filtroDesde);
      filtrado = filtrado.filter(row => new Date(row.fecha_caso_cerrado) >= desde);
    }

    if (filtroHasta) {
      const hasta = new Date(filtroHasta);
      filtrado = filtrado.filter(row => new Date(row.fecha_caso_cerrado) <= hasta);
    }

    const agrupadoPorMotivo = filtrado.reduce((acc, row) => {
      const motivo = row.motivo_visita || 'Sin motivo';
      if (!acc[motivo]) acc[motivo] = [];
      acc[motivo].push({ falla: row.tipo_solucion_falla || 'Sin falla', total: parseInt(row.total) });
      return acc;
    }, {});
    setAgrupado(agrupadoPorMotivo);
  };

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_SISTEMARESOLU}/api/sistemaresolucion/motivo_vs_falla`);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Servidor respondió con error: ${res.status} - ${errorText}`);
        }
        const data = await res.json();
        setDatos(data);
        console.log('Datos crudos:', data);

        const agrupadoPorMotivo = data.reduce((acc, row) => {
          const motivo = row.motivo_visita || 'Sin motivo';
          if (!acc[motivo]) acc[motivo] = [];
          acc[motivo].push({ falla: row.tipo_solucion_falla || 'Sin falla', total: parseInt(row.total) });
          return acc;
        }, {});
        setAgrupado(agrupadoPorMotivo);
      } catch (err) {
        console.error('Error al cargar motivo vs falla:', err);
      }
    };

    obtenerDatos();
  }, []);

  const handleOpenModal = (motivo) => {
    const grupo = agrupado[motivo];
    if (!grupo || grupo.length === 0) {
      setErrorMessage(`No hay datos disponibles para el motivo: ${motivo}`);
      return;
    }
    setErrorMessage(''); // Limpiar mensaje de error
    const chartData = {
      labels: grupo.map(f => f.falla),
      datasets: [{
        label: `Total`,
        data: grupo.map(f => f.total),
        backgroundColor: tipoGrafico === 'torta'
          ? grupo.map(() => '#' + Math.floor(Math.random() * 16777215).toString(16)) // colores aleatorios solo para torta
          : '#1976d2',
        borderColor: '#111',
        tension: 0.3,
      }]
    };
    setGraficoData({ chartData, motivo });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setGraficoData({});
  };

const pieChartData = graficoData.chartData && graficoData.chartData.datasets
  ? {
      ...graficoData.chartData,
      datasets: graficoData.chartData.datasets.map(dataset => ({
        ...dataset,
        backgroundColor: generateColors(dataset.data.length)
      }))
    }
  : null;





  return (
    <div style={{ maxWidth: 900, margin: 'auto', padding: 20 }}>
      <h2>Distribución de Fallas Encontradas por Motivo de Visita</h2>

      <div style={{ display: 'flex', gap: '10px', marginBottom: 20 }}>
        <FormControl fullWidth>
          <InputLabel id="filtro-motivo-label">Motivo de visita</InputLabel>
          <Select
            labelId="filtro-motivo-label"
            value={filtroMotivo}
            onChange={(e) => setFiltroMotivo(e.target.value)}
          >
            <MenuItem value=""><em>Seleccione un motivo</em></MenuItem>
            {Object.keys(agrupado).map((motivo, index) => (
              <MenuItem key={index} value={motivo}>{motivo}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <button
  onClick={filtrarDatos}
  style={{
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
>
  Aplicar
</button>

      </div>

      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

      {filtroMotivo && agrupado[filtroMotivo] && (
        <div style={{ marginBottom: 40 }}>
          <h3 style={{ color: '#333' }}>🔹 {filtroMotivo}</h3>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 10 }}>
            <thead>
              <tr style={{ backgroundColor: '#444', color: '#fff' }}>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Falla encontrada</th>
                <th style={{ padding: 8, border: '1px solid #ccc' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {agrupado[filtroMotivo].map((f, idx) => (
                <tr key={idx}>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{f.falla}</td>
                  <td style={{ padding: 8, border: '1px solid #ccc' }}>{f.total}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
  onClick={() => handleOpenModal(filtroMotivo)}
  style={{
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#0056b3')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#007bff')}
>
  Ver gráficos
</button>

        </div>
      )}

      {Object.keys(agrupado).length > 0 && (
  <div style={{ marginBottom: 30 }}>
    <h3>Reporte General</h3>

    <PDFDownloadLink
      document={<ReporteDistribucionMotivoFalla datos={agrupado} />}
      fileName="motivo_vs_falla.pdf"
      style={{
        padding: 10,
        backgroundColor: '#1976d2',
        color: '#fff',
        textDecoration: 'none',
        borderRadius: 4,
        marginRight: 10,
        display: 'inline-block'
      }}
    >
      {({ loading }) => loading ? 'Generando PDF...' : '📄 Descargar Reporte'}
    </PDFDownloadLink>

    <button
  onClick={handleAbrirVistaPrevia}
  style={{
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    padding: '10px 18px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'background-color 0.3s',
  }}
  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#115293')}
  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
>
  👁️ Ver Vista Previa
</button>


    {verPreview && (
      <PDFViewer style={{ width: '100%', height: 600, marginTop: 20 }}>
        <ReporteDistribucionMotivoFalla datos={agrupado} />
      </PDFViewer>
    )}
  </div>
)}


      {/* Modal para mostrar gráficos */}
      <Modal open={modalOpen} onClose={handleCloseModal}>
        <Box 
          sx={{ 
            width: '80%', 
            maxWidth: 800, 
            maxHeight: '90vh',  // Altura máxima del 90% del viewport
            bgcolor: 'background.paper', 
            boxShadow: 24, 
            p: 4, 
            borderRadius: 2,
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'  // Oculta el overflow del contenedor principal
          }}
        >
          <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
            Gráficos para: {graficoData.motivo}
          </Typography>
          
          {/* Contenedor desplazable con barra personalizada */}
          <Box 
            sx={{ 
              flex: 1,
              overflowY: 'auto',
              pr: 2,
              '&::-webkit-scrollbar': {
                width: '8px'
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#888',
                borderRadius: '4px'
              },
              '&::-webkit-scrollbar-thumb:hover': {
                background: '#555'
              }
            }}
          >
            {/* Sección Gráfico de Torta */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Gráfico de Torta
              </Typography>
              <Box sx={{ 
                height: 300,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Pie 
                  data={pieChartData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false
                  }} 
                />

              </Box>
            </Box>

            {/* Sección Gráfico de Barras */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Gráfico de Barras
              </Typography>
              <Box sx={{ height: 300 }}>
                <Bar 
                  data={graficoData.chartData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false
                  }} 
                />
              </Box>
            </Box>

            {/* Sección Gráfico de Línea */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Gráfico de Línea
              </Typography>
              <Box sx={{ height: 300 }}>
                <Line 
                  data={graficoData.chartData} 
                  options={{ 
                    responsive: true,
                    maintainAspectRatio: false
                  }} 
                />
              </Box>
            </Box>
          </Box>

          {/* Botón de Cierre - se mantiene fijo abajo */}
          <Box sx={{ 
            mt: 3, 
            textAlign: 'right',
            flexShrink: 0  // Evita que se reduzca con el scroll
          }}>
            <Button 
              variant="contained" 
              onClick={handleCloseModal}
              sx={{
                px: 4,
                borderRadius: 2,
                textTransform: 'none',
                boxShadow: 2,
                backgroundColor: '#1976d2',
                '&:hover': {
                  backgroundColor: '#1565c0'
                }
              }}
            >
              Cerrar
            </Button>
          </Box>
        </Box>
      </Modal>
    </div>
  );
};

export default DistribucionMotivoFalla;
