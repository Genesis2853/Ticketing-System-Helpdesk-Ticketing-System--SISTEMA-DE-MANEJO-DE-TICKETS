import React from 'react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { parseISO, format } from 'date-fns';

const ExportarExcelButton = ({ data, fileName, startDate, endDate, disabled }) => {
  const exportToExcel = () => {
    // =======================================================
    // SOLUCIÓN: VERIFICAR QUE LOS DATOS EXISTEN ANTES DE USARLOS
    // =======================================================
    if (!data || !Array.isArray(data.totales) || !Array.isArray(data.porPeriodo)) {
      alert("Los datos aún no están listos. Por favor, espera un momento y vuelve a intentarlo.");
      return; // Detiene la función aquí si los datos no son válidos
    }

    // 1. Crear un nuevo libro de trabajo
    const workbook = XLSX.utils.book_new();

    // --- HOJA PRINCIPAL: REPORTE ---
    const worksheet_data = [];
    
    const headerTotales = ['Estadísticas Totales', 'Valor'];
    const headerPeriodo = [`Estadísticas por Período`, `Valor (${format(parseISO(startDate), 'dd/MM/yy')} - ${format(parseISO(endDate), 'dd/MM/yy')})`];

    // Esta línea ahora es segura gracias a la verificación de arriba
    const maxRows = Math.max(data.totales.length, data.porPeriodo.length);
    
    worksheet_data.push([headerTotales[0], headerTotales[1], '', headerPeriodo[0], headerPeriodo[1]]);
    
    for (let i = 0; i < maxRows; i++) {
        const totalRow = data.totales[i] || {};
        const periodoRow = data.porPeriodo[i] || {};
        
        worksheet_data.push([
            totalRow.Categoria || '',
            totalRow.Valor !== undefined ? totalRow.Valor : '',
            '',
            periodoRow.Categoria || '',
            periodoRow.Valor !== undefined ? periodoRow.Valor : ''
        ]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheet_data);

    // ... (el resto del código sigue igual)
    worksheet['!cols'] = [
        { width: 30 }, { width: 15 }, { width: 5 }, { width: 30 }, { width: 35 }
    ];
    
    const headerCellStyle = { font: { bold: true, sz: 12 }, alignment: { horizontal: "center" } };
    worksheet['A1'].s = headerCellStyle;
    worksheet['B1'].s = headerCellStyle;
    worksheet['D1'].s = headerCellStyle;
    worksheet['E1'].s = headerCellStyle;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte General');

    // --- HOJAS ADICIONALES PARA GRÁFICOS ---
    if (data.graficos) {
        for (const sheetName in data.graficos) {
            if (data.graficos[sheetName] && data.graficos[sheetName].length > 0) {
                const chartSheet = XLSX.utils.json_to_sheet(data.graficos[sheetName]);
                const colWidths = Object.keys(data.graficos[sheetName][0]).map(key => ({
                    width: key.length > 15 ? key.length + 5 : 20
                }));
                chartSheet['!cols'] = colWidths;
                XLSX.utils.book_append_sheet(workbook, chartSheet, sheetName.substring(0, 31));
            }
        }
    }
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    saveAs(blob, `${fileName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <button onClick={exportToExcel} className="boton-excel" disabled={disabled}>
      {disabled ? 'Cargando datos...' : 'Exportar a Excel'}
    </button>
  );
};

export default ExportarExcelButton;