import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const BarChart = ({ title, data = [], onClick }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy(); // Limpiar gráfico previo si existe
      }
      
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.name),            // Eje X (categorías)
          datasets: [{
            label: title,                                 // Título del gráfico
            data: data.map(item => item.value),           // Eje Y (valores)
            backgroundColor: 'rgba(54, 162, 235, 0.6)',   // Color de fondo de las barras
            borderColor: 'rgba(54, 162, 235, 1)',         // Color del borde
            borderWidth: 1                                // Grosor del borde
          }]
        },
        options: {
          responsive: true,            // Se adapta al tamaño del contenedor
          maintainAspectRatio: false,  // Permite redimensionar libremente
          scales: {
            y: {
              beginAtZero: true        // Eje Y empieza en 0
            }
          },
          onClick: (evt, elements) => {  // Al hacer clic en una barra
            if (elements.length > 0) {
              onClick();               // Abre un modal con datos detallados
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();  // Limpiar al desmontar el componente
      }
    };
  }, [data, title, onClick]);  // Se vuelve a renderizar si cambian los datos

  return (
    <div className="chart-wrapper" onClick={onClick}>
      <h4>{title}</h4>  {/* Título del gráfico */}
      <div className="chart-canvas-container">
        <canvas ref={chartRef}></canvas>  {/* Contenedor del gráfico */}
      </div>
    </div>
  );
};

export default BarChart;
