// src/componentesdatos estadisticos/ComparativaTiemposChart.js
import React from 'react';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const ComparativaTiemposChart = ({ data }) => {
  if (!data?.length) return null;

  const labels = data.map(d => d.codigo_solicitud);
  const datasetReal = data.map(d => d.tiempo_real_minutos);
  const datasetStd  = data.map(() => 120); // fijo

  const chartData = {
    labels,
    datasets: [
      { label: 'Real (min)',   data: datasetReal, backgroundColor: '#1976d2' },
      { label: 'Estándar 120', data: datasetStd,  backgroundColor: '#ff9800' }
    ]
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto' }}>
      <h4 style={{ textAlign: 'center' }}>Tiempo real vs estándar por solicitud</h4>
      <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
    </div>
  );
};

export default ComparativaTiemposChart;
