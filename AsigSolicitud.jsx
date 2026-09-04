import React from "react";
import AsignacionForm from "./formularios/FormularioAsigSolicitud";
import './AsideAdm.css';

const AsignaciondeSolicitud = ({ user }) => {
console.log("Usuario recibido en asignatic:", user);

    return <main className="main-adm">
    
    <AsignacionForm />
    
    </main>
}

export default AsignaciondeSolicitud;