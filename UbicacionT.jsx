import React from "react";
import './Mapa.css';
import Mapa from "./Mapa.jsx";
import 'leaflet/dist/leaflet.css';

const UbicacionT = () => {
    return <div
  style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh', // ← alto completo
    width: '100%',
    backgroundColor: '#f0f0f0' // opcional para distinguir fondo
  }}
>


        <div className="contenedor-mapa-ubicacionT">

      <Mapa />
    </div>
    </div>
}

export default UbicacionT;