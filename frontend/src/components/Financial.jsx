import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 2,
});

function FinancialAmount({ amount, className, label, size = "md", tone = "neutral" }) {
  return (
    <div className={cn("finance-amount", `finance-amount-${size}`, `finance-amount-${tone}`, className)}>
      {label ? <span className="finance-amount-label">{label}</span> : null}
      <strong>{moneyFormatter.format(Number(amount || 0))}</strong>
    </div>
  );
}

function FinancialStatus({ className, label, status }) {
  const normalized = status || "registrado";
  return (
    <span className={cn("finance-status", `finance-status-${normalized}`, className)}>
      <span aria-hidden="true" className="finance-status-dot" />
      {label || normalized}
    </span>
  );
}

export { FinancialAmount, FinancialStatus };
