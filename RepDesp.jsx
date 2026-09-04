import React, { useState, useEffect } from "react";
import { SnackbarProvider, useSnackbar } from 'notistack';
import EvaluationForm from "./desempeño/evaluacioninterna";
import TechnicianPerformance from "./desempeño/tabladesempeño.jsx";
import RequestViewer from "./desempeño/versolicitudevaludesem.jsx";
import CustomerFeedback from "./desempeño/retroclliente";
import './desempeño/estilodesempeño.css';

const AppContent = ({user, permisos}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [solicitudes, setSolicitudes] = useState([]);
  const [evaluadas, setEvaluadas] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solicitudesRes, techniciansRes, evaluacionesRes, feedbacksRes] = await Promise.all([
          fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/solicitudes`),
          fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/tecnicos`),
          fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/evaluadas`),
          fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/feedbacks`)
        ]);

        const solicitudesData = await solicitudesRes.json();
        const techniciansData = await techniciansRes.json();
        const evaluacionesData = await evaluacionesRes.json();
        const feedbacksData = await feedbacksRes.json();

        setSolicitudes(solicitudesData);
        setTechnicians(techniciansData);
        setEvaluaciones(evaluacionesData);
        setFeedbacks(feedbacksData);

        const evaluatedSolicitudIds = new Set(evaluacionesData.map(ev => ev.id_soli_completada));
        setEvaluadas(solicitudesData.filter(s => evaluatedSolicitudIds.has(s.id_soli_completada)));

        setTechnicians(recalcTechniciansPerformance(techniciansData, evaluacionesData));
      } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        enqueueSnackbar("Error al cargar datos iniciales", { variant: 'error' });
      }
    };
    fetchData();
  }, [enqueueSnackbar]);

  const recalcTechniciansPerformance = (techniciansList, evaluacionesList) => {
    return techniciansList.map(tech => {
      const techEvals = evaluacionesList.filter(ev => ev.codigo_trabajador === tech.codigo_trabajador);
      if (techEvals.length === 0) {
        return { ...tech, solicitudes: 0, promedio: "0.00" };
      }

      let sumInternal = 0;
      let countInternal = 0;
      let sumClient = 0;
      let countClient = 0;

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
        solicitudes: techEvals.length,
        promedio: combinedAvg.toFixed(2),
      };
    });
  };

  const handleEvaluationSubmit = async (data) => {
    
    try {
      const existingEvaluation = evaluaciones.find(ev => 
        ev.id_soli_completada === data.id_soli_completada && 
        ev.codigo_trabajador === data.codigo_trabajador
      );

      if (existingEvaluation) {
        const updatedData = {
          ...existingEvaluation,
          id_feedback: data.id_feedback,
          calificacion_cliente: data.calificacion_cliente,
          comentarios_cliente: data.comentarios_cliente,
        };
const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/evaluaciones/${existingEvaluation.id_evaluaciones}`, {
          method: "PUT",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify(updatedData),
        });

        if (!response.ok) {
          const errData = await response.json();
          console.error("Error al actualizar la evaluación:", errData);
          enqueueSnackbar("❌ Error al actualizar la evaluación.", { variant: 'error' });
          return;
        }

        const updatedEvaluation = await response.json();
        setEvaluaciones(prevEvaluaciones => {
          const index = prevEvaluaciones.findIndex(ev => ev.id_evaluaciones === updatedEvaluation.id_evaluaciones);
          const updated = [...prevEvaluaciones];
          updated[index] = updatedEvaluation;
          return updated;
        });

        enqueueSnackbar("✅ Evaluación actualizada correctamente.", { variant: 'success' });
      } else {
        const token = localStorage.getItem("token");
        const response = await fetch(`${process.env.REACT_APP_API_URL_RETROCLIENTE}/api/desempeno/evaluaciones`, {
          method: "POST",
          headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errData = await response.json();
          console.error("Error al guardar la evaluación:", errData);
          enqueueSnackbar("❌ Error al guardar la evaluación.", { variant: 'error' });
          return;
        }

        const newEvaluation = await response.json();
        setEvaluaciones(prevEvaluaciones => [...prevEvaluaciones, newEvaluation]);

        const solicitudEvaluada = solicitudes.find(s => s.id_soli_completada === data.id_soli_completada);
        if (solicitudEvaluada && !evaluadas.find(e => e.id_soli_completada === data.id_soli_completada)) {
          setEvaluadas([...evaluadas, solicitudEvaluada]);
        }

        enqueueSnackbar("✅ Evaluación guardada correctamente.", { variant: 'success' });
      }

      setTechnicians(recalcTechniciansPerformance(technicians, evaluaciones));

    } catch (error) {
      console.error("❌ Error al enviar la evaluación:", error);
      enqueueSnackbar("❌ Error al enviar la evaluación.", { variant: 'error' });
    }
  };

  return (
    <div className="app">
      <div className="grid-container">
        <div className="grid-item viewer">
          <RequestViewer solicitudes={solicitudes} evaluaciones={evaluaciones} evaluadas={evaluadas} feedbacks={feedbacks} />
        </div>
        <div className="grid-item evaluation" style={{ gridColumn: 'span 2' }}>
          <EvaluationForm
            solicitudes={solicitudes}
            evaluadas={evaluadas}
            user={user}
            permisos={permisos}
            evaluaciones={evaluaciones}
            feedbacks={feedbacks.filter(fb => !evaluaciones.some(ev => String(ev.id_feedback) === String(fb.id_feedback)))}
            onSubmit={handleEvaluationSubmit}
          />
        </div>
        <div className="grid-item feedback" style={{ gridColumn: 'span 3' }}>
          <CustomerFeedback solicitudes={solicitudes} evaluaciones={evaluadas} evaluacion={evaluaciones} />
        </div>
        <div className="grid-item performance" style={{ gridColumn: 'span 3' }}>
          <TechnicianPerformance technicians={technicians} evaluaciones={evaluaciones} />
        </div>
      </div>
    </div>
  );
};

const App = ({user, permisos}) => (
  <SnackbarProvider maxSnack={5} autoHideDuration={10000} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
    <AppContent user={user} permisos={permisos}/>
  </SnackbarProvider>
);

export default App;
