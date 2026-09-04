import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './AsideTec.css';

const MostrarContenidoAsideAdm = () => {
  return (
    <aside className="aside-adm-compact">
      <div className="calendar-compact-container">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev',
            center: 'title',
            right: 'next'
          }}
          height="auto"
          fixedWeekCount={false}
          dayMaxEventRows={1} // Muestra solo 1 evento por día
          events={[
            { title: 'Visita', date: '2023-11-15' },
            { title: 'Mantenimiento', date: '2023-11-20' }
          ]}
        />
      </div>
    </aside>
  );
};

export default MostrarContenidoAsideAdm;
