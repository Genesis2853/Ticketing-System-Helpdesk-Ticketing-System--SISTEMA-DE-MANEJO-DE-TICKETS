// TechnicianPerformanceReport.jsx
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

import { Svg, Path } from "@react-pdf/renderer";

// PALETA DE COLORES
const colors = {
  headerBg: "#b71c1c",
  headerText: "#ffffff",
  rowEven: "#f5f5f5",
  rowOdd: "#ffffff",
};

// NUEVO ESTILO
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: colors.headerBg,
  },
  table: {
    display: "table",
    width: "100%",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerCell: {
    backgroundColor: colors.headerBg,
    color: colors.headerText,
    fontWeight: "bold",
    paddingVertical: 8,
    paddingHorizontal: 6,
    textAlign: "center",
    borderRight: "1pt solid #ffffff",
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    textAlign: "center",
    borderRight: "1pt solid #cccccc",
  },
});

const TrofeoIcon = () => (
  <Svg viewBox="0 0 24 24" width={14} height={14}>
    <Path
      d="M6.74534 4H17.3132C17.3132 4 16.4326 17.2571 12.0293 17.2571C9.87826 17.2571 8.56786 14.0935 7.79011 10.8571C6.97574 7.46844 6.74534 4 6.74534 4Z"
      stroke="#000000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M17.3132 4C17.3132 4 18.2344 3.01733 19 2.99999C20.5 2.96603 20.7773 4 20.7773 4C21.0709 4.60953 21.3057 6.19429 19.8967 7.65715C18.4876 9.12 16.9103 10.4 16.2684 10.8571"
      stroke="#000000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M6.74527 4.00001C6.74527 4.00001 5.78547 3.00614 4.99995 3.00001C3.49995 2.9883 3.22264 4.00001 3.22264 4.00001C2.92908 4.60953 2.69424 6.19429 4.1033 7.65715C5.51235 9.12001 7.14823 10.4 7.79004 10.8572"
      stroke="#000000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M8.50662 20C8.50662 18.1714 12.0292 17.2571 12.0292 17.2571C12.0292 17.2571 15.5519 18.1714 15.5519 20H8.50662Z"
      stroke="#000000"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

const Star = ({ size = 12, color = "#000000" }) => (
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
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push(<Star key={i} size={14} color="#FBBF24" />);
  }
  return <View style={{ flexDirection: "row" }}>{stars}</View>;
};

// ANCHOS MÁS AMPLIOS
const COL_WIDTHS = ["10%", "35%", "15%", "20%", "20%"];

const TechnicianPerformanceReport = ({ technicians = [] }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.title}>Desempeño de Técnicos</Text>

      <View style={styles.table}>
        {/* ENCABEZADO */}
        <View style={styles.row}>
          {["Posición", "Técnico", "Solicitudes", "Puntuación", "Categoría"].map(
            (header, index) => (
              <Text
                key={index}
                style={[
                  styles.headerCell,
                  { width: COL_WIDTHS[index] },
                ]}
              >
                {header}
              </Text>
            )
          )}
        </View>

        {/* FILAS DE DATOS */}
        {technicians.map((tech, idx) => (
          <View
            key={tech.codigo_trabajador}
            style={[
              styles.row,
              {
                backgroundColor: idx % 2 === 0 ? colors.rowOdd : colors.rowEven,
              },
            ]}
          >
            <View style={[styles.cell, { width: COL_WIDTHS[0], alignItems: "center" }]}>
  {idx === 0 ? <TrofeoIcon /> : <Text>{idx + 1}</Text>}
</View>


            <Text style={[styles.cell, { width: COL_WIDTHS[1] }]}>
              {tech.nombre_tecnico} {tech.apellido_tecnico}
            </Text>
            <Text style={[styles.cell, { width: COL_WIDTHS[2] }]}>
              {tech.solicitudes}
            </Text>
            <View
  style={[
    styles.cell,
    { width: COL_WIDTHS[3], flexDirection: "row", justifyContent: "center", alignItems: "center" },
  ]}
>
  {renderStars(Math.round(Number(tech.promedio)) || 0)}
  <Text style={{ marginLeft: 6 }}>{tech.promedio}</Text>
</View>
            <Text style={[styles.cell, { width: COL_WIDTHS[4] }]}>
              {tech.categoria?.label ?? ""}
            </Text>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

export default TechnicianPerformanceReport;
