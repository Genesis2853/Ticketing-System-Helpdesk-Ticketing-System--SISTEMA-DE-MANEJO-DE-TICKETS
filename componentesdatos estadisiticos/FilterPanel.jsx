import React from 'react';

const FilterPanel = ({ filters, onFilterChange }) => {


  const handleChange = (e) => {
  const { name, value } = e.target;
  const updatedFilters = { ...filters, [name]: value };

  // Validar que startDate no sea posterior a endDate
  if (updatedFilters.startDate > updatedFilters.endDate) {
    alert("La fecha de inicio no puede ser posterior a la fecha de fin.");
    return; // No actualiza el estado si la validación falla
  }

  onFilterChange(updatedFilters);
};


  return (
    <div className="filter-panel">
      <div className="filter-group">
        <label>Fecha Inicio:</label>
        <input
          type="date"
          name="startDate"
          value={filters.startDate}
          onChange={handleChange}
        />
      </div>
      <div className="filter-group">
        <label>Fecha Fin:</label>
        <input
          type="date"
          name="endDate"
          value={filters.endDate}
          onChange={handleChange}
        />
      </div>
      
    </div>
  );
};

export default FilterPanel;
