export const dinero = (value) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(Number(value || 0));
export const fechaHora = (value) => value ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "Sin registrar";

export default function CajaResumen({ caja, compacto = false }) {
  const resumen = caja?.resumen || {};
  const desglose = [
    ["Efectivo ingresado", resumen.cobros_por_metodo?.efectivo],
    ["Gastos en efectivo", resumen.gastos_por_metodo?.efectivo],
    ["Aportes", resumen.aportes],
    ["Retiros", resumen.retiros],
    ["Saldo inicial", resumen.saldo_inicial ?? caja?.saldo_inicial],
  ];

  return (
    <section aria-label="Resumen de caja" className="space-y-4">
      <article className="aura-financial-summary aura-financial-featured">
        <p className="text-sm font-semibold text-[#654552]">Saldo esperado</p>
        <p className="mt-2 aura-amount-primary">{dinero(resumen.saldo_teorico ?? caja?.saldo_teorico_cierre)}</p>
      </article>
      <div className={`grid gap-3 ${compacto ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
        {desglose.map(([titulo, importe]) => (
          <article className="aura-financial-summary" key={titulo}>
            <p className="text-sm text-[#6f5b60]">{titulo}</p>
            <p className="mt-1 aura-amount">{dinero(importe)}</p>
          </article>
        ))}
      </div>
      <article className="rounded-2xl border border-[#dcd1d5] bg-[#f4eff0] p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-semibold">Cobros por método</p><p className="text-sm text-[#6f5b60]">Total registrado: {dinero(resumen.total_cobros)}</p></div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(resumen.cobros_por_metodo || {}).map(([metodo, importe]) => <p key={metodo}>{metodo.charAt(0).toUpperCase() + metodo.slice(1)}: <strong>{dinero(importe)}</strong></p>)}
        </div>
      </article>
    </section>
  );
}
