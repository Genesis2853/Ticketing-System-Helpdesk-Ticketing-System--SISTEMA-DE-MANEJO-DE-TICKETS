import React from 'react';
import FormularioCliente from './formularios/FormularioCrearCliente';




const CrearCliente = ({ user }) => {
    
console.log("Usuario recibido en creacr clientes:", user)

    return <main className="main-adm">
    
    <FormularioCliente user={user}/>

    
    
    </main>
}

export default CrearCliente;