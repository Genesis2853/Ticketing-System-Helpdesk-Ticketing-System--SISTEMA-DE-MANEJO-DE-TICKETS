import React, { useState, useEffect } from "react";
import DetalleEvaluacionModal from "./versolicitudevaluada/DetalleEvaluacionModal";
import './estilodesempeño.css';

const RequestViewer = ({ solicitudes, feedbacks }) => {
  const [evaluadas, setEvaluadas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("nombre_tecnico");
  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filters = {
  tecnico: ["nombre_tecnico", "apellido_tecnico", "codigo_trabajador"], // o el id que uses
  cliente: ["nombre_cliente", "apellido_cliente", "id_cliente"], // agrega los campos que necesites
  puntuacion_tecnico: ["puntuacion_tecnico"],
  calificacion_cliente: ["calificacion_cliente"],
};


  useEffect(() => {
    const fetchEvaluaciones = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/evaluadas`);
        if (!response.ok) {
          throw new Error('Error al obtener evaluaciones sin feedback');
        }
        const data = await response.json();
        setEvaluadas(data);
      } catch (error) {
        console.error('Error al obtener evaluaciones sin feedback:', error);
      }
    };

    fetchEvaluaciones();
  }, []);

  const solicitudesEvaluadas = solicitudes.filter(solicitud =>
    evaluadas.some(evaluada => evaluada.id_soli_completada === solicitud.id_soli_completada)
  );

  const normalizeString = (str) => {
    return str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  };

  const filteredEvaluated = solicitudesEvaluadas.filter(solicitud => {
    const evaluacion = evaluadas.find(ev => ev.id_soli_completada === solicitud.id_soli_completada);
    if (!evaluacion) return false;

    // Filtrar según el campo seleccionado
    const searchValue = normalizeString(searchTerm);
    switch (selectedFilter) {
      case "nombre_tecnico": {
        const nombreTecnico = normalizeString(evaluacion.nombre_tecnico);
        return nombreTecnico.includes(searchValue);
      }
      case "apellido_tecnico": {
        const apellidoTecnico = normalizeString(evaluacion.apellido_tecnico);
        return apellidoTecnico.includes(searchValue);
      }
      case "nombre_cliente": {
        const nombreCliente = normalizeString(evaluacion.nombre_cliente);
        return nombreCliente.includes(searchValue);
      }
      case "apellido_cliente": {
        const apellidoCliente = normalizeString(evaluacion.apellido_cliente);
        return apellidoCliente.includes(searchValue);
      }
      case "puntuacion_tecnico": {
        const puntuacionTecnico = evaluacion.puntuacion_tecnico !== null ? evaluacion.puntuacion_tecnico.toString() : '';
        return puntuacionTecnico.includes(searchValue);
      }
      case "calificacion_cliente": {
        const calificacionValida = evaluacion.calificacion_cliente !== null;
        return calificacionValida && evaluacion.calificacion_cliente.toString().includes(searchValue);
      }
      default:
        return false;
    }
  });

  return (
    <div className="request-viewer">
      <h2 className="title">Solicitudes Evaluadas</h2>


      <div className="filter-controls">
        <div className="filter-selector">
          <label htmlFor="filter-type">Filtrar por: </label>
          <select 
            id="filter-type" 
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            {Object.entries(filters).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        <div className="search-input-eva">
          <input
            type="text"
            placeholder={`Buscar por ${filters[selectedFilter]}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredEvaluated.length === 0 ? (
        <p>No se encontraron solicitudes que coincidan con el filtro.</p>
      ) : (
        <div className="evaluated-requests">
          {filteredEvaluated.map((solicitud) => {
            const evaluacion = evaluadas.find(ev => ev.id_soli_completada === solicitud.id_soli_completada);
            if (!evaluacion) return null;

            const evaluacionIdFeedback = evaluacion.id_feedback === null ? null : Number(evaluacion.id_feedback);
            const tieneFeedback = feedbacks.some(fb => Number(fb.id_feedback) === evaluacionIdFeedback);

            return (
              <div 
                key={evaluacion.id_evaluaciones} 
                className="request-item"
                onClick={() => {
                  setSelectedEvaluacion(evaluacion);
                  setModalOpen(true);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div>
                  <strong>{evaluacion.codigo_ticket}</strong> - Técnico: {evaluacion.nombre_tecnico} {evaluacion.apellido_tecnico} 
                  <p><strong>Puntuación Técnica:</strong> {evaluacion.puntuacion_tecnico}</p>
                  <p><strong>Comentario Técnico:</strong> {evaluacion.comentario_puntuacion_tecnico}</p>
                  <p><strong>Calificación Cliente:</strong> {evaluacion.calificacion_cliente}</p>
                  <p><strong>Comentarios Cliente:</strong> {evaluacion.comentarios_cliente}</p>
                </div>
                <div className="feedback-status">
                  <span className="evaluated-tag" title="Evaluación interna realizada">✅</span>
                  {tieneFeedback ? (
                    <span className="client-feedback-tag" title="Opinión del cliente presente">✅</span>
                  ) : (
                    <span className="client-feedback-missing" title="Sin opinión del cliente">❌</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para detalles de evaluación */}
      {selectedEvaluacion && (
        <DetalleEvaluacionModal 
          evaluacion={selectedEvaluacion} 
          open={modalOpen} 
          onClose={() => setModalOpen(false)} 
        />
      )}
    </div>
  );
};

export default RequestViewer;
