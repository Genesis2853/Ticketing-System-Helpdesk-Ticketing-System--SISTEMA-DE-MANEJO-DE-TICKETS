import React, { useEffect, useState } from 'react';
import { PDFDownloadLink, PDFViewer } from '@react-pdf/renderer';
import FeedbackPDFDocument from './FeedbackPDFDocument';
import './estilodesempeño.css';

const CustomerFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);        // Lista para mostrar (filtrada)
  const [feedbackstotal, setFeedbacksTotal] = useState([]);
  const [feedbacksPdf, setFeedbacksPdf] = useState([]);  // Todos para PDF general
  const [busquedaGlobal, setBusquedaGlobal] = useState('');
const [modalListadoAbierto, setModalListadoAbierto] = useState(false);
const [feedbackSeleccionado, setFeedbackSeleccionado] = useState(null);


  const [preview, setPreview] = useState(false);

const [mostrarFiltrosAvanzadosModal, setMostrarFiltrosAvanzadosModal] = useState(false);
 const [mostrarFiltros, setMostrarFiltros] = useState(false);
const [tecnicosDisponibles, setTecnicosDisponibles] = useState([]);

const [filtrosAvanzados, setFiltrosAvanzados] = useState(() => {
  const guardado = sessionStorage.getItem("filtrosFeedback");
  return guardado ? JSON.parse(guardado) : {
    cliente: '',
    tecnico: '',
    puntuacion: '',
    fechaDesde: '',
    fechaHasta: '',
    codigoTicket: '',
  };
});

useEffect(() => {
  sessionStorage.setItem("filtrosFeedback", JSON.stringify(filtrosAvanzados));
}, [filtrosAvanzados]);

const [busquedaModal, setBusquedaModal] = useState('');
const [filtrosModal, setFiltrosModal] = useState({
  cliente: '',
  tecnico: '',
  puntuacion: '',
  fechaDesde: '',
  fechaHasta: '',
  codigoTicket: '',
});
const [previewModal, setPreviewModal] = useState(false);


  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/feedbacks-sin-evaluacion`);
        const data = await res.json();
        setFeedbacks(data);
     
      } catch (e) {
        console.error('Error cargando feedbacks sin evaluación:', e);
      }
    })();

    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/feedbacks`);
        const data = await res.json();
        setFeedbacksPdf(data);
      } catch (e) {
        console.error('Error cargando todos los feedbacks para PDF:', e);
      }
    })();

    (async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/feedbacks/total`);
        const data = await res.json();
        setFeedbacksTotal(data);
      } catch (e) {
        console.error('Error cargando todos los feedbacks:', e);
      }
    })();
  }, []);



  useEffect(() => {
  const tecnicosUnicos = [
    ...new Set(feedbacks.map(f => `${f.nombre_tecnico} ${f.apellido_tecnico}`))
  ];
  setTecnicosDisponibles(tecnicosUnicos);
}, [feedbacks]);






  const normaliza = v => String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  const filtrados = feedbacks.filter(fb => {


  const matchGeneral =
    normaliza(fb.correo_feedback_cliente).includes(normaliza(busquedaGlobal)) ||
    normaliza(fb.codigo_ticket).includes(normaliza(busquedaGlobal)) ||
    normaliza(fb.nombre_tecnico).includes(normaliza(busquedaGlobal)) ||
    normaliza(fb.apellido_tecnico).includes(normaliza(busquedaGlobal)) ||
    normaliza(fb.nombre_apellido_cliente).includes(normaliza(busquedaGlobal)) ||
    normaliza(String(fb.calificacion_cliente)).includes(normaliza(busquedaGlobal)); // ✅ búsqueda por puntuación

  // Filtros avanzados
  const matchCliente = normaliza(fb.nombre_apellido_cliente).includes(normaliza(filtrosAvanzados.cliente));
  const matchCodigo = normaliza(fb.codigo_ticket).includes(normaliza(filtrosAvanzados.codigoTicket));

  const matchTecnico = filtrosAvanzados.tecnico
    ? `${fb.nombre_tecnico} ${fb.apellido_tecnico}` === filtrosAvanzados.tecnico
    : true;

  const matchRating = filtrosAvanzados.puntuacion
    ? String(fb.calificacion_cliente) === filtrosAvanzados.puntuacion
    : true;

  const fechaFb = fb.fecha_feedback_prueba?.slice(0, 10) || "";

  const matchFecha =
    (!filtrosAvanzados.fechaDesde || fechaFb >= filtrosAvanzados.fechaDesde) &&
    (!filtrosAvanzados.fechaHasta || fechaFb <= filtrosAvanzados.fechaHasta);

  return matchGeneral && matchTecnico && matchCliente && matchCodigo && matchRating && matchFecha;
});

const feedbacksFiltradosModal = feedbackstotal.filter(fb => {
  const matchGeneral =
    normaliza(fb.correo_feedback_cliente).includes(normaliza(busquedaModal)) ||
    normaliza(fb.codigo_ticket).includes(normaliza(busquedaModal)) ||
    normaliza(fb.nombre_tecnico).includes(normaliza(busquedaModal)) ||
    normaliza(fb.apellido_tecnico).includes(normaliza(busquedaModal)) ||
    normaliza(fb.nombre_apellido_cliente).includes(normaliza(busquedaModal)) ||
    normaliza(String(fb.calificacion_cliente)).includes(normaliza(busquedaModal));

  const matchCliente = normaliza(fb.nombre_apellido_cliente).includes(normaliza(filtrosModal.cliente));
  const matchCodigo = normaliza(fb.codigo_ticket).includes(normaliza(filtrosModal.codigoTicket));

  const matchTecnico = filtrosModal.tecnico
    ? `${fb.nombre_tecnico} ${fb.apellido_tecnico}` === filtrosModal.tecnico
    : true;

  const matchRating = filtrosModal.puntuacion
    ? String(fb.calificacion_cliente) === filtrosModal.puntuacion
    : true;

  const fechaFb = fb.fecha_feedback_prueba?.slice(0, 10) || "";

  const matchFecha =
    (!filtrosModal.fechaDesde || fechaFb >= filtrosModal.fechaDesde) &&
    (!filtrosModal.fechaHasta || fechaFb <= filtrosModal.fechaHasta);

  return matchGeneral && matchCliente && matchCodigo && matchTecnico && matchRating && matchFecha;
});


  return (
    <div className="customer-feedback-container">

      <div className="title-encabezado">
      <h2 className="title">Opiniones del Cliente</h2>

      {/* Barra de filtros */}
      <section className="filters-bar">
  <input
    type="text"
    placeholder="Búsqueda general (correo, técnico, cliente, código)..."
    value={busquedaGlobal}
    onChange={e => setBusquedaGlobal(e.target.value)}
    className="search-input search-input-ticket search-cliente"
  />

<div className="contenedor-filtros-avanzado">
  <button
  className="btn-toggle-filtro"
  onClick={() => setMostrarFiltros(prev => !prev)}
>
  {mostrarFiltros ? 'Ocultar filtros avanzados ▲' : 'Mostrar filtros avanzados ▼'}
</button>

{mostrarFiltros && (
  <div className="filtros-avanzados-container">
<div className="filtro-item">
  <label>Cliente:</label>
  <input
    type="text"
    value={filtrosAvanzados.cliente}
    onChange={e => {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
      if (regex.test(e.target.value)) {
        setFiltrosAvanzados(prev => ({ ...prev, cliente: e.target.value }));
      }
    }}
    placeholder="Nombre del cliente"
    className="input-filtro"
  />
</div>

<div className="filtro-item">
  <label>Código de ticket:</label>
  <input
    type="text"
    value={filtrosAvanzados.codigoTicket}
    onChange={e => {
      const regex = /^[a-zA-Z0-9-]*$/;
      if (regex.test(e.target.value)) {
        setFiltrosAvanzados(prev => ({ ...prev, codigoTicket: e.target.value }));
      }
    }}
    placeholder="Ej: TICKET123"
    className="input-filtro"
  />
</div>

<div className="filtro-item">
  <label>Técnico:</label>
  <input
    type="text"
    value={filtrosAvanzados.tecnico}
    onChange={e => {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]*$/;
      if (regex.test(e.target.value)) {
        setFiltrosAvanzados(prev => ({ ...prev, tecnico: e.target.value }));
      }
    }}
    placeholder="Nombre del técnico"
    className="input-filtro"
  />
</div>


<div className="filtro-item">
  <label htmlFor="filtro-puntuacion">Puntuación del cliente:</label>
  <select
    id="filtro-puntuacion"
    value={filtrosAvanzados.puntuacion}
    onChange={e =>
      setFiltrosAvanzados(prev => ({
        ...prev,
        puntuacion: e.target.value,
      }))
    }
    className="input-filtro"
  >
    <option value="">Todas</option>
    {[5, 4, 3, 2, 1].map(n => (
      <option key={n} value={n}>
        {`${'⭐'.repeat(n)} (${n})`}
      </option>
    ))}
  </select>
</div>



    <div className="filtro-item">
      <label>Desde:</label>
      <input
        type="date"
        value={filtrosAvanzados.fechaDesde}
        onChange={e =>
          setFiltrosAvanzados(prev => ({ ...prev, fechaDesde: e.target.value }))
        }
        className="input-filtro"
      />
    </div>

    <div className="filtro-item">
      <label>Hasta:</label>
      <input
        type="date"
        value={filtrosAvanzados.fechaHasta}
        onChange={e =>
          setFiltrosAvanzados(prev => ({ ...prev, fechaHasta: e.target.value }))
        }
        className="input-filtro"
      />
    </div>
    <button
  onClick={() => setFiltrosAvanzados({ cliente: '',
    tecnico: '',
    puntuacion: '',
    fechaDesde: '',
    fechaHasta: '',
    codigoTicket: '', })}
  className="btn-limpiar-filtros"
>
  Limpiar filtros
</button>
  </div>
)}
</div>

      </section>


      </div>

      {/* Solo botón para PDF general */}
      <div style={{ margin: '15px 0' }}>
        {filtrados.length > 0 && (
          <>
<button
  onClick={() => setPreview('general')}
  style={{
    backgroundColor: 'white',
    color: '#c62828',
    padding: '5.5px 13px',
    border: '1px solid',
    borderRadius: '6px',
    borderColor: '#c62828',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    transition: 'background-color 0.3s',
  }}
  onMouseOver={e => (e.currentTarget.style.backgroundColor = 'rgb(223, 214, 214)')}
  onMouseOut={e => (e.currentTarget.style.backgroundColor = 'white')}
>
  👁️ Previsualizar reporte PDF general
</button>

            <div
  style={{
    display: 'inline-block',
    marginLeft: 10,
    backgroundColor: '#c62828',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    textAlign: 'center',
    userSelect: 'none',
  }}
  onClick={e => {
    // Prevent default link styles and propagate click to PDFDownloadLink
    e.stopPropagation();
  }}
>
  <PDFDownloadLink
    document={<FeedbackPDFDocument feedbacks={filtrados} />}
    fileName={`reporte_feedbacks_sin_asignar_completo.pdf`}
    style={{
      textDecoration: 'none',
      color: 'inherit',
      cursor: 'pointer',
      display: 'block',
    }}
  >
    {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar reporte PDF general')}
  </PDFDownloadLink>
</div>

          </>
        )}
      </div>

      {/* Carrusel cards con feedbacks filtrados */}
      <div className="feedback-horizontal-scroll">
        <div className="feedback-cards-container">
          {filtrados.length ? (
            filtrados.map(fb => (
              <div key={fb.id_feedback} className="feedback-card">
                <div className="feedback-header">
                  <span className="feedback-id">N°: {fb.id_feedback}</span>
                  <span className="request-id">Solicitud: {fb.codigo_ticket || 'no disponible'} </span>
                </div>

                <div className="feedback-technician">
                  <strong>Técnico:</strong> {fb.nombre_tecnico}{fb.apellido_tecnico}
                </div>

                <div className="rating-container">
                  <div className="stars-bar" style={{ '--rating': fb.calificacion_cliente }}>
                    ★★★★★
                  </div>
                  <span className="rating-value">({fb.calificacion_cliente}/5)</span>
                </div>

                <div className="feedback-comment scrollable">
                  {fb.comentarios_cliente || 'Sin comentarios'}
                </div>

                <div className="feedback-date">
                  <small>
                    Fecha: {
                      isNaN(new Date(fb.fecha_feedback_prueba))
                        ? 'Fecha inválida'
                        : new Date(fb.fecha_feedback_prueba).toLocaleDateString()
                    }
                  </small>
                </div>

                <div className="feedback-client">
                  <small>
                    <strong>Cliente:</strong> {fb.nombre_apellido_cliente}
                  </small>
                </div>
              </div>
            ))
          ) : (
            <div className="no-feedback"><p>No hay opiniones disponibles</p></div>
          )}
        </div>
      </div>

      {/* Modal previsualización PDF */}
      {preview === 'general' && (
        <div
          className="pdf-preview-overlay"
          style={{
            position: 'fixed',
            top: 0, left: 0,
            width: '100vw', height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setPreview(false)}
        >
          <div
            style={{ width: '80vw', height: '90vh', backgroundColor: 'white', position: 'relative' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setPreview(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 10000,
                padding: '5px 10px',
                cursor: 'pointer',
              }}
            >
              Cerrar
            </button>

            <PDFViewer width="100%" height="100%">
              <FeedbackPDFDocument feedbacks={filtrados} />
            </PDFViewer>
          </div>
        </div>
      )}



      <button
  onClick={() => setModalListadoAbierto(true)}
  className="btn-ver-todas-encuestas"
  style={{
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '14px',
    marginLeft: '10px',
    transition: 'background-color 0.3s',
  }}
  onMouseOver={e => (e.currentTarget.style.backgroundColor = '#1367bbff')}
  onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1976d2')}
>
  Ver todas las encuestas
</button>


{modalListadoAbierto && (
  <div
    className="modal-encuestas-overlay"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000,
    }}
    onClick={() => setModalListadoAbierto(false)}
  >
    <div
      className="modal-encuestas-content"
      style={{
        width: '90%',
        height: '85%',
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'row',
        borderRadius: '10px',
        overflow: 'hidden',
         position: 'relative',
      }}
      onClick={e => e.stopPropagation()}
    >

      <button
        onClick={() => setModalListadoAbierto(false)}
        style={{
          position: 'absolute',
          top: 10,
          right: 15,
          background: 'transparent',
          border: 'none',
          fontSize: '24px',
          fontWeight: 'bold',
          cursor: 'pointer',
          color: '#444',
          zIndex: 10001,
        }}
        title="Cerrar"
      >
        &times;
      </button>

      {/* Sección izquierda: Lista */}
      {/* Sección izquierda: Lista + Filtros */}
<div className="modal-encuestas-sidebar" style={{
    width: '35%',
    maxHeight: '50%',
    overflowY: 'auto',
    borderRight: '1px solid #ddd',
    padding: '10px'
  }}>
  <h3>Encuestas</h3>

  {/* Buscador global */}
  <input
    type="text"
    placeholder="Buscar por correo, cliente, técnico, etc..."
    value={busquedaModal}
    onChange={e => setBusquedaModal(e.target.value)}
    className="search-input search-input-ticket"
    style={{ marginBottom: '10px', width: '100%' }}
  />


<div className="contenedor-botones-acciones">
        <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMostrarFiltrosAvanzadosModal(prev => !prev)}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',

            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            width: '100%',
          }}
          className="boton-accion"
        >
          {mostrarFiltrosAvanzadosModal ? 'Ocultar filtros avanzados' : 'Mostrar filtros avanzados'}
        </button>

  {/* Filtros avanzados */}
  {mostrarFiltrosAvanzadosModal && (
  <div
      style={{
        position: 'absolute',
        top: '45px',
        left: 0,
        width: '100%',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        padding: '10px',
        borderRadius: '8px',
        zIndex: 1002,
      }}
    >
    <input
      type="text"
      placeholder="Cliente"
      value={filtrosModal.cliente}
      onChange={e => setFiltrosModal(prev => ({ ...prev, cliente: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '6px' }}
    />
    <input
      type="text"
      placeholder="Técnico"
      value={filtrosModal.tecnico}
      onChange={e => setFiltrosModal(prev => ({ ...prev, tecnico: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '6px' }}
    />
    <input
      type="text"
      placeholder="Código ticket"
      value={filtrosModal.codigoTicket}
      onChange={e => setFiltrosModal(prev => ({ ...prev, codigoTicket: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '6px' }}
    />
    <select
      value={filtrosModal.puntuacion}
      onChange={e => setFiltrosModal(prev => ({ ...prev, puntuacion: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '6px' }}
    >
      <option value="">Todas las puntuaciones</option>
      {[5, 4, 3, 2, 1].map(n => (
        <option key={n} value={n}>{`${'⭐'.repeat(n)} (${n})`}</option>
      ))}
    </select>
    <input
      type="date"
      value={filtrosModal.fechaDesde}
      onChange={e => setFiltrosModal(prev => ({ ...prev, fechaDesde: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '6px' }}
    />
    <input
      type="date"
      value={filtrosModal.fechaHasta}
      onChange={e => setFiltrosModal(prev => ({ ...prev, fechaHasta: e.target.value }))}
      className="input-filtro"
      style={{ width: '100%', marginBottom: '10px' }}
    />

    <button
      onClick={() =>
        setFiltrosModal({
          cliente: '',
          tecnico: '',
          puntuacion: '',
          fechaDesde: '',
          fechaHasta: '',
          codigoTicket: '',
        })
      }
      className="btn-limpiar-filtros"
      style={{ width: '100%', marginBottom: '10px' }}
    >
      Limpiar filtros
    </button>
  </div>
  )}
  </div>

  {/* Botones PDF */}
  <button
    onClick={() => setPreviewModal(true)}
    style={{
      backgroundColor: '#4caf50',
      color: 'white',

      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
    }}
    className="boton-accion"
  >
    Previsualizar PDF
  </button>

  <PDFDownloadLink
    document={<FeedbackPDFDocument feedbacks={feedbacksFiltradosModal} />}
    fileName="reporte_feedbacks_total_filtrados.pdf"
    style={{
      textDecoration: 'none',
      color: 'white',
      backgroundColor: '#c62828',
      
      borderRadius: '6px',
      textAlign: 'center',
    }}
    className="boton-accion"
  >
    {({ loading }) => (loading ? 'Generando PDF...' : 'Descargar PDF')}
  </PDFDownloadLink>
  </div>

  {/* Lista filtrada */}
  <div style={{ marginTop: '15px' }}>
    {feedbacksFiltradosModal.map(fb => (
      <div
        key={fb.id_feedback}
        onClick={() => setFeedbackSeleccionado(fb)}
        style={{
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          marginBottom: '10px',
          cursor: 'pointer',
          backgroundColor: feedbackSeleccionado?.id_feedback === fb.id_feedback ? '#e0f7fa' : '#f9f9f9',
        }}
      >
        <div><strong>Ticket:</strong> {fb.codigo_ticket}</div>
        <div><strong>Cliente:</strong> {fb.nombre_apellido_cliente}</div>
        <div><strong>Puntaje:</strong> {fb.calificacion_cliente}/5</div>
      </div>
    ))}
  </div>
</div>


      {/* Sección derecha: Detalle */}
      <div className="modal-encuestas-detalle" style={{ width: '65%', padding: '20px', overflowY: 'auto' }}>
        {feedbackSeleccionado ? (
          <>
            <h3>Detalle de la Encuesta</h3>
            <p><strong>Cliente:</strong> {feedbackSeleccionado.nombre_apellido_cliente}</p>
            <p><strong>Correo:</strong> {feedbackSeleccionado.correo_feedback_cliente}</p>
            <p><strong>Técnico:</strong> {feedbackSeleccionado.nombre_tecnico} {feedbackSeleccionado.apellido_tecnico}</p>
            <p><strong>Ticket:</strong> {feedbackSeleccionado.codigo_ticket}</p>
            <p><strong>Fecha:</strong> {new Date(feedbackSeleccionado.fecha_feedback_prueba).toLocaleDateString()}</p>

            <div className="rating-container">
              <div
                className="stars-bar"
                style={{ '--rating': feedbackSeleccionado.calificacion_cliente }}
              >
                ★★★★★
              </div>
              <span className="rating-value">({feedbackSeleccionado.calificacion_cliente}/5)</span>
            </div>

            <div className="comentario-box" style={{ marginTop: '10px', padding: '10px', background: '#f1f1f1', borderRadius: '6px' }}>
              <strong>Comentario:</strong>
              <p>{feedbackSeleccionado.comentarios_cliente || 'Sin comentarios'}</p>
            </div>
          </>
        ) : (
          <p>Selecciona una encuesta para ver su detalle.</p>
        )}
      </div>
    </div>
  </div>
)}

{previewModal && (
  <div
    className="pdf-preview-overlay"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10001,
    }}
    onClick={() => setPreviewModal(false)}
  >
    <div
      style={{
        width: '80vw',
        height: '90vh',
        backgroundColor: 'white',
        position: 'relative',
      }}
      onClick={e => e.stopPropagation()}
    >
      <button
        onClick={() => setPreviewModal(false)}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10002,
          padding: '5px 10px',
          cursor: 'pointer',
        }}
      >
        Cerrar
      </button>

      <PDFViewer width="100%" height="100%">
        <FeedbackPDFDocument feedbacks={feedbacksFiltradosModal} />
      </PDFViewer>
    </div>
  </div>
)}



    </div>
  );
};

export default CustomerFeedback;
