function procesarRespuestasYEnviar() {
var hojaTecnicos = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("lista");
var hojaRespuestas = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Respuestas de formulario 1");
var hojaSolicitudes = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("SolicitudesEsperadas");

// Validaciones de existencia de hojas
if (!hojaTecnicos || !hojaRespuestas || !hojaSolicitudes) {
Logger.log("❌ Error: Una o más hojas no se encontraron.");
return;
}

var tecnicos = hojaTecnicos.getDataRange().getValues();
var respuestas = hojaRespuestas.getDataRange().getValues();

if (respuestas.length < 2) {
Logger.log("⚠️ No hay suficientes datos para procesar.");
return;
}

var encabezadoRespuestas = respuestas[0];
var colNombreTecnicoRespuesta = encabezadoRespuestas.indexOf("Escoge el nombre del técnico que te atendió");
var colCalificacion = encabezadoRespuestas.indexOf("Del 1 al 5 ¿Como calificaria el servicio hecho por el técnico que lo atendió?");
var colComentarios = encabezadoRespuestas.indexOf("¿Por qué escogió esa calificación?");
var colCorreoFeedbackCliente = encabezadoRespuestas.indexOf("Dirección de correo electrónico");
var colNombreApellidoCliente = encabezadoRespuestas.indexOf("Indique Nombre y Apellido de Cliente Afiliado");
var colEstadoEnvio = encabezadoRespuestas.length - 1;

// Validación de columnas
if (colNombreTecnicoRespuesta === -1 || colCalificacion === -1 || colComentarios === -1 || colCorreoFeedbackCliente === -1 || colNombreApellidoCliente === -1) {
Logger.log("❌ Error: No se encontraron las columnas necesarias en respuestas.");
return;
}

var mapaTecnicos = {};
for (var i = 1; i < tecnicos.length; i++) {
var nombreTecnico = tecnicos[i][0];
var codigoTecnico = tecnicos[i][1];
mapaTecnicos[nombreTecnico] = codigoTecnico;
}

for (var j = 1; j < respuestas.length; j++) {
if (!respuestas[j].some(cell => cell !== "")) {
Logger.log("⚠️ Se encontró una fila vacía en la fila " + (j + 1) + ". Deteniendo el procesamiento.");
break;
}

if (respuestas[j][colEstadoEnvio] === "enviado") {
  Logger.log("⚠️ Respuesta ya enviada: " + respuestas[j][colNombreTecnicoRespuesta]);
  continue;
}

var nombreTecnicoRespondido = respuestas[j][colNombreTecnicoRespuesta];
var codigoAfiliado = null;

for (var tecnico in mapaTecnicos) {
  if (nombreTecnicoRespondido.includes(tecnico) || tecnico.includes(nombreTecnicoRespondido)) {
    codigoAfiliado = mapaTecnicos[tecnico];
    break;
  }
}

if (codigoAfiliado) {
  var marcaTemporal = respuestas[j][0];
  var calificacion = respuestas[j][colCalificacion];
  var comentarios = respuestas[j][colComentarios];
  var correoFeedback = respuestas[j][colCorreoFeedbackCliente] || "No proporcionado";
  var nombreApellido = respuestas[j][colNombreApellidoCliente] || "No proporcionado";

  // Obtener coincidencias
  var coincidencias = verificarCoincidencias(codigoAfiliado, nombreApellido, correoFeedback, hojaSolicitudes);
  var payload = {
    codigo_trabajador: codigoAfiliado,
    correo_feedback_cliente: correoFeedback,
    nombre_apellido_cliente: nombreApellido,
    marca_temporal: marcaTemporal,
    calificacion_cliente: calificacion,
    comentarios_cliente: comentarios
  };

  // Verificar coincidencias
  var nombreCoincide = coincidencias && normalizarTexto(coincidencias.nombreApellido) === normalizarTexto(nombreApellido);
  var correoCoincide = coincidencias && coincidencias.correo.toLowerCase() === correoFeedback.toLowerCase();

  if (nombreCoincide && correoCoincide) {
    // Solo se añaden los IDs si hay coincidencias completas
    payload.id_soli_completada = coincidencias.id_soli_completada; // ID de la solicitud
    payload.id_cliente = coincidencias.id_cliente; // ID del cliente
  } else {
    // Si hay discrepancias, se añade el campo correspondiente
    if (!nombreCoincide && !correoCoincide) {
      payload.opinion_cliente = "sin coincidencias"; // Campo adicional
      Logger.log("⚠️ No se encontraron coincidencias en 'SolicitudesEsperadas' para el cliente: " + nombreApellido + " y el correo: " + correoFeedback);
    } else if (!nombreCoincide) {
      payload.opinion_cliente = "sin coincidencia de nombre"; // Campo adicional
      Logger.log("⚠️ No se encontró coincidencia en el nombre para el cliente: " + nombreApellido);
    } else if (!correoCoincide) {
      payload.opinion_cliente = "sin coincidencia de correo"; // Campo adicional
      Logger.log("⚠️ No se encontró coincidencia en el correo para el cliente: " + correoFeedback);
    }
  }

  var opciones = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload)
  };

  var urlAPI = "https://7807-149-102-242-98.ngrok-free.app/api/guardarFeedback";
  try {
    UrlFetchApp.fetch(urlAPI, opciones);
    Logger.log("✔️ Enviado código " + codigoAfiliado + " a la base de datos para técnico " + nombreTecnicoRespondido);
    hojaRespuestas.getRange(j + 1, colEstadoEnvio + 1).setValue("enviado");
  } catch (e) {
    Logger.log("❌ Error enviando datos para técnico " + nombreTecnicoRespondido + ": " + e.message);
  }
} else {
  Logger.log("⚠️ Nombre técnico no encontrado en lista: " + nombreTecnicoRespondido);
}
}
}

function normalizarTexto(texto) {
// Quitar acentos
texto = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
// Quitar caracteres no alfabéticos y convertir a minúsculas
return texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, "").toLowerCase();
}

function verificarCoincidencias(idTecnico, nombreApellido, correoCliente, hojaSolicitudes) {
const datosSolicitudes = hojaSolicitudes.getDataRange().getValues();

for (let i = 1; i < datosSolicitudes.length; i++) { // Comienza desde 1 para omitir el encabezado
// Verifica si hay coincidencias en la fila actual
if (datosSolicitudes[i][1] === idTecnico) {
return {
id_soli_completada: datosSolicitudes[i][0], // ID de la solicitud
id_cliente: datosSolicitudes[i][2], // ID del cliente
nombreApellido: datosSolicitudes[i][4], // Nombre y apellido del cliente
correo: datosSolicitudes[i][3] // Correo del cliente
};
}
}
return null; // Si no se encuentra coincidencia
}