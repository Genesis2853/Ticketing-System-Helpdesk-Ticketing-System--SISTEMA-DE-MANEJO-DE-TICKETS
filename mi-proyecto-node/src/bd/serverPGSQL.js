import pg from "pg";

export const pool= new pg.Pool({
    host:"localhost",
    port:5432,
    database:"bd_soportetecnico",
    user:"soporte",
    password:"1859",

});