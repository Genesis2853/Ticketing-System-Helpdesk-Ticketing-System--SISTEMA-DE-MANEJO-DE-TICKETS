import React, { useEffect, useState, useRef } from 'react';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import DecisionReportPDF from './DecisionReportPDF';

const DecisionReport = ({ messages }) => {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef(null);

  // Obtener mensajes desde props o desde sessionStorage si está vacío
  const storedMessages = React.useMemo(() => {
    if (messages && messages.length > 0) {
      return messages;
    }
    const saved = sessionStorage.getItem("informeAsignacion");
    return saved ? JSON.parse(saved) : [];
  }, [messages]);

  // Compose messages with starting and ending messages
  const enhancedMessages = React.useMemo(() => {
    if (!storedMessages || storedMessages.length === 0) {
      return ['Esperando Asignacion...'];
    }
    return ['Comenzando asignación automática...', ...storedMessages, 'Asignación terminada.'];
  }, [storedMessages]);

  // Show messages one by one with smooth timing
  useEffect(() => {
    setVisibleCount(0);
    const interval = setInterval(() => {
      setVisibleCount(count => {
        if (count >= enhancedMessages.length) {
          clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 1500); // show a new message every 1.5 seconds
    return () => clearInterval(interval);
  }, [enhancedMessages]);

  // Scroll to bottom smoothly as new messages appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [visibleCount]);

   // Previsualizar en nueva ventana
  const handlePreview = async () => {
    const blob = await pdf(<DecisionReportPDF messages={enhancedMessages} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <section style={styles.wrapper} aria-label="Informe de asignación de tickets">
      <h1 style={styles.title}>Informe de Asignación de Tickets</h1>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={handlePreview} style={styles.button}>
          Previsualizar PDF
        </button>
        <PDFDownloadLink
          document={<DecisionReportPDF messages={enhancedMessages} />}
          fileName="informe-asignacion.pdf"
          style={{ textDecoration: 'none' }}
        >
          {({ loading }) => (
            <button style={styles.button} disabled={loading}>
              {loading ? 'Generando PDF...' : 'Descargar PDF'}
            </button>
          )}
        </PDFDownloadLink>
      </div>

      <div style={styles.card} ref={containerRef}>
        {enhancedMessages.length === 0 ? (
          <p style={styles.noMessages}>No hay mensajes disponibles.</p>
        ) : (
          enhancedMessages.slice(0, visibleCount).map((msg, idx) => (
            <p key={idx} style={styles.message}>
              {msg}
            </p>
          ))
        )}
      </div>
    </section>
  );
};

const styles = {
  wrapper: {
    maxWidth: '900px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#fff',
    borderRadius: '0.75rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '1rem',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: '0.5rem',
    padding: '1rem 1.5rem',
    height: '350px',
    overflowY: 'auto',
    boxShadow: 'inset 0 0 4px rgba(0,0,0,0.05)',
  },
  message: {
    fontSize: '18px',
    lineHeight: 1.4,
    color: '#6b7280',
    marginBottom: '0.75rem',
    fontFamily: "'Inter', sans-serif",
  },
  noMessages: {
    fontSize: '18px',
    color: '#9ca3af',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: '3rem',
    fontFamily: "'Inter', sans-serif",
  },
  button: {
    padding: '0.5rem 1.2rem',
    fontSize: '0.95rem',
    backgroundColor: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '0.375rem',
    cursor: 'pointer',
  },
};

export default DecisionReport;