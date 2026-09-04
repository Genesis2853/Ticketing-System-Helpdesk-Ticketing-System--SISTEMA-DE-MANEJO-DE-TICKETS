import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import logo from "./logo.png"; // Asegúrate de que el logo esté en la misma ruta

const primary = "#c62828";
const borderColor = "#fdecea";

// Función para formatear la fecha
const formatDate = (fecha) => {
  if (!fecha || typeof fecha !== "string" || isNaN(new Date(fecha).getTime())) return "-";
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatDateTime = (fecha) => {
  if (!fecha) return "-";
  const d = new Date(fecha);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
};

// Estilos
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
  },
  headerContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    borderBottomStyle: "solid",
    paddingBottom: 8,
    height: 40,
  },
  headerLeft: {
    width: 60,
    justifyContent: "center",
  },
  headerCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  headerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  image: {
    width: 60,
    height: 60,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: primary,
    textAlign: "center",
  },
  dateText: {
    fontSize: 9,
    color: "#555",
  },
  table: {
    width: "100%",
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: primary,
    color: "#fff",
  },
  headerCell: {
    padding: 6,
    fontSize: 11,
    fontWeight: "bold",
    borderWidth: 0.5,
    borderColor,
    borderStyle: "solid",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    padding: 6,
    fontSize: 10,
    borderWidth: 0.5,
    borderColor,
    borderStyle: "solid",
  },
});

// Lógica de flex por columna
const getFlex = (col) => {
  switch (col) {
    case "cliente":
    case "tecnico":
      return 1.5;
      case "codigo":
      return 2;
    case "comentario":
      return 2.5;
    case "fecha":
      return 1.2;
    default:
      return 1.2;
  }
};

const ReporteComentarioPDF = ({ tickets = [] }) => {
  const fechaDescarga = formatDateTime(new Date());

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.headerContainer} fixed>
          <View style={styles.headerLeft}>
            <Image src={logo} style={styles.image} />
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Reporte de Comentarios Internos</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>Fecha: {fechaDescarga}</Text>
          </View>
        </View>

        {/* TABLA */}
        <View style={styles.table}>
          {/* Encabezados */}
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: getFlex("codigo") }]}>Código</Text>
            <Text style={[styles.headerCell, { flex: getFlex() }]}>Contrato</Text>
            <Text style={[styles.headerCell, { flex: getFlex("cliente") }]}>Cliente</Text>
            <Text style={[styles.headerCell, { flex: getFlex("tecnico") }]}>Técnico</Text>
            <Text style={[styles.headerCell, { flex: getFlex() }]}>Estado</Text>
            <Text style={[styles.headerCell, { flex: getFlex() }]}>Prioridad</Text>
            <Text style={[styles.headerCell, { flex: getFlex("fecha") }]}>Fecha Comentario</Text>
            <Text style={[styles.headerCell, { flex: getFlex("comentario") }]}>Comentario</Text>
          </View>

          {/* Filas */}
          {tickets.map((t, idx) => (
            <View
              style={[
                styles.row,
                idx % 2 === 0 ? { backgroundColor: "#fdf0f0a2" } : {},
              ]}
              key={idx}
              wrap={false}
            >
              <Text style={[styles.cell, { flex: getFlex("codigo") }]}>{t.codigo_ticket || "-"}</Text>
              <Text style={[styles.cell, { flex: getFlex() }]}>{t.nro_contrato || "N/A"}</Text>
              <Text style={[styles.cell, { flex: getFlex("cliente") }]}>
                {`${t.nombre_cliente || ""} ${t.apellido_cliente || ""}`.trim() || "-"}
              </Text>
              <Text style={[styles.cell, { flex: getFlex("tecnico") }]}>
                {`${t.nombre_tecnico || ""} ${t.apellido_tecnico || ""}`.trim() || "-"}
              </Text>
              <Text style={[styles.cell, { flex: getFlex() }]}>{t.estado_solicitud || "-"}</Text>
              <Text style={[styles.cell, { flex: getFlex() }]}>{t.prioridad_solicitud || "-"}</Text>
              <Text style={[styles.cell, { flex: getFlex("fecha") }]}>
                {formatDate(t.fecha_comentario)}
              </Text>
              <Text style={[styles.cell, { flex: getFlex("comentario") }]}>
                {t.comentario || "-"}
              </Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
};

export default ReporteComentarioPDF;
