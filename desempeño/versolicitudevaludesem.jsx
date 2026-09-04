import React, { useState, useEffect } from "react";
import DetalleEvaluacionModal from "./versolicitudevaluada/DetalleEvaluacionModal";
import './estilodesempeño.css';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import ReporteEvaluacionesPDF from "./Reporte/ReporteGEvaluCompletada";

const RequestViewer = ({ solicitudes, feedbacks }) => {
  const [evaluadas, setEvaluadas] = useState([]);
  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtros con persistencia
  const [filtrosEvaluaciones, setFiltrosEvaluaciones] = useState(() => {
    const guardado = sessionStorage.getItem("filtrosEvaluaciones");
    return guardado
      ? JSON.parse(guardado)
      : {
          searchGeneral: "",
          filtroCodigo: "",
          filtroTecnico: "",
          filtroPuntuacion: "",
          filtroCalificacion: "",
          filtroTipoComentario: "",
          filtroCliente: "",
          filtroPrioridad: "",
          fechaDesde: "",
          fechaHasta: "",
        };
  });

  // Guardar en sessionStorage al cambiar filtros
  useEffect(() => {
    sessionStorage.setItem("filtrosEvaluaciones", JSON.stringify(filtrosEvaluaciones));
  }, [filtrosEvaluaciones]);

  // Desestructurar filtros
  const {
    searchGeneral,
    filtroCodigo,
    filtroTecnico,
    filtroPuntuacion,
    filtroCalificacion,
    filtroCliente,
    filtroPrioridad,  
    fechaDesde,
    fechaHasta
  } = filtrosEvaluaciones;

  useEffect(() => {
  const fetchEvaluaciones = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/evaluadas`);
      if (!response.ok) throw new Error('Error al obtener evaluaciones sin feedback');
      const data = await response.json();
      setEvaluadas(data);
    } catch (error) {
      console.error('Error al obtener evaluaciones sin feedback:', error);
    }
  };

  // Llamada inicial
  fetchEvaluaciones();

  // Polling cada 2 segundos
  const interval = setInterval(fetchEvaluaciones, 2000);

  // Limpiar intervalo al desmontar
  return () => clearInterval(interval);
}, []);


  const normalize = (str) =>
    str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";

  const tecnicosActivos = [...new Set(evaluadas.map(ev => `${ev.nombre_tecnico} ${ev.apellido_tecnico}`))];

  const solicitudesEvaluadas = solicitudes.filter(solicitud =>
    evaluadas.some(e => e.id_soli_completada === solicitud.id_soli_completada)
  );

  const filteredEvaluated = solicitudesEvaluadas.filter((solicitud) => {
    const evaluacion = evaluadas.find(ev => ev.id_soli_completada === solicitud.id_soli_completada);
    if (!evaluacion) return false;

    const tecnicoNombre = `${evaluacion.nombre_tecnico} ${evaluacion.apellido_tecnico}`;
    const clienteNombre = `${evaluacion.nombre_cliente} ${evaluacion.apellido_cliente}`;
    const codigo = evaluacion.codigo_ticket;
    const prioridad = evaluacion.prioridad_solicitud ?? "";

    // FILTRO TIPO COMENTARIO
  if (filtrosEvaluaciones.filtroTipoComentario === "comentarioCliente") {
    if (!evaluacion.comentarios_cliente || evaluacion.comentarios_cliente.trim() === "") return false;
  } else if (filtrosEvaluaciones.filtroTipoComentario === "soloTecnica") {
    if (!evaluacion.puntuacion_tecnico || (evaluacion.comentarios_cliente && evaluacion.comentarios_cliente.trim() !== "")) return false;
  }


    const matchCodigo = filtroCodigo === "" || normalize(codigo).includes(normalize(filtroCodigo));
    const matchTecnico = filtroTecnico === "" || tecnicoNombre === filtroTecnico;
    const matchPuntuacion = filtroPuntuacion === "" || evaluacion.puntuacion_tecnico?.toString() === filtroPuntuacion;
    const matchCalificacion = filtroCalificacion === "" || evaluacion.calificacion_cliente?.toString() === filtroCalificacion;
    const matchCliente = filtroCliente === "" || normalize(clienteNombre).includes(normalize(filtroCliente));
    const matchPrioridad = 
  filtroPrioridad === "" || 
  normalize(prioridad).includes(normalize(filtroPrioridad));

    const fechaEvaluacion = evaluacion.fecha_evaluacion_tecnico?.slice(0, 10); // Extraemos YYYY-MM-DD

const matchFechaDesde = !fechaDesde || (fechaEvaluacion && fechaEvaluacion >= fechaDesde);
const matchFechaHasta = !fechaHasta || (fechaEvaluacion && fechaEvaluacion <= fechaHasta);


    const matchSearchGeneral =
      searchGeneral === "" ||
      normalize(codigo).includes(normalize(searchGeneral)) ||
      normalize(tecnicoNombre).includes(normalize(searchGeneral)) ||
      normalize(clienteNombre).includes(normalize(searchGeneral)) ||
      evaluacion.puntuacion_tecnico?.toString().includes(searchGeneral) ||
      evaluacion.calificacion_cliente?.toString().includes(searchGeneral) ||
       prioridad.toLowerCase().includes(normalize(searchGeneral));

    return (
      matchCodigo &&
      matchTecnico &&
      matchPuntuacion &&
      matchCalificacion &&
      matchCliente &&
      matchSearchGeneral &&
      matchPrioridad &&
      matchFechaDesde &&
      matchFechaHasta
    );
  });

  return (
    <div className="request-viewer">
      <h2 className="title">Solicitudes Evaluadas</h2>

      <section>

        <div className="search-bar">
  <input
    type="text"
    placeholder="Buscar por cualquier campo..."
    value={searchGeneral}
    onChange={(e) =>
      setFiltrosEvaluaciones((prev) => ({
        ...prev,
        searchGeneral: e.target.value,
      }))
    }
    className="search-input-eva input-filtro input-filtroo"
  />

  <div className="contenedor-filtros-avanzado">
  <button className="btn-toggle-filtros" onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}>
    {showAdvancedFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}
  </button>


{showAdvancedFilters && (
  <div className="filtros-avanzados-container">
    <div>
      <label>Código de Ticket:</label>
      <input
        type="text"
        placeholder="Ej: TK1234"
        value={filtroCodigo}
        onChange={(e) => {
          const regex = /^[a-zA-Z0-9-]*$/;
          if (regex.test(e.target.value)) {
            setFiltrosEvaluaciones((prev) => ({
              ...prev,
              filtroCodigo: e.target.value,
            }));
          }
        }}
        className="input-filtro"
      />
    </div>

    <div>
      <label>Prioridad del ticket:</label>
      <select
        value={filtroPrioridad}
        onChange={(e) =>
          setFiltrosEvaluaciones((prev) => ({
            ...prev,
            filtroPrioridad: e.target.value,
          }))
        }
        className="input-filtro"
      >
        <option value="">Todas</option>
        <option value="Alta">Alta</option>
        <option value="Media">Media</option>
        <option value="Baja">Baja</option>
      </select>
    </div>

    <div>
      <label>Técnico:</label>
      <select
        value={filtroTecnico}
        onChange={(e) =>
          setFiltrosEvaluaciones((prev) => ({
            ...prev,
            filtroTecnico: e.target.value,
          }))
        }
        className="input-filtro"
      >
        <option value="">Todos</option>
        {tecnicosActivos.map((tec, idx) => (
          <option key={idx} value={tec}>{tec}</option>
        ))}
      </select>
    </div>

    <div>
  <label>Tipo de evaluación:</label>
  <select
    value={filtrosEvaluaciones.filtroTipoComentario}
    onChange={(e) =>
      setFiltrosEvaluaciones((prev) => ({
        ...prev,
        filtroTipoComentario: e.target.value,
      }))
    }
    className="input-filtro"
  >
    <option value="">Todos</option>
    <option value="comentarioCliente">Con comentario del cliente</option>
    <option value="soloTecnica">Solo puntuación técnica (sin comentario)</option>
  </select>
</div>


    <div>
      <label>Puntuación técnica:</label>
      <select
        value={filtroPuntuacion}
        onChange={(e) =>
          setFiltrosEvaluaciones((prev) => ({
            ...prev,
            filtroPuntuacion: e.target.value,
          }))
        }
        className="input-filtro"
      >
        <option value="">Todas</option>
        {[1, 2, 3, 4, 5].map(val => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>

    <div>
      <label>Calificación cliente:</label>
      <select
        value={filtroCalificacion}
        onChange={(e) =>
          setFiltrosEvaluaciones((prev) => ({
            ...prev,
            filtroCalificacion: e.target.value,
          }))
        }
        className="input-filtro"
      >
        <option value="">Todas</option>
        {[1, 2, 3, 4, 5].map(val => (
          <option key={val} value={val}>{val}</option>
        ))}
      </select>
    </div>

    <div>
      <label>Cliente:</label>
      <input
        type="text"
        placeholder="Nombre o apellido del cliente"
        value={filtroCliente}
        onChange={(e) => {
          const valor = e.target.value;
          const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;

          if (soloLetras.test(valor)) {
            setFiltrosEvaluaciones((prev) => ({
              ...prev,
              filtroCliente: valor,
            }));
          }
        }}

        className="input-filtro"
      />
    </div>

<div>
  <label>Desde (fecha evaluación):</label>
  <input
    type="date"
    value={fechaDesde}
    onChange={(e) =>
      setFiltrosEvaluaciones((prev) => ({
        ...prev,
        fechaDesde: e.target.value
      }))
    }
    className="input-filtro"
  />
</div>

<div>
  <label>Hasta (fecha evaluación):</label>
  <input
    type="date"
    value={fechaHasta}
    onChange={(e) =>
      setFiltrosEvaluaciones((prev) => ({
        ...prev,
        fechaHasta: e.target.value
      }))
    }
    className="input-filtro"
  />
</div>

    

<button
  className="btn-limpiar-filtros"
  onClick={() =>
    setFiltrosEvaluaciones({
    searchGeneral: "",
    filtroCodigo: "",
    filtroTecnico: "",
    filtroPuntuacion: "",
    filtroCalificacion: "",
    filtroPrioridad: "",
    filtroCliente: "",
    fechaDesde: "",   // <- corregido
    fechaHasta: ""    // <- corregido
  })
  }
>
  Borrar filtros
</button>

  </div>
)}
</div>
</div>
        
      </section>


        <div>
                        {filteredEvaluated.length > 0 && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          
          {/* Previsualización */}
          <button
            className="btn-previsualizar-pdf"
            onClick={async () => {
              const blob = await pdf(<ReporteEvaluacionesPDF evaluaciones={
  evaluadas.filter(ev => 
    filteredEvaluated.some(s => s.id_soli_completada === ev.id_soli_completada)
  )
} />
).toBlob();
              const url = URL.createObjectURL(blob);
              window.open(url, '_blank');
            }}
          >
            👁️ Ver vista previa
          </button>
      
          {/* Descarga */}
          <PDFDownloadLink
            document={<ReporteEvaluacionesPDF evaluaciones={
  evaluadas.filter(ev => 
    filteredEvaluated.some(s => s.id_soli_completada === ev.id_soli_completada)
  )
} />
}
            fileName={`Solicitudes-Filtradas.pdf`}
            className="btn-descargar-pdf"
          >
            {({ loading }) => (loading ? 'Generando...' : 'Descargar PDF')}
          </PDFDownloadLink>
        </div>
      )}
      
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
