import { FinancialAmount } from "./Financial.jsx";

export const dinero = (value) => new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
}).format(Number(value || 0));

export const fechaHora = (value) => value
  ? new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  : "Sin registrar";

function valor(caja, key, fallback) {
  const resumen = caja?.resumen || {};
  return resumen[key] ?? fallback ?? 0;
}

export default function CajaResumen({ caja, compacto = false }) {
  const resumen = caja?.resumen || {};
  const saldoEsperado = resumen.saldo_teorico ?? caja?.saldo_teorico_cierre ?? 0;
  const metricas = [
    { label: "Saldo inicial", amount: valor(caja, "saldo_inicial", caja?.saldo_inicial) },
    { label: "Ingresos en efectivo", amount: resumen.cobros_por_metodo?.efectivo, tone: "positive" },
    { label: "Gastos en efectivo", amount: resumen.gastos_por_metodo?.efectivo, tone: "negative" },
    { label: "Aportes", amount: resumen.aportes, tone: "positive" },
    { label: "Retiros", amount: resumen.retiros, tone: "negative" },
  ];
  const metodos = Object.entries(resumen.cobros_por_metodo || {});

  return (
    <section aria-label="Resumen de caja" className="cash-summary">
      <article className="cash-balance-card">
        <div>
          <p className="cash-kicker">Saldo esperado</p>
          <p className="cash-balance-help">Efectivo que debería encontrarse en caja según los movimientos activos.</p>
        </div>
        <FinancialAmount amount={saldoEsperado} size="xl" tone="positive" />
      </article>

      <div className={`cash-summary-grid ${compacto ? "is-compact" : ""}`}>
        {metricas.map((metrica) => (
          <article className={`cash-summary-metric cash-tone-${metrica.tone || "neutral"}`} key={metrica.label}>
            <FinancialAmount amount={metrica.amount} label={metrica.label} size="md" tone={metrica.tone || "neutral"} />
          </article>
        ))}
      </div>

      <article className="cash-method-breakdown">
        <div className="cash-method-header">
          <div>
            <h3>Cobros por método</h3>
            <p>Distribución de los cobros registrados en esta caja.</p>
          </div>
          <FinancialAmount amount={resumen.total_cobros} label="Total registrado" size="md" />
        </div>
        <div className="cash-method-grid">
          {metodos.length ? metodos.map(([metodo, importe]) => (
            <div className="cash-method-item" key={metodo}>
              <span>{metodo.charAt(0).toUpperCase() + metodo.slice(1)}</span>
              <strong>{dinero(importe)}</strong>
            </div>
          )) : <p className="cash-muted">Todavía no hay cobros distribuidos por método.</p>}
        </div>
      </article>
    </section>
  );
}
