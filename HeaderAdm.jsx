import React from "react";
import './App.css';
import './HeaderAdm.css';
import CierreSesionUsuario from "../Modulo_Usuario/Cierre_sesion";
import Notificaciones from "../Modulo_Usuario/Notificaciones"; // Ajusta el path según tu estructura
import logo from './logo.png';

const MostrarContenidoHeader = ({ onLogout, user, token, gestionusuarioSidebar }) => {
    return (
        <header className="header-adm">
            <div className="header-content">
                <img src={logo} alt="Logo de Grupo Tecnolife" className="header-logoo" />
                <div className="header-actions">
                    <Notificaciones user={user} token={token} />
                    <CierreSesionUsuario onLogout={onLogout} gestionusuarioSidebar={gestionusuarioSidebar} user={user} />

                </div>
            </div>
        </header>
    );
};

export default MostrarContenidoHeader;
