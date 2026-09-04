import React from "react";
import './App.css';

import MostrarContenidoSectionAdm from "./SectionAdm.jsx";
import MostrarContenidoAsideAdm from "./AsideAdm.jsx";


const Inicio = ({user}) => {
 

    return <main className="main-adm">
      
      <div className="div-contenedor-secasi">
      <MostrarContenidoSectionAdm tipo_usuario={user?.tipo_usuario} user={user} />
      <MostrarContenidoAsideAdm user={user}/>
      </div>
      </main>
     
    
}

export default Inicio;