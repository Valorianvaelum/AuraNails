import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { obtenerCaja, obtenerCajaAbierta } from "../api/caja.js";
import CajaDialog from "../components/CajaDialog.jsx";
import CajaMovimientos from "../components/CajaMovimientos.jsx";
import CajaResumen, { dinero, fechaHora } from "../components/CajaResumen.jsx";
import AppHeader from "../components/AppHeader.jsx";

function mensajeDeError(error) {
  return error.response?.status === 404 ? "No encontramos esta caja." : "No pudimos cargar tu caja. Intentá nuevamente.";
}

export default function CajaPage() {
  const navigate = useNavigate();
  const [caja, setCaja] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [dialogo, setDialogo] = useState(null);
  const [mensaje, setMensaje] = useState("");

  const cargarCaja = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const abierta = await obtenerCajaAbierta();
      setCaja(abierta ? await obtenerCaja(abierta.id) : null);
    } catch (requestError) {
      setCaja(null);
      setError(mensajeDeError(requestError));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarCaja(); }, [cargarCaja]);

  const operacionExitosa = async (texto) => {
    setDialogo(null);
    setMensaje(texto);
    if (dialogo?.tipo === "cerrar" && caja) {
      navigate(`/caja/${caja.id}`, { state: { message: texto } });
      return;
    }
    await cargarCaja();
  };

  return (
    <main className="min-h-screen bg-[#fff4f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-semibold">Caja</h1><p className="mt-1 text-[#6f5b60]">Controlá el dinero físico de la jornada.</p></div><Link className="aura-action aura-action-contextual" to="/caja/historial">Ver historial</Link></div>
        {mensaje && <p className="mt-5 rounded-xl bg-[#eef8f0] p-3 text-[#356640]">{mensaje}</p>}
        {cargando && <p className="mt-6">Cargando caja...</p>}
        {error && <div className="mt-6 rounded-2xl border border-[#e7c5ca] bg-white p-5"><p className="text-[#8b3f4c]">{error}</p><button className="mt-3 aura-action aura-action-secondary" type="button" onClick={cargarCaja}>Reintentar</button></div>}
        {!cargando && !error && !caja && <section className="mt-6 rounded-3xl border border-[#efdadd] bg-white p-7 sm:p-10"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#b76e79]">Caja cerrada</p><h2 className="mt-3 text-2xl font-semibold">No tenés una caja abierta.</h2><p className="mt-3 max-w-xl text-[#6f5b60]">Abrila antes de registrar cobros y movimientos de esta jornada.</p><div className="mt-6 flex flex-wrap gap-3"><button className="aura-action aura-action-primary" type="button" onClick={() => setDialogo({ tipo: "abrir" })}>Abrir caja</button></div></section>}
        {!cargando && !error && caja && <>
          <section className="mt-6 rounded-3xl border border-[#efdadd] bg-white p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4"><div><span className="rounded-full bg-[#e7f5ea] px-3 py-1 text-sm font-semibold text-[#356640]">Caja abierta</span><p className="mt-4 text-sm text-[#6f5b60]">Abierta: {fechaHora(caja.abierta_en)}</p><p className="mt-1 text-sm text-[#6f5b60]">Saldo inicial: {dinero(caja.saldo_inicial)}</p></div><Link className="aura-action aura-action-secondary" to={`/caja/${caja.id}`}>Ver detalle</Link></div>
            <div className="mt-6"><CajaResumen caja={caja} /></div>
            <section className="aura-financial-section mt-7"><h2 className="text-lg font-semibold">Movimientos de caja</h2><p className="mt-1 text-sm text-[#6f5b60]">Registrá entradas y salidas de efectivo durante la jornada.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><button className="aura-action aura-action-secondary" type="button" onClick={() => setDialogo({ tipo: "gasto" })}>Registrar gasto</button><button className="aura-action aura-action-secondary" type="button" onClick={() => setDialogo({ tipo: "aporte" })}>Registrar aporte</button><button className="aura-action aura-action-warning" type="button" onClick={() => setDialogo({ tipo: "retiro" })}>Registrar retiro</button></div></section>
            <section className="aura-financial-section mt-7"><h2 className="text-lg font-semibold">Cierre de jornada</h2><p className="mt-1 max-w-2xl text-sm text-[#6f5b60]">Revisá el saldo esperado y registrá el efectivo contado antes de cerrar.</p><div className="mt-4"><button className="aura-action aura-action-destructive" type="button" onClick={() => setDialogo({ tipo: "cerrar" })}>Cerrar caja</button></div></section>
          </section>
          <CajaMovimientos caja={caja} onAnularGasto={(registro) => setDialogo({ tipo: "anularGasto", registro })} onAnularMovimiento={(registro) => setDialogo({ tipo: "anularMovimiento", registro })} />
        </>}
      </section>
      {dialogo && <CajaDialog tipo={dialogo.tipo} caja={caja} registro={dialogo.registro} onClose={() => setDialogo(null)} onSuccess={operacionExitosa} />}
    </main>
  );
}
