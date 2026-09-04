import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import logo from './logo.png';

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold', color: '#c62828' },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#c62828',
    borderBottom: '1px solid #c62828',
    paddingBottom: 5,
  },
  row: { flexDirection: 'row', marginBottom: 8 },
  label: { width: '40%', fontWeight: 'bold' },
  value: { width: '60%', marginLeft: 10 },
  description: { marginTop: 5, marginBottom: 5, fontStyle: 'italic' },
  image: { width: 60, height: 'auto' }, // LOGO estilo ajustado
});

function formatTiempoInvertido(tiempo) {
  if (!tiempo || typeof tiempo !== 'object') return 'Tiempo no disponible';
  const { days = 0, hours = 0, minutes = 0, seconds = 0 } = tiempo;
  if (days > 0)
    return `${days} día${days !== 1 ? 's' : ''}, ${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  if (hours > 0)
    return `${hours} hora${hours !== 1 ? 's' : ''}, ${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  if (minutes > 0)
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}` + (seconds > 0 ? `, ${seconds} segundo${seconds !== 1 ? 's' : ''}` : '');
  return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
}

const formatDate = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

import { Svg, Path } from "@react-pdf/renderer";

// ⭐ COMPONENTE ICONO DE ESTRELLA
const Star = ({ size = 12, color = "#FBBF24" }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    strokeWidth={1.5}
    stroke={color}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <Path
      d="M8.58737 8.23597L11.1849 3.00376C11.5183 2.33208 12.4817 2.33208 12.8151 3.00376L15.4126 8.23597L21.2215 9.08017C21.9668 9.18848 22.2638 10.0994 21.7243 10.6219L17.5217 14.6918L18.5135 20.4414C18.6409 21.1798 17.8614 21.7428 17.1945 21.3941L12 18.678L6.80547 21.3941C6.1386 21.7428 5.35909 21.1798 5.48645 20.4414L6.47825 14.6918L2.27575 10.6219C1.73617 10.0994 2.03322 9.18848 2.77852 9.08017L8.58737 8.23597Z"
      fill={color}
      stroke={color}
    />
  </Svg>
);

// ⭐ FUNCIÓN PARA RENDERIZAR ESTRELLAS
const renderStars = (count) => {
  const stars = [];
  const rounded = Math.round(Number(count) || 0);

  for (let i = 0; i < rounded; i++) {
    stars.push(<Star key={i} size={14} />);
  }

  return <View style={{ flexDirection: "row", marginLeft: 4 }}>{stars}</View>;
};



const fechaDescarga = formatDate(new Date());

const ReporteEvaluacionIndividual = ({ evaluacion }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* HEADER */}
      <View
        fixed
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid #cccccc',
          paddingBottom: 10,
        }}
      >
        {/* Logo izquierda */}
        <Image src={logo} style={styles.image} />

        {/* Título centrado */}
        <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', flex: 1 }}>
          Reporte de desempeño
        </Text>

        {/* Fecha derecha */}
        <Text style={{ fontSize: 10, color: '#555' }}>
          Fecha: {fechaDescarga}
        </Text>
      </View>

      {/* Sección: Datos de la solicitud */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datos de la Solicitud</Text>
        <View style={styles.row}>
          <Text style={styles.label}>ID:</Text>
          <Text style={styles.value}>{evaluacion.codigo_ticket}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha Creación:</Text>
          <Text style={styles.value}>{new Date(evaluacion.fecha_solicitud).toLocaleDateString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Técnico:</Text>
          <Text style={styles.value}>{`${evaluacion.nombre_tecnico} ${evaluacion.apellido_tecnico}`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Cliente:</Text>
          <Text style={styles.value}>{`${evaluacion.nombre_cliente} ${evaluacion.apellido_cliente}`}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Motivo Visita:</Text>
          <Text style={styles.value}>{evaluacion.motivo_visita}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Descripción:</Text>
          <Text style={styles.value}>{evaluacion.descripcion_servicio}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Estado:</Text>
          <Text style={styles.value}>{evaluacion.estado_solicitud}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Prioridad:</Text>
          <Text style={styles.value}>{evaluacion.prioridad_solicitud}</Text>
        </View>
      </View>

      {/* Sección: Datos de cierre técnico */}
      {/* Sección: Datos de cierre técnico */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Detalles de Cierre Técnico</Text>

  {evaluacion.estado_solicitud === "Cerrado" && (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>Motivo de Cierre:</Text>
        <Text style={styles.value}>{evaluacion.motivo_cierre}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{evaluacion.comentarios_tecnico || 'Sin comentarios'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fecha Cierre:</Text>
        <Text style={styles.value}>{new Date(evaluacion.fecha_cierre).toLocaleDateString()}</Text>
      </View>
    </>
  )}

  {evaluacion.estado_solicitud === "No Realizado" && (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>Motivo de No Realización:</Text>
        <Text style={styles.value}>{evaluacion.motivo_norealizacion}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Comentarios:</Text>
        <Text style={styles.value}>{evaluacion.comentario_trabajo_norealizado || 'Sin comentarios'}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Fecha Cierre:</Text>
        <Text style={styles.value}>{new Date(evaluacion.fecha_cierre_norealizado).toLocaleDateString()}</Text>
      </View>
    </>
  )}

  {evaluacion.estado_solicitud === "Completado" && (
    <>
      
      {/* Sección: Datos de cierre técnico */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Detalles de Cierre Técnico</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Tipo Solución/Falla:</Text>
          <Text style={styles.value}>{evaluacion.tipo_solucion_falla}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Comentarios:</Text>
          <Text style={styles.value}>{evaluacion.comentario_trabajo_realizado || 'Sin comentarios'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Herramientas:</Text>
          <Text style={styles.value}>{evaluacion.herramientas_utilizadas || 'Sin herramientas'}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tiempo Invertido:</Text>
          <Text style={styles.value}>{formatTiempoInvertido(evaluacion.tiempo_invertido)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Fecha Cierre:</Text>
          <Text style={styles.value}>{new Date(evaluacion.fecha_caso_cerrado).toLocaleDateString()}</Text>
        </View>
      </View>

    </>
  )}

</View>

{/* Sección combinada: Evaluación de Desempeño */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Evaluación de Desempeño</Text>

  {evaluacion.estado_solicitud === "Completado" && (
    <>
      {/* Puntuación Técnica */}
      <View style={styles.row}>
        <Text style={styles.label}>Puntuación Técnica:</Text>
        {evaluacion.puntuacion_tecnico ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.value}>{evaluacion.puntuacion_tecnico}</Text>
            {renderStars(evaluacion.puntuacion_tecnico)}
          </View>
        ) : (
          <Text style={styles.value}>No evaluado</Text>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Comentario Técnico:</Text>
        <Text style={styles.value}>{evaluacion.comentario_puntuacion_tecnico || 'Sin comentarios'}</Text>
      </View>

      {/* Calificación Cliente */}
      <View style={styles.row}>
        <Text style={styles.label}>Calificación del Cliente:</Text>
        {evaluacion.calificacion_cliente ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text style={styles.value}>{evaluacion.calificacion_cliente}</Text>
            {renderStars(evaluacion.calificacion_cliente)}
          </View>
        ) : (
          <Text style={styles.value}>No calificado</Text>
        )}
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Comentarios del Cliente:</Text>
        <Text style={styles.value}>{evaluacion.comentarios_cliente || 'Sin comentarios'}</Text>
      </View>
    </>
  )}

  {(evaluacion.estado_solicitud === "Cerrado" || evaluacion.estado_solicitud === "No Realizado") && (
    <>
      <View style={styles.row}>
        <Text style={styles.label}>Comentario:</Text>
        <Text style={styles.value}>{evaluacion.comentario || 'Sin comentarios'}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Fecha:</Text>
        <Text style={styles.value}>{new Date(evaluacion.fecha_comentario).toLocaleDateString()}</Text>
      </View>
    </>
  )}
</View>



    </Page>
  </Document>
);

export default ReporteEvaluacionIndividual;
