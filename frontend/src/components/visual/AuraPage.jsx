import { cn } from "@/lib/utils";

import AppHeader from "@/components/AppHeader.jsx";

const widths = {
  compact: "max-w-3xl",
  form: "max-w-4xl",
  content: "max-w-5xl",
  wide: "max-w-7xl",
};

function AuraPage({ children, className, width = "content" }) {
  return (
    <main className="aura-main min-h-screen text-foreground">
      <AppHeader />
      <section className={cn("aura-page mx-auto w-full px-4 py-7 sm:px-6 sm:py-10 lg:px-8", widths[width] || widths.content, className)}>
        {children}
      </section>
    </main>
  );
}

function AuraHero({ actions, back, children, className, description, eyebrow, title }) {
  return (
    <header className={cn("aura-glass aura-hero", className)}>
      <div className="aura-hero-copy">
        {back ? <div className="aura-hero-back">{back}</div> : null}
        {eyebrow ? <p className="aura-eyebrow">{eyebrow}</p> : null}
        <h1 className="aura-hero-title">{title}</h1>
        {description ? <p className="aura-hero-description">{description}</p> : null}
        {children}
      </div>
      {actions ? <div className="aura-hero-actions">{actions}</div> : null}
    </header>
  );
}

function AuraPanel({ as: Component = "section", children, className, ...props }) {
  return (
    <Component className={cn("aura-glass aura-panel", className)} {...props}>
      {children}
    </Component>
  );
}

function AuraPanelHeader({ action, children, className, description, title }) {
  return (
    <div className={cn("aura-panel-header", className)}>
      <div>
        <h2 className="aura-panel-title">{title}</h2>
        {description ? <p className="aura-panel-description">{description}</p> : null}
        {children}
      </div>
      {action ? <div className="aura-panel-action">{action}</div> : null}
    </div>
  );
}

function AuraRecordCard({ as: Component = "div", children, className, interactive, ...props }) {
  const isInteractive = interactive ?? Boolean(
    Component === "a"
      || Component === "button"
      || props.href
      || props.to
      || props.onClick,
  );

  return (
    <Component className={cn("aura-record-card", isInteractive && "is-interactive", className)} {...props}>
      {children}
    </Component>
  );
}

function AuraEmptyState({ action, children, className, description, title, ...props }) {
  return (
    <div className={cn("aura-empty-state", className)} {...props}>
      <span className="aura-empty-state-orbit" aria-hidden="true"><span /></span>
      <div className="aura-empty-state-copy">
        {title ? <p className="aura-empty-state-title">{title}</p> : null}
        {description ? <p className="aura-empty-state-description">{description}</p> : null}
        {children}
      </div>
      {action ? <div className="aura-empty-state-action">{action}</div> : null}
    </div>
  );
}

export { AuraEmptyState, AuraHero, AuraPage, AuraPanel, AuraPanelHeader, AuraRecordCard };
