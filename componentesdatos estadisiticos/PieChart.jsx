import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const PieChart = ({ title, data = [], onClick }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data.length > 0) {
      if (chartInstance.current) {
        chartInstance.current.destroy(); // Limpiar gráfico previo
      }
      
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: data.map(item => item.name),           // Categorías (ej: "Prepago", "Postpago")
          datasets: [{
            data: data.map(item => item.value),          // Valores (ej: 150, 300)
            backgroundColor: [                           // Colores por sección
              'rgba(255, 99, 132, 0.6)',                 // Rojo
              'rgba(54, 162, 235, 0.6)',                 // Azul
              'rgba(255, 206, 86, 0.6)',                 // Amarillo
              'rgba(75, 192, 192, 0.6)'                  // Verde
            ],
            borderColor: 'white',                        // Bordes blancos
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, elements) => {    // Al hacer clic en una porción
            if (elements.length > 0) {
              onClick();  // Abre un modal con datos
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();  // Limpiar al desmontar
      }
    };
  }, [data, title, onClick]);

  return (
    <div className="chart-wrapper" onClick={onClick}>
      <h4>{title}</h4>
      <div className="chart-canvas-container">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default PieChart;
