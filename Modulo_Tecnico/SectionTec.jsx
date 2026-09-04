import React, { useState, useEffect } from "react";
import "./SectionTec.css";
import axios from "axios";

// API base URL
const API_BASE = process.env.REACT_APP_API_URL_SOLIASIGTEC;

// Componente Metric
const Metric = ({ label, value }) => (
  <div className="metric-card">
    <div className="metric-card-inner">
      <h3 className="metric-title" dangerouslySetInnerHTML={{ __html: label }}></h3>
      <p className="metric-value">{value}</p>
    </div>
  </div>
);

// Componente SolicitudesLista
const SolicitudesLista = ({ solicitudes, vacioMsg }) => {
  if (solicitudes.length === 0) {
    return <p className="empty-message">{vacioMsg}</p>;
  }

  return (
    <div className="requests-grid">
      {solicitudes.map((s) => (
        <div key={s.codigo_solicitud} className="request-card">
          <h3 className="request-title">Ticket: {s.codigo_ticket}</h3>
          <div className="request-details">
            <p className="request-detail"><span className="detail-label">Solicitud ID:</span> {s.codigo_solicitud}</p>
            <p className="request-detail"><span className="detail-label">Cliente:</span> {s.id_cliente}</p>
            <p className="request-detail">
              <span className="detail-label">Prioridad:</span>{" "}
              <span className={`priority-${s.prioridad_solicitud.toLowerCase()}`}>
                {s.prioridad_solicitud}
              </span>
            </p>
            <p className="request-detail"><span className="detail-label">Descripción:</span> {s.descripcion_servicio}</p>
            <p className="request-detail"><span className="detail-label">Motivo visita:</span> {s.motivo_visita}</p>
            <p className="request-detail"><span className="detail-label">Fecha creación:</span> {new Date(s.fecha_creacion).toLocaleDateString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

// Componente principal
const MostrarContenidoSectionTec = ({ user}) => {
  const [dashboardData, setDashboardData] = useState({
    asignadas: 0,
    completadas: 0,
    pendientes: 0,
    enProceso: 0,
    noRealizadas: 0,
  });

  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
  const [solicitudesEnProceso, setSolicitudesEnProceso] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Token no encontrado. Abortando carga de datos.");
        return setLoading(false);
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [dashRes, solRes] = await Promise.all([
          axios.get(`${API_BASE}/api/soliasig/dashboard-tecnico`, { headers }),
          axios.get(`${API_BASE}/api/soliasig/solicitudAsigTec`, { headers }),
        ]);

        setDashboardData((prev) => ({ ...prev, ...dashRes.data }));
        setSolicitudesPendientes(solRes.data.filter(s => s.estado_solicitud === "Pendiente"));
        setSolicitudesEnProceso(solRes.data.filter(s => s.estado_solicitud === "En Proceso"));
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, []);

  if (loading) return <div className="loading-indicator">Cargando datos...</div>;

  return (
    <div className="dashboard-container">
      <div>
        <p className="nombreusuario-text">
      {user.tipo_usuario === 'Tecnico' && `Dashboard del Técnico, usuario: ${user.usuario}`}
      </p> 
      </div>
      {/* Sección de Métricas */}
      <section className="metrics-section">
        <h2 className="section-title">Resumen de Solicitudes</h2>
        <div className="metrics-grid">
          <Metric label="Asignadas" value={dashboardData.asignadas} />
          <Metric label="Atendidas" value={dashboardData.completadas} />
          <Metric label="Pendientes" value={solicitudesPendientes.length} />
          <Metric label="En&nbsp;Proceso" value={dashboardData.enProceso} />
          <Metric label="No&nbsp;Realizadas" value={dashboardData.noRealizadas} />
        </div>
      </section>

      {/* Sección de Solicitudes Pendientes */}
      <section className="requests-section">
        <h2 className="section-title">Solicitudes Pendientes ({solicitudesPendientes.length})</h2>
        <SolicitudesLista
          solicitudes={solicitudesPendientes}
          vacioMsg="No hay solicitudes pendientes."
        />
        {dashboardData.pendientes > 0 && (
          <div className="pending-alert">
            ⚠️ Atención: Tienes {dashboardData.pendientes} solicitudes pendientes
          </div>
        )}
      </section>

      {/* Sección de Solicitudes En Proceso */}
      <section className="requests-section">
        <h2 className="section-title">Solicitudes En Proceso ({dashboardData.enProceso})</h2>
        <SolicitudesLista
          solicitudes={solicitudesEnProceso}
          vacioMsg="No hay solicitudes en proceso."
        />
      </section>
    </div>
  );
};

export default MostrarContenidoSectionTec;
