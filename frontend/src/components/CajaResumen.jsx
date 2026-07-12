export const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(value || 0));
export const fechaHora = (value) => value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin registrar";

export default function CajaResumen({ caja, compacto = false }) {
  const resumen = caja?.resumen || {};
  const items = [
    ["Saldo inicial", resumen.saldo_inicial ?? caja?.saldo_inicial],
    ["Efectivo ingresado", resumen.cobros_por_metodo?.efectivo],
    ["Gastos en efectivo", resumen.gastos_por_metodo?.efectivo],
    ["Aportes", resumen.aportes],
    ["Retiros", resumen.retiros],
    ["Saldo esperado", resumen.saldo_teorico ?? caja?.saldo_teorico_cierre],
  ];

  return (
    <section aria-label="Resumen de caja" className="space-y-4">
      <div className={`grid gap-3 ${compacto ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
        {items.map(([titulo, importe]) => (
          <article className="rounded-2xl border border-[#efdadd] bg-white p-4" key={titulo}>
            <p className="text-sm text-[#6f5b60]">{titulo}</p>
            <p className="mt-1 text-xl font-semibold text-[#2f2528]">{dinero(importe)}</p>
          </article>
        ))}
      </div>
      <article className="rounded-2xl border border-[#efdadd] bg-white p-4">
        <p className="font-semibold">Cobros por método</p>
        <p className="mt-1 text-sm text-[#6f5b60]">Total registrado: {dinero(resumen.total_cobros)}</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
          {Object.entries(resumen.cobros_por_metodo || {}).map(([metodo, importe]) => <p key={metodo}>{metodo.charAt(0).toUpperCase() + metodo.slice(1)}: <strong>{dinero(importe)}</strong></p>)}
        </div>
      </article>
    </section>
  );
}
