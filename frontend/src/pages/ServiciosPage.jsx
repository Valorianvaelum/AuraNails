import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { estadoServicio, getServicio, listServicios, saveServicio } from "../api/servicios.js";
import AppHeader from "../components/AppHeader.jsx";

const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const initial = { nombre: "", descripcion: "", duracion_minutos: "60", precio: "", orden: "0" };

function Page({ children }) {
  return <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-4xl px-5 py-8">{children}</section></main>;
}

function List() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("activos");
  const [error, setError] = useState("");

  useEffect(() => {
    listServicios({ search, estado }).then(setItems).catch(() => setError("No pudimos cargar tus servicios."));
  }, [search, estado]);

  const empty = search
    ? "No encontramos servicios con esa búsqueda."
    : estado === "pausados"
      ? "No tenés servicios pausados."
      : "Todavía no agregaste ningún servicio.";

  return <Page><div className="flex justify-between"><h1 className="text-3xl font-semibold">Mis servicios</h1><Link className="rounded-xl bg-[#b76e79] px-4 py-3 font-semibold text-white" to="nuevo">Nuevo servicio</Link></div><div className="mt-6 grid gap-3 sm:grid-cols-2"><input className="rounded-xl border p-3" placeholder="Buscar servicios" value={search} onChange={(event) => setSearch(event.target.value)} /><select className="rounded-xl border p-3" value={estado} onChange={(event) => setEstado(event.target.value)}><option value="activos">Activos</option><option value="pausados">Pausados</option><option value="todos">Todos</option></select></div>{error && <p className="mt-5 text-[#8b3f4c]">{error}</p>}<div className="mt-6 grid gap-3">{items.map((servicio) => <Link className="rounded-2xl border bg-white p-5" to={`${servicio.id}`} key={servicio.id}><b>{servicio.nombre}</b><p className="mt-1 text-sm text-[#6f5b60]">{servicio.duracion_legible} · {money(servicio.precio)} {!servicio.activo && "· Pausado"}</p></Link>)}{!error && !items.length && <p className="rounded-2xl border bg-white p-8 text-center">{empty}</p>}</div></Page>;
}

function Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [valores, setValores] = useState(initial);
  const [error, setError] = useState("");
  const campos = [
    ["nombre", "Nombre", "text"],
    ["descripcion", "Descripción", "text"],
    ["duracion_minutos", "Duración estimada (minutos)", "number"],
    ["precio", "Precio en pesos argentinos", "number"],
    ["orden", "Posición en la lista", "number"],
  ];

  useEffect(() => {
    if (id) getServicio(id).then(setValores).catch(() => setError("No encontramos este servicio."));
  }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    try {
      const servicio = await saveServicio(id, {
        ...valores,
        duracion_minutos: Number(valores.duracion_minutos),
        orden: Number(valores.orden),
      });
      navigate(`/servicios/${servicio.id}`);
    } catch (requestError) {
      setError(requestError.response?.data?.nombre?.[0] || requestError.response?.data?.duracion_minutos?.[0] || requestError.response?.data?.precio?.[0] || "Revisá los campos marcados.");
    }
  };

  return <Page><Link to="/servicios">Volver</Link><h1 className="mt-4 text-3xl font-semibold">{id ? "Editar servicio" : "Nuevo servicio"}</h1><form className="mt-6 space-y-4 rounded-2xl border bg-white p-6" onSubmit={submit}>{campos.map(([nombre, etiqueta, tipo]) => <label className="block" key={nombre}>{etiqueta}{nombre === "orden" && <span className="mt-1 block text-sm text-[#6f5b60]">Los números más bajos se muestran primero.</span>}<input required={nombre !== "descripcion"} min={tipo === "number" ? "0" : undefined} step={nombre === "precio" ? "0.01" : "1"} className="mt-1 w-full rounded-xl border p-3" type={tipo} value={valores[nombre] ?? ""} onChange={(event) => setValores({ ...valores, [nombre]: event.target.value })} /></label>)}<p className="text-sm text-[#6f5b60]">Ejemplo: 90 minutos equivale a 1 h 30 min.</p>{error && <p className="text-[#8b3f4c]">{error}</p>}<button className="rounded-xl bg-[#b76e79] px-5 py-3 font-semibold text-white">{id ? "Guardar cambios" : "Guardar servicio"}</button></form></Page>;
}

function Detail() {
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getServicio(id).then(setServicio).catch(() => setError("No encontramos este servicio."));
  }, [id]);

  const cambiarEstado = async () => {
    if (servicio.activo && !window.confirm("El servicio dejará de aparecer entre los activos, pero conservarás toda su información.")) return;
    try {
      setServicio(await estadoServicio(id, !servicio.activo));
    } catch {
      setError("No pudimos actualizar el servicio.");
    }
  };

  if (error) return <Page><p>{error}</p></Page>;
  if (!servicio) return <Page><p>Cargando servicio...</p></Page>;
  return <Page><Link to="/servicios">Volver a mis servicios</Link><div className="mt-5 rounded-2xl border bg-white p-6"><h1 className="text-3xl font-semibold">{servicio.nombre}</h1><p>{servicio.activo ? "Activo" : "Pausado"}</p><p className="mt-5">{servicio.descripcion || "Sin descripción."}</p><p>{servicio.duracion_legible} · {money(servicio.precio)}</p><p>Posición en la lista: {servicio.orden}</p><Link className="mt-6 inline-block font-semibold underline" to="editar">Editar</Link><button className="ml-5 rounded-xl border px-4 py-2" onClick={cambiarEstado}>{servicio.activo ? "Pausar" : "Reactivar"}</button></div></Page>;
}

export default function ServiciosPage() {
  return <Routes><Route index element={<List />} /><Route path="nuevo" element={<Form />} /><Route path=":id" element={<Detail />} /><Route path=":id/editar" element={<Form />} /></Routes>;
}
