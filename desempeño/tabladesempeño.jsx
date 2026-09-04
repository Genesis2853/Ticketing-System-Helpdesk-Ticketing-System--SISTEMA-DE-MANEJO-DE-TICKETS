import React, { useEffect, useRef } from "react";
import html2canvas from "html2canvas";
import TechnicianPerformanceReport from "../Reportecliente/TechnicianPerformanceReport";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import './estilodesempeño.css';

const TechnicianPerformance = ({ technicians, evaluaciones }) => {
  const calculatePerformance = (techniciansList, evaluationsList) => {
    return techniciansList.map(tech => {
      const techEvals = evaluationsList.filter(ev => ev.codigo_trabajador === tech.codigo_trabajador);
      const solicitudesCount = techEvals.length;

      let sumInternal = 0, countInternal = 0;
      let sumClient = 0, countClient = 0;

      techEvals.forEach(ev => {
        if (typeof ev.puntuacion_tecnico === "number" && ev.puntuacion_tecnico > 0) {
          sumInternal += ev.puntuacion_tecnico;
          countInternal++;
        }
        if (typeof ev.calificacion_cliente === "number" && ev.calificacion_cliente > 0) {
          sumClient += ev.calificacion_cliente;
          countClient++;
        }
      });

      const avgInternal = countInternal ? sumInternal / countInternal : 0;
      const avgClient = countClient ? sumClient / countClient : 0;
      const combinedAvg = (avgInternal && avgClient) 
        ? (avgInternal + avgClient) / 2 
        : (avgInternal || avgClient);

      return {
        ...tech,
        solicitudes: solicitudesCount,
        promedio: combinedAvg.toFixed(2),
      };
    });
  };

  const getCategory = (promedio) => {
    if (promedio >= 4.5) return { label: "Excelente", color: "#10B981", icon: "⭐⭐⭐⭐⭐" };
    if (promedio >= 3.5) return { label: "Muy Bueno", color: "#34D399", icon: "⭐⭐⭐⭐" };
    if (promedio >= 2.5) return { label: "Bueno", color: "#60A5FA", icon: "⭐⭐⭐" };
    if (promedio >= 1.5) return { label: "Regular", color: "#FBBF24", icon: "⭐⭐" };
    return { label: "Crítico", color: "#F87171", icon: "⭐" };
  };

  const updateTechnicianAverage = async (tech) => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/tecnicos/promedio/${tech.codigo_trabajador}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ promedio_tecnico: tech.promedio }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar el promedio');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const sortedTechnicians = calculatePerformance(technicians, evaluaciones)
    .sort((a, b) => b.promedio - a.promedio);

  useEffect(() => {
    sortedTechnicians.forEach(tech => {
      updateTechnicianAverage(tech);
    });
  }, [sortedTechnicians]);


    const tableRef = useRef(null);

    const downloadAsImage = async () => {
    if (!tableRef.current) return;

    const canvas = await html2canvas(tableRef.current, {
      backgroundColor: "#ffffff",     // fondo blanco
      scale: 2,                       // mayor resolución (opcional)
      useCORS: true,                  // por si cargas fuentes o imágenes externas
    });

    /* Convierte canvas a blob 💾 */
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "desempeno_tecnicos.png";
      link.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  };


  const techniciansForPdf = sortedTechnicians.map(t => ({
  ...t,
  categoria: getCategory(Number(t.promedio)), // reutiliza tu lógica
}));


  return (
    <div className="technician-performance">
      <h2 className="title">Desempeño de Técnicos</h2>

<div className="contenedor-reporte-tabla">
    <div className="contenedor-botones-reporte">
      <div className="report-buttons grupo-botones-superior">
  <PDFDownloadLink
    document={<TechnicianPerformanceReport technicians={techniciansForPdf} />}
    fileName="desempeno_tecnicos.pdf"
    className="btn-descargar-pdf"
  >
    {({ loading }) => (loading ? "Generando PDF…" : "📄 Descargar PDF")}
  </PDFDownloadLink>

  <button
    className="btn-previsualizar-pdf"
    onClick={async () => {
      const blob = await pdf(
        <TechnicianPerformanceReport technicians={techniciansForPdf} />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    }}
  >
    👁️ Vista previa
  </button>
</div>

<div className="grupo-boton-inferior">
<button className="btn-descargar-img-pdf" onClick={downloadAsImage}>
        📸 Descargar como PNG
      </button>
      </div>
</div>




      <div ref={tableRef} className="table-responsive">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th>Posición</th>
              <th>Técnico</th>
              <th>Solicitudes Evaluadas</th>
              <th>Puntuación</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {sortedTechnicians.map((tech, index) => {
              const category = getCategory(Number(tech.promedio));
              return (
                <tr key={tech.codigo_trabajador} className={`table-row ${index === 0 ? "first-place" : ""}`}>
                  <td data-label="Posición" className="table-cell">
                    {index === 0 ? <span className="trophy">🏆</span> : index + 1}
                  </td>
                  <td data-label="Técnico" className="table-cell">
                    {tech.nombre_tecnico} {tech.apellido_tecnico}
                  </td>
                  <td data-label="Solicitudes Evaluadas" className="table-cell">{tech.solicitudes}</td>
                  <td data-label="Puntuación" className="table-cell">
                    <div className="performance-details">
                      <div className="stars-display">{category.icon}</div>
                      <span className="score">{tech.promedio}</span>
                    </div>
                  </td>
                  <td data-label="Categoría" className="category-badge table-cell" style={{backgroundColor: category.color}}>
                    {category.label}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
};

export default TechnicianPerformance;
