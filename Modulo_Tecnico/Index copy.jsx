import React, { useContext } from "react";
import './appT.css';
import { AuthContext } from "../Modulo_Usuario/autorizacion-proteccion/Autenticarcontexto.jsx"; 
import MostrarContenidoSectionTec from "./SectionTec.jsx";
import MostrarContenidoAsideTec from "./AsideTec.jsx";
import { Navigate } from 'react-router-dom'; // Importar Navigate en vez de Redirect

const InicioT = () => {
    const { user } = useContext(AuthContext);

    if (!user) {
        return <Navigate to="/login" replace />;  // Redirige a /login si el usuario no está autenticado
    }

    return (
        <main className="main-Tec">
            <div className="div-contenedor-secasi">
                <MostrarContenidoSectionTec />
                <MostrarContenidoAsideTec />
            </div>
        </main>
    );
}

export default InicioT;
