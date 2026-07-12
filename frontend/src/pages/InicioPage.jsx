import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { obtenerCajaAbierta } from "../api/caja.js";
import { useAuth } from "../auth/AuthContext.jsx";
import AppHeader from "../components/AppHeader.jsx";
import { dinero } from "../components/CajaResumen.jsx";

function InicioPage() {
  const { user } = useAuth();
  const nombre = typeof user?.nombre === "string" ? user.nombre.trim() : "";
  const [caja, setCaja] = useState(undefined);

  useEffect(() => {
    let vigente = true;
    obtenerCajaAbierta().then((data) => { if (vigente) setCaja(data); }).catch(() => { if (vigente) setCaja(null); });
    return () => { vigente = false; };
  }, []);

  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <AppHeader />
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-2xl items-center px-5 py-10 sm:px-8">
        <div className="w-full rounded-3xl border border-[#efdadd] bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b76e79]">AuraNails</p>
          <h1 className="mt-4 text-4xl font-semibold text-[#2f2528]">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-[#6f5b60]">
            Bienvenida a tu espacio de AuraNails.
          </p>
          {caja !== undefined && <section className="mt-7 rounded-2xl bg-[#fff8f7] p-5"><p className="font-semibold">{caja ? "Caja abierta" : "Caja cerrada"}</p>{caja ? <><p className="mt-1 text-sm text-[#6f5b60]">Saldo esperado: {dinero(caja.resumen?.saldo_teorico)}</p><Link className="mt-3 inline-block font-semibold underline" to="/caja">Ir a Caja</Link></> : <Link className="mt-3 inline-block rounded-xl bg-[#b76e79] px-4 py-2 font-semibold text-white" to="/caja">Abrir caja</Link>}</section>}
        </div>
      </section>
    </main>
  );
}

export default InicioPage;
