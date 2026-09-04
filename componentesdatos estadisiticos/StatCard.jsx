import React from 'react';

const StatCard = ({ title, value, unit = '', color = 'default', onClick }) => {
  const colorClasses = {
    default: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    highlight: 'bg-purple-100 text-purple-800',
    positive: 'bg-green-100 text-green-800',
    negative: 'bg-red-100 text-red-800'
  };

  return (
    <div 
      className={`stat-card ${colorClasses[color]}`}
      onClick={onClick}
    >
      <h3>{title}</h3>
      <div className="stat-value">
        {value !== undefined && value !== null ? value : '---'} {unit}
      </div>
    </div>
  );
};

export default StatCard;
