import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";

import { estadoServicio, getServicio, listServicios, saveServicio } from "../api/servicios.js";
import AppHeader from "../components/AppHeader.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import FieldError from "../components/FieldError.jsx";
import { normalizeApiError } from "../utils/apiErrors.js";

const money = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(value);
const initial = { nombre: "", descripcion: "", duracion_minutos: "60", precio: "", orden: "0" };

function Page({ children }) {
  return <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]"><AppHeader /><section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">{children}</section></main>;
}

function List() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("activos");
  const [error, setError] = useState("");

  useEffect(() => {
    listServicios({ search, estado }).then(setItems).catch(() => setError("No pudimos cargar tus servicios."));
  }, [search, estado]);

  const empty = search ? "No encontramos servicios con esa búsqueda." : estado === "pausados" ? "No tenés servicios pausados." : "Todavía no agregaste ningún servicio.";

  return <Page><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76e79]">Configuración</p><h1 className="mt-2 text-3xl font-semibold">Mis servicios</h1></div><Link className="rounded-xl bg-[#b76e79] px-4 py-3 font-semibold text-white" to="nuevo">Nuevo servicio</Link></div><div className="mt-6 grid gap-3 rounded-2xl border border-[#f1dce4] bg-white p-5 sm:grid-cols-[1fr_12rem]"><input className="rounded-xl border p-3" placeholder="Buscar servicios" value={search} onChange={(event) => setSearch(event.target.value)} /><select className="rounded-xl border p-3" value={estado} onChange={(event) => setEstado(event.target.value)}><option value="activos">Activos</option><option value="pausados">Pausados</option><option value="todos">Todos</option></select></div>{error && <p className="mt-5 rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]">{error}</p>}<div className="mt-6 grid gap-3">{items.map((servicio) => <Link className="rounded-2xl border border-[#f1dce4] border-l-4 border-l-[#c9aabd] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#c9aabd] hover:shadow-md" to={`${servicio.id}`} key={servicio.id}><div className="flex flex-wrap items-start justify-between gap-3"><div><b>{servicio.nombre}</b><p className="mt-2 text-sm text-[#6f5b60]">{servicio.duracion_legible}</p></div><div className="text-right"><p className="font-semibold">{money(servicio.precio)}</p><span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${servicio.activo ? "bg-[#e7f5ea] text-[#356640]" : "bg-[#f3ebf0] text-[#765367]"}`}>{servicio.activo ? "Activo" : "Pausado"}</span></div></div></Link>)}{!error && !items.length && <p className="rounded-2xl border border-dashed border-[#f1dce4] bg-white p-8 text-center">{empty}</p>}</div></Page>;
}

function Form() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [valores, setValores] = useState(initial);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [guardando, setGuardando] = useState(false);
  const campos = [["nombre", "Nombre", "text"], ["descripcion", "Descripción", "text"], ["duracion_minutos", "Duración estimada (minutos)", "number"], ["precio", "Precio en pesos argentinos", "number"], ["orden", "Posición en la lista", "number"]];

  useEffect(() => { if (id) getServicio(id).then(setValores).catch(() => setError("No encontramos este servicio.")); }, [id]);

  const submit = async (event) => {
    event.preventDefault();
    if (guardando) return;
    setError(""); setFieldErrors({}); setGuardando(true);
    try {
      const servicio = await saveServicio(id, { ...valores, duracion_minutos: Number(valores.duracion_minutos), orden: Number(valores.orden) });
      navigate(`/servicios/${servicio.id}`);
    } catch (requestError) {
      const parsed = normalizeApiError(requestError, "No pudimos guardar el servicio. Intentá nuevamente."); setFieldErrors(parsed.fields); setError(parsed.formError);
    } finally { setGuardando(false); }
  };

  return <Page><Link className="text-sm font-semibold underline underline-offset-4" to="/servicios">← Volver a mis servicios</Link><h1 className="mt-4 text-3xl font-semibold">{id ? "Editar servicio" : "Nuevo servicio"}</h1><p className="mt-2 text-[#6f5b60]">Definí la duración y el importe para ordenar mejor tus turnos.</p><form className="mt-6 rounded-2xl border border-[#f1dce4] bg-white p-5 sm:p-7" onSubmit={submit}><div className="grid gap-5 sm:grid-cols-2">{campos.map(([nombre, etiqueta, tipo]) => <label className={nombre === "descripcion" ? "sm:col-span-2" : ""} key={nombre}><span className="block text-sm font-medium">{etiqueta}</span>{nombre === "orden" && <span className="mt-1 block text-sm text-[#6f5b60]">Los números más bajos se muestran primero.</span>}<input aria-describedby={fieldErrors[nombre] ? `${nombre}-error` : undefined} aria-invalid={Boolean(fieldErrors[nombre])} required={nombre !== "descripcion"} min={tipo === "number" ? "0" : undefined} step={nombre === "precio" ? "0.01" : "1"} className={`mt-2 w-full rounded-xl border p-3 ${fieldErrors[nombre] ? "field-invalid" : ""}`} type={tipo} value={valores[nombre] ?? ""} onChange={(event) => setValores({ ...valores, [nombre]: event.target.value })} /><FieldError id={`${nombre}-error`} message={fieldErrors[nombre]} /></label>)}</div><p className="mt-5 text-sm text-[#6f5b60]">Ejemplo: 90 minutos equivale a 1 h 30 min.</p>{error && <p className="mt-5 rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]">{error}</p>}<div className="mt-7 border-t border-[#e5dce2] pt-5"><button disabled={guardando} className="rounded-xl bg-[#b76e79] px-5 py-3 font-semibold text-white">{guardando ? "Guardando…" : id ? "Guardar cambios" : "Guardar servicio"}</button></div></form></Page>;
}

function Detail() {
  const { id } = useParams();
  const [servicio, setServicio] = useState(null);
  const [error, setError] = useState("");
  const [confirmingPause, setConfirmingPause] = useState(false);

  useEffect(() => { getServicio(id).then(setServicio).catch(() => setError("No encontramos este servicio.")); }, [id]);
  const cambiarEstado = async () => {
    if (servicio.activo) { setConfirmingPause(true); return; }
    try { setServicio(await estadoServicio(id, !servicio.activo)); } catch { setError("No pudimos actualizar el servicio."); }
  };

  if (error) return <Page><p className="rounded-xl bg-[#fff0f1] px-4 py-3 text-[#8b3f4c]">{error}</p></Page>;
  if (!servicio) return <Page><p className="text-[#6f5b60]">Cargando servicio...</p></Page>;
  return <Page><Link className="text-sm font-semibold underline underline-offset-4" to="/servicios">← Volver a mis servicios</Link><article className="mt-5 rounded-2xl border border-[#f1dce4] bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${servicio.activo ? "bg-[#e7f5ea] text-[#356640]" : "bg-[#f3ebf0] text-[#765367]"}`}>{servicio.activo ? "Activo" : "Pausado"}</span><h1 className="mt-3 text-3xl font-semibold">{servicio.nombre}</h1></div><Link className="rounded-xl border border-[#e5dce2] bg-white px-4 py-2 font-semibold transition hover:bg-[#faf6f8]" to="editar">Editar</Link></div><dl className="mt-7 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-[#faf6f8] p-4"><dt className="text-sm text-[#6f5b60]">Duración estimada</dt><dd className="mt-1 font-semibold">{servicio.duracion_legible}</dd></div><div className="rounded-xl bg-[#faf6f8] p-4"><dt className="text-sm text-[#6f5b60]">Precio</dt><dd className="mt-1 text-lg font-semibold">{money(servicio.precio)}</dd></div></dl><section className="mt-6 rounded-xl border border-[#e5dce2] p-4"><h2 className="text-sm font-semibold text-[#765367]">Descripción</h2><p className="mt-2">{servicio.descripcion || "Sin descripción."}</p><p className="mt-3 text-sm text-[#6f5b60]">Posición en la lista: {servicio.orden}</p></section><section className="mt-7 border-t border-[#e5dce2] pt-5"><h2 className="text-sm font-semibold text-[#765367]">Acciones</h2><button className="mt-3 rounded-xl border border-[#e5dce2] bg-white px-4 py-2 font-semibold transition hover:bg-[#faf6f8]" onClick={cambiarEstado}>{servicio.activo ? "Pausar" : "Reactivar"}</button></section></article><ConfirmDialog open={confirmingPause} title="¿Pausar este servicio?" description="No podrá seleccionarse en nuevos turnos hasta que vuelva a activarse." confirmLabel="Pausar servicio" destructive onClose={() => setConfirmingPause(false)} onConfirm={async () => { setConfirmingPause(false); try { setServicio(await estadoServicio(id, false)); } catch { setError("No pudimos actualizar el servicio."); } }} /></Page>;
}

export default function ServiciosPage() {
  return <Routes><Route index element={<List />} /><Route path="nuevo" element={<Form />} /><Route path=":id" element={<Detail />} /><Route path=":id/editar" element={<Form />} /></Routes>;
}
