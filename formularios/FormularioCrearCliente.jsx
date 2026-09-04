import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import debounce from "lodash/debounce";
import axios from "axios";
import "./FormularioCrearClientes.css";
import { useSnackbar } from "notistack"; // ⬅️ Notistack

const FormularioCliente = ({ user }) => {
  /* ─── modo creación / edición ─── */
  const { id } = useParams();              // existe => edición
  const esEdicion = Boolean(id);
    const { enqueueSnackbar } = useSnackbar();

  /* ─── navegación ─── */
  const navigate = useNavigate();
  const irListado = () =>
    navigate("/VerdatosClientes", { state: { showBackButton: true } });

  /* ─── estado del formulario ─── */
  const [formData, setFormData] = useState({
    nro_contrato: "",
    nombre_cliente: "",
    apellido_cliente: "",
    n_tlf_cliente: "",
    email_cliente: "",
    direccion_cliente: "",
    tipo_servicio: "",
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [contratoDisponible, setContratoDisponible] = useState(null);

  /* ─── helpers URLs ─── */
  const apiCrear = process.env.REACT_APP_API_URL_CREAR;        // POST crear / validar contrato
  const apiVer   = process.env.REACT_APP_API_URL_VERCLIENTE;   // GET + PATCH editar

  /* ────────────────────────────────
     CARGAR CLIENTE (modo edición)
  ─────────────────────────────────*/
  useEffect(() => {
    if (!esEdicion) return;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${apiVer}/api/cliver/vercliente/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const cli = await res.json();
        setFormData({
          nro_contrato: cli.nro_contrato ?? "",
          nombre_cliente: cli.nombre_cliente ?? "",
          apellido_cliente: cli.apellido_cliente ?? "",
          n_tlf_cliente: cli.n_tlf_cliente ?? "",
          email_cliente: cli.email_cliente ?? "",
          direccion_cliente: cli.direccion_cliente ?? "",
          tipo_servicio: cli.tipo_servicio ?? "",
        });
      } catch (e) {
        enqueueSnackbar(`Error cargando cliente: ${e.message}`, {
          variant: "error",
        });
        irListado();
      }
    })();
  }, [esEdicion, id, apiVer, enqueueSnackbar]);

  /* ────────────────────────────────
     HANDLE CHANGE + validaciones en vivo
  ─────────────────────────────────*/
  const handleChange = (e) => {
    const { name, value } = e.target;
    /* reglas rápidas */
    if (name === "nro_contrato" && !/^\d*$/.test(value)) return;
    if (
      (name === "nombre_cliente" || name === "apellido_cliente") &&
      !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)
    )
      return;
    if (name === "n_tlf_cliente" && (!/^\d*$/.test(value) || value.length > 11))
      return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /* ────────────────────────────────
     VALIDAR antes de enviar
  ─────────────────────────────────*/
  const validate = () => {
    const f = formData;
    const errs = {};

    if (!f.nro_contrato) errs.nro_contrato = "¡El contrato es requerido!";
    else if (!/^\d+$/.test(f.nro_contrato))
      errs.nro_contrato = "¡El contrato debe ser numérico!";

    if (!f.direccion_cliente) errs.direccion_cliente = "¡La dirección es requerida!";
    if (!f.tipo_servicio) errs.tipo_servicio = "¡El tipo de servicio es requerido!";

    if (!f.nombre_cliente) errs.nombre_cliente = "¡El nombre es requerido!";
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(f.nombre_cliente))
      errs.nombre_cliente = "¡Solo letras!";

    if (!f.apellido_cliente) errs.apellido_cliente = "¡El apellido es requerido!";
    else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(f.apellido_cliente))
      errs.apellido_cliente = "¡Solo letras!";

    if (!f.n_tlf_cliente) errs.n_tlf_cliente = "¡Teléfono requerido!";
    else if (!/^\d{11}$/.test(f.n_tlf_cliente))
      errs.n_tlf_cliente = "¡Debe tener 11 dígitos!";

    if (!f.email_cliente) errs.email_cliente = "¡Correo requerido!";
    else if (!/\S+@\S+\.\S+/.test(f.email_cliente))
      errs.email_cliente = "¡Correo inválido!";

    return errs;
  };

  /* ────────────────────────────────
     SUBMIT (crear o actualizar)
  ─────────────────────────────────*/
  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length) return;

    try {
      const token = localStorage.getItem("token");
      const url = esEdicion
        ? `${apiVer}/api/cliver/vercliente/editar/${id}`
        : `${apiCrear}/api/clientes/crearclientes`;
      const method = esEdicion ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error(await res.text());

      const result = await res.json();
      const msg = esEdicion
        ? "Cliente actualizado correctamente."
        : `Cliente creado. Código: ${result.id_cliente}`;

      setSuccessMessage(msg);
      enqueueSnackbar(msg, { variant: "success" });

      /* si creamos, limpiamos; si editamos, no */
      if (!esEdicion) {
        setFormData({
          nro_contrato: "",
          nombre_cliente: "",
          apellido_cliente: "",
          n_tlf_cliente: "",
          email_cliente: "",
          direccion_cliente: "",
          tipo_servicio: "",
        });
        setContratoDisponible(null);
      }
      setErrors({});
    } catch (err) {
      enqueueSnackbar(`Error: ${err.message}`, { variant: "error" });
      setErrors({ submit: err.message });
    }
  };

  /* ────────────────────────────────
     VALIDAR CONTRATO ÚNICO (solo creación)
  ─────────────────────────────────*/
  const verificarContratoAPI = async (nro) => {
    try {
      const { data } = await axios.get(
        `${apiCrear}/api/clientes/validar-contrato?nro_contrato=${nro}`
      );
      return !data.existe;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const verificarContrato = useCallback(
    debounce((nro, cb) => {
      verificarContratoAPI(nro).then(cb);
    }, 500),
    []
  );

  useEffect(() => {
    if (!formData.nro_contrato.trim() || esEdicion) {
      setContratoDisponible(null);
      return;
    }
    let activo = true;
    verificarContrato(formData.nro_contrato.trim(), (ok) => {
      if (activo) setContratoDisponible(ok);
    });
    return () => (activo = false);
  }, [formData.nro_contrato, verificarContrato, esEdicion]);

  /* ────────────────────────────────
     RENDER
  ─────────────────────────────────*/
  return (
    <div className="div-contenedor-formulariocrearticket">
      <h2>{esEdicion ? "Editar Cliente" : "Crear Cliente"}</h2>

      <form className="form-crearticket" onSubmit={handleSubmit}>
        {/* Nº CONTRATO */}
        <div>
          <label className="form-titulos-CT">Número de Contrato:</label>
          <input
            type="text"
            name="nro_contrato"
            value={formData.nro_contrato}
            onChange={handleChange}
            className="form-box-CT"
            disabled={esEdicion}      /* no editable en edición */
          />
          {!esEdicion && contratoDisponible === false && (
            <p className="form-alertaerror-CT">⚠️ Número ya registrado</p>
          )}
          {!esEdicion && contratoDisponible === true && (
            <p className="form-validacion-ok">✔️ Número disponible</p>
          )}
          {errors.nro_contrato && (
            <p className="form-alertaerror-CT">{errors.nro_contrato}</p>
          )}
        </div>

        {/* NOMBRE */}
        <div>
          <label className="form-titulos-CT">Nombre:</label>
          <input
            type="text"
            name="nombre_cliente"
            value={formData.nombre_cliente}
            onChange={handleChange}
            className="form-box-CT"
          />
          {errors.nombre_cliente && (
            <p className="form-alertaerror-CT">{errors.nombre_cliente}</p>
          )}
        </div>

        {/* APELLIDO */}
        <div>
          <label className="form-titulos-CT">Apellido:</label>
          <input
            type="text"
            name="apellido_cliente"
            value={formData.apellido_cliente}
            onChange={handleChange}
            className="form-box-CT"
          />
          {errors.apellido_cliente && (
            <p className="form-alertaerror-CT">{errors.apellido_cliente}</p>
          )}
        </div>

        {/* TELÉFONO */}
        <div>
          <label className="form-titulos-CT">N. Teléfono:</label>
          <input
            type="tel"
            name="n_tlf_cliente"
            value={formData.n_tlf_cliente}
            onChange={handleChange}
            className="form-box-CT"
          />
          {errors.n_tlf_cliente && (
            <p className="form-alertaerror-CT">{errors.n_tlf_cliente}</p>
          )}
        </div>

        {/* EMAIL */}
        <div>
          <label className="form-titulos-CT">Correo Electrónico:</label>
          <input
            type="email"
            name="email_cliente"
            value={formData.email_cliente}
            onChange={handleChange}
            className="form-box-CT"
          />
          {errors.email_cliente && (
            <p className="form-alertaerror-CT">{errors.email_cliente}</p>
          )}
        </div>

        {/* DIRECCIÓN */}
        <div>
          <label className="form-titulos-CT">Dirección:</label>
          <textarea
            name="direccion_cliente"
            value={formData.direccion_cliente}
            onChange={handleChange}
            rows="4"
            className="form-box-CT"
          />
          {errors.direccion_cliente && (
            <p className="form-alertaerror-CT">
              {errors.direccion_cliente}
            </p>
          )}
        </div>

        {/* TIPO SERVICIO */}
        <div>
          <label className="form-titulos-CT">Tipo de Servicio:</label>
          <select
            name="tipo_servicio"
            value={formData.tipo_servicio}
            onChange={handleChange}
            className="form-box-CT"
          >
            <option value="">Seleccione un tipo</option>
            <option value="Postpago">Postpago</option>
            <option value="Prepago">Prepago</option>
          </select>
          {errors.tipo_servicio && (
            <p className="form-alertaerror-CT">{errors.tipo_servicio}</p>
          )}
        </div>

        {/* BOTÓN */}
        <button type="submit" className="form-button-CT">
          {esEdicion ? "Actualizar" : "Crear"}
        </button>

        
        {errors.submit && (
          <p className="form-alertaerror-CT">{errors.submit}</p>
        )}
      </form>

      <button onClick={irListado} className="boton-redireccion-VT">
        Ver Clientes
      </button>
    </div>
  );
};

export default FormularioCliente;
