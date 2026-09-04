import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Svg,
  Path,
} from '@react-pdf/renderer';
import logo from './logo.png';

const primary = '#c62828';
const borderColor = '#fdecea';

// Icono estrella
const Star = ({ size = 12, color = '#FBBF24' }) => (
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

const renderStars = (count) => {
  const rounded = Math.round(Number(count) || 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: rounded }).map((_, i) => (
        <Star key={i} size={10} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    borderBottomStyle: 'solid',
    paddingBottom: 8,
    height: 40,
  },
  headerLeft: {
    width: 60,
    justifyContent: 'center',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  image: {
    width: 60,
    height: 60,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: primary,
    textAlign: 'center',
  },
  dateText: {
    fontSize: 9,
    color: '#555',
  },

  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: primary,
    color: '#fff',
  },
  headerCell: {
    padding: 6,
    fontSize: 11,
    fontWeight: 'bold',
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    padding: 6,
    fontSize: 10,
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
  },
  starCell: {
    padding: 6,
    borderWidth: 0.5,
    borderColor,
    borderStyle: 'solid',
    justifyContent: 'center',
  },
  noDataText: {
    marginTop: 20,
    fontStyle: 'italic',
    color: '#888',
    textAlign: 'center',
  },
});

// Flex para columnas según campo
const getFlex = (col) => {
  switch (col) {
    case 'codigo':
      return 1.5;
    case 'contrato':
      return 1;
    case 'cliente':
      return 1.5;
    case 'tecnico':
      return 1.5;
    case 'prioridad':
      return 0.7;
    case 'fecha':
      return 1;
    case 'puntuacion':
      return 0.7;
    case 'calificacion':
      return 0.7;
    default:
      return 1;
  }
};

const formatDate = (fecha) => {
  if (!fecha) return '-';
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const ReporteEvaluacionesPDF = ({ evaluaciones = [] }) => {
  const fechaDescarga = formatDate(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.image} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Reporte de Solicitudes Evaluadas</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA */}
        {evaluaciones.length === 0 ? (
          <Text style={styles.noDataText}>No hay evaluaciones disponibles.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: getFlex('codigo') }]}>Código</Text>
              <Text style={[styles.headerCell, { flex: getFlex('contrato') }]}>N° Contrato</Text>
              <Text style={[styles.headerCell, { flex: getFlex('cliente') }]}>Cliente</Text>
              <Text style={[styles.headerCell, { flex: getFlex('tecnico') }]}>Técnico</Text>
              <Text style={[styles.headerCell, { flex: getFlex('prioridad') }]}>Prioridad</Text>
              <Text style={[styles.headerCell, { flex: getFlex('fecha') }]}>Fecha Eval.</Text>
              <Text style={[styles.headerCell, { flex: getFlex('puntuacion') }]}>Técnico</Text>
              <Text style={[styles.headerCell, { flex: getFlex('calificacion') }]}>Cliente</Text>
            </View>

            {evaluaciones.map((ev, idx) => (
              <View
                key={idx}
                style={[
                  styles.row,
                  idx % 2 === 0 ? { backgroundColor: '#fdf0f0a2' } : {},
                ]}
                wrap={false}
              >
                <Text style={[styles.cell, { flex: getFlex('codigo') }]}>{ev.codigo_ticket || '-'}</Text>
                <Text style={[styles.cell, { flex: getFlex('contrato') }]}>{ev.nro_contrato || '-'}</Text>
                <Text style={[styles.cell, { flex: getFlex('cliente') }]}>
                  {`${ev.nombre_cliente || ''} ${ev.apellido_cliente || ''}`.trim() || '-'}
                </Text>
                <Text style={[styles.cell, { flex: getFlex('tecnico') }]}>
                  {`${ev.nombre_tecnico || ''} ${ev.apellido_tecnico || ''}`.trim() || '-'}
                </Text>
                <Text style={[styles.cell, { flex: getFlex('prioridad') }]}>{ev.prioridad_solicitud || '-'}</Text>
                <Text style={[styles.cell, { flex: getFlex('fecha') }]}>
                  {formatDate(ev.fecha_evaluacion_tecnico)}
                </Text>
                <View style={[styles.starCell, { flex: getFlex('puntuacion') }]}>
                  {renderStars(ev.puntuacion_tecnico)}
                </View>
                <View style={[styles.starCell, { flex: getFlex('calificacion') }]}>
                  {renderStars(ev.calificacion_cliente)}
                </View>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  );
};

export default ReporteEvaluacionesPDF;
