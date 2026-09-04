import React, { useState } from "react";
import './estilodesempeño.css';
// ⬇️ estos imports son los únicos nuevos
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import ReporteDesempeño from "../Reportecliente/ReporteDesempeño";

const EvaluationForm = ({ solicitudes, evaluaciones, evaluadas, feedbacks, onSubmit, user, permisos }) => {
    const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
    const [puntuacion_tecnico, setPuntuacion] = useState(0);
    const [comentario_puntuacion_tecnico, setComentario] = useState("");
    const [id_feedback, setIdFeedback] = useState("");
    const [solicitudevaluacioneseleccionada, setSolicitudevaluacioneseleccionada] = useState(null);
    const [showPreview, setShowPreview] = useState(false)
    

    // Filtrar solicitudes no evaluadas
    const solicitudesNoevaluaciones = solicitudes.filter(s =>
        !evaluadas.some(e => e.id_soli_completada === s.id_soli_completada)
    );

    // Filtrar evaluaciones que no tienen feedback
    const evaluacionesSinFeedback = evaluaciones.filter(ev => ev.id_feedback === null);

    // Obtener el objeto feedback seleccionado actual para acceder a sus comentarios_cliente
    const feedbackSeleccionado = id_feedback ? feedbacks.find(fb => String(fb.id_feedback) === String(id_feedback)) : null;

    const handleSolicitudChange = (e) => {
        const selectedSolicitud = solicitudesNoevaluaciones.find(s => s.id_soli_completada === e.target.value);
        setSolicitudSeleccionada(selectedSolicitud);
        setSolicitudevaluacioneseleccionada(null); // Resetear selección de evaluaciones
        setIdFeedback(""); // Resetear feedback
        setPuntuacion(0); // Resetear puntuación
        setComentario(""); // Resetear comentario
    };

    const handleEvaluacionChange = (e) => {
        const selectedEvaluacion = evaluacionesSinFeedback.find(ev => ev.id_soli_completada === e.target.value);
        setSolicitudevaluacioneseleccionada(selectedEvaluacion);
        setSolicitudSeleccionada(null); // Resetear selección de solicitudes pendientes
        setIdFeedback(selectedEvaluacion.id_feedback || ""); // Cargar feedback si existe
        setPuntuacion(selectedEvaluacion.puntuacion_tecnico || 0); // Cargar puntuación si existe
        setComentario(selectedEvaluacion.comentario_puntuacion_tecnico || ""); // Cargar comentario si existe
    };

    const handleSubmit = () => {
        const selectedSolicitud = solicitudSeleccionada || solicitudevaluacioneseleccionada;
        if (!selectedSolicitud) {
            alert("Selecciona una solicitud antes de evaluar.");
            return;
        }
        const tecnicoID = selectedSolicitud.codigo_trabajador;
        const evaluationData = {
            id_soli_completada: selectedSolicitud.id_soli_completada,
            codigo_trabajador: tecnicoID,
            puntuacion_tecnico: puntuacion_tecnico, // Para evaluación interna
            comentario_puntuacion_tecnico: comentario_puntuacion_tecnico,
            calificacion_cliente: feedbackSeleccionado ? feedbackSeleccionado.calificacion_cliente : null,
            comentarios_cliente: feedbackSeleccionado ? feedbackSeleccionado.comentarios_cliente : null,
            id_feedback: id_feedback === "" ? null : id_feedback
        };

        // Si la solicitud ya fue evaluada, solo actualizamos los campos del cliente
        if (solicitudevaluacioneseleccionada) {
            evaluationData.puntuacion_tecnico = solicitudevaluacioneseleccionada.puntuacion_tecnico; // Mantener puntuación interna
            evaluationData.comentario_puntuacion_tecnico = solicitudevaluacioneseleccionada.comentario_puntuacion_tecnico; // Mantener comentario interno
        }

        onSubmit(evaluationData);
    };

const getReporteData = () => {
    const s  = solicitudSeleccionada || solicitudevaluacioneseleccionada;
    if (!s) return null;

    const fb = feedbacks.find(f => Number(f.id_feedback) === Number(id_feedback)) || {};

    return {
      /* sección solicitud */
      id_soli_completada: s.id_soli_completada,
      codigo_solicitud:   s.codigo_solicitud,
      estado_solicitud:   s.estado_solicitud,
      comentario_trabajo_realizado: s.comentario_trabajo_realizado,
      nombre_tecnico:     s.nombre_tecnico,
      apellido_tecnico:   s.apellido_tecnico,
      tipo_solucion_falla:s.tipo_solucion_falla,
      fecha_caso_cerrado: s.fecha_caso_cerrado,
      id_datosvisita:     s.id_datosvisita,
      id_historial_cambioestado:s.id_historial_cambioestado,
      herramientas_utilizadas: s.herramientas_utilizadas,
      tiempo_invertido:   s.tiempo_invertido,

      /* sección evaluación */
      puntuacion_tecnico,
      comentario_puntuacion_tecnico,
      fecha_evaluacion_tecnico: s.fecha_evaluacion_tecnico,
      id_feedback: id_feedback || null,
      comentarios_cliente: fb.comentarios_cliente || null,
      calificacion_cliente: fb.calificacion_cliente || null,
    };
  };

function tienePermiso(user, permisoRequerido) {
  return user?.permisos_usuarios?.includes(permisoRequerido);
}



  

    return (
        <div className="evaluation-form">
            <h2 className="title">Evaluación Interna</h2>

 

           {(solicitudSeleccionada || solicitudevaluacioneseleccionada) && (
  <div
    style={{
      border: '1px solid #ccc',
      borderRadius: '8px',
      padding: '16px',
      backgroundColor: '#f9f9f9',
      maxWidth: '600px',
      margin: '20px auto',
      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
      color: '#333',
      lineHeight: '1.5',
    }}
  >
    {solicitudevaluacioneseleccionada && (
      <>
        <h3 style={{ marginBottom: '12px', color: '#1976d2' }}>
          Informe de {solicitudevaluacioneseleccionada.codigo_ticket}
        </h3>
        <p><strong>Técnico asignado:</strong> {solicitudevaluacioneseleccionada.nombre_tecnico} {solicitudevaluacioneseleccionada.apellido_tecnico}</p>
        <p><strong>Descripción:</strong> {solicitudevaluacioneseleccionada.comentario_trabajo_realizado}</p>
        <p><strong>Fecha Solicitud:</strong> {new Date(solicitudevaluacioneseleccionada.fecha_caso_cerrado).toLocaleString()}</p>
        <p><strong>Cliente:</strong> {solicitudevaluacioneseleccionada.nombre_cliente} {solicitudevaluacioneseleccionada.apellido_cliente}</p>
        <p><strong>Email:</strong> {solicitudevaluacioneseleccionada.email_cliente}</p>
        <p><strong>Teléfono:</strong> {solicitudevaluacioneseleccionada.n_tlf_cliente}</p>
        <p><strong>Estado:</strong> {solicitudevaluacioneseleccionada.estado_solicitud}</p>
        <p><strong>Comentario:</strong> {solicitudevaluacioneseleccionada.comentario_trabajo_realizado}</p>
      </>
    )}
    {solicitudSeleccionada && (
      <>
        <h3 style={{ marginBottom: '12px', color: '#1976d2' }}>
          Informe de {solicitudSeleccionada.codigo_ticket}
        </h3>
        <p><strong>Técnico asignado:</strong> {solicitudSeleccionada.nombre_tecnico} {solicitudSeleccionada.apellido_tecnico}</p>
        <p><strong>Descripción:</strong> {solicitudSeleccionada.comentario_trabajo_realizado}</p>
        <p><strong>Fecha Solicitud:</strong> {new Date(solicitudSeleccionada.fecha_caso_cerrado).toLocaleString()}</p>
        <p><strong>Cliente:</strong> {solicitudSeleccionada.nombre_cliente} {solicitudSeleccionada.apellido_cliente}</p>
        <p><strong>Email:</strong> {solicitudSeleccionada.email_cliente}</p>
        <p><strong>Teléfono:</strong> {solicitudSeleccionada.n_tlf_cliente}</p>
        <p><strong>Estado:</strong> {solicitudSeleccionada.estado_solicitud}</p>
        <p><strong>Comentario:</strong> {solicitudSeleccionada.comentario_trabajo_realizado}</p>
      </>
    )}
  </div>
)}


            {/* Select para solicitud no evaluada */}
            <div className="select-container">
                <select onChange={handleSolicitudChange} value={solicitudSeleccionada ? solicitudSeleccionada.id_soli_completada : ""}>
                    <option value="">Selecciona una solicitud no evaluada</option>
                    {solicitudesNoevaluaciones.map(s => (
                        <option key={s.id_soli_completada} value={s.id_soli_completada}>
                            {s.codigo_ticket} - {s.nombre_tecnico} {s.apellido_tecnico}
                        </option>
                    ))}
                </select>
            </div>

            {/* Select para solicitud evaluada sin feedback */}
            <div className="select-container">
                <select onChange={handleEvaluacionChange} value={solicitudevaluacioneseleccionada ? solicitudevaluacioneseleccionada.id_soli_completada : ""}>
                    <option value="">Selecciona una solicitud evaluada sin opinión del cliente</option>
                    {evaluacionesSinFeedback.map(ev => (
                        <option key={ev.id_soli_completada} value={ev.id_soli_completada}>
                            {ev.codigo_ticket} - {ev.codigo_trabajador}
                        </option>
                    ))}
                </select>
            </div>

            {/* Estrellas para puntuación */}
            <p>Calificación:</p>
            <div className="stars-container">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        onClick={() => setPuntuacion(star)}
                        className={`star-button ${puntuacion_tecnico === star ? 'selected' : ''}`}
                        type="button"
                        aria-label={`Calificación ${star} estrella${star > 1 ? 's' : ''}`}
                    >
                        ⭐{star}
                    </button>
                ))}
            </div>

            {/* Select para feedback cliente */}
            <div className="feedback-selection">
                <label htmlFor="feedback-select">Selecciona una opinión del cliente:</label>
                <div className="select-container">
                    <select id="feedback-select" onChange={(e) => setIdFeedback(e.target.value)} value={id_feedback}>
                        <option value="">No usar opinión del cliente</option>
                        {feedbacks.map(feedback => (
                            <option key={feedback.id_feedback} value={feedback.id_feedback}>
                                {feedback.id_feedback} - {feedback.codigo_trabajador} - {feedback.calificacion_cliente}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Textarea para comentarios internos */}
            <textarea
                value={comentario_puntuacion_tecnico}
                onChange={(e) => setComentario(e.target.value)}
                placeholder="Comentarios internos"
                rows={4}
            />

            {/* Botón para guardar evaluación */}
            {(user?.tipo_usuario === 'Admin' || (user?.tipo_usuario === 'Moderador' && tienePermiso(user, "crear_evaluacion"))) && (
            <button
  onClick={handleSubmit}
  style={{
    backgroundColor: '#1976d2',
    color: '#fff',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    transition: 'background-color 0.3s',
  }}
  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#1565c0')}
  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
>
  Guardar Evaluación
</button>
)}

        </div>
    );
};

export default EvaluationForm;
