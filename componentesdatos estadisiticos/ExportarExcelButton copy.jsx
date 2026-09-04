import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { parseISO, format } from 'date-fns';   // 👈 nuevo

const ExportarExcelButton = ({ data, fileName, startDate, endDate }) => {
  const exportToExcel = () => {
    // 1. Crear un libro de trabajo
    const workbook = XLSX.utils.book_new();

    // 2. Crear una hoja de datos
    const worksheet = XLSX.utils.json_to_sheet(data);

    // 3. Ajustar ancho de columnas
    const colWidths = [];
    XLSX.utils.sheet_to_json(worksheet).forEach(row => {
      Object.values(row).forEach((value, idx) => {
        const width = value ? String(value).length + 2 : 10;
        colWidths[idx] = Math.max(colWidths[idx] || 0, width);
      });
    });
    worksheet['!cols'] = colWidths.map(w => ({ width: w }));

    // 4. Información de fechas (ahora sin problemas de zona horaria)
    const dateInfo = [
      {
        Descripción: 'Filtrado desde',
        Valor: format(parseISO(startDate), 'dd/MM/yyyy')
      },
      {
        Descripción: 'Filtrado hasta',
        Valor: format(parseISO(endDate), 'dd/MM/yyyy')
      }
    ];

    // Insertar la info de fechas al principio (A1)
    XLSX.utils.sheet_add_json(worksheet, dateInfo, {
      skipHeader: true,
      origin: 'A1'
    });

    // 5. Añadir la hoja al libro
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    // 6. Generar buffer Excel
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      bookSST: true
    });

    // 7. Descargar
    const blob = new Blob([excelBuffer], {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    saveAs(blob, `${fileName}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      style={{
    backgroundColor: '#1976d2',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
  }}
    >
      Exportar a Excel
    </button>
  );
};

export default ExportarExcelButton;
