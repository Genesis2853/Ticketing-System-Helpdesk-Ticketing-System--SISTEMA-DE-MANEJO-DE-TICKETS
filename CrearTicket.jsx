import React from "react";

import Formulario from "./formularios/FormularioCreartickes";
import './cuadro_ver_datos/visualizacion.css'

const CrearTicket = ({user}) => {
console.log("Usuario recibido en Vercreartickets:", user);

    return <main className="main-adm">
    
    <Formulario user={user}/>
      
    </main>
}

export default CrearTicket;