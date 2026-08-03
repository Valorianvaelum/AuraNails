function AuraLoadingScreen({ label = "Cargando tu espacio..." }) {
  return (
    <main className="aura-loading-screen" aria-busy="true" aria-label={label} aria-live="polite">
      <div className="aura-loading-card" role="status" aria-atomic="true">
        <span className="aura-loading-mark" aria-hidden="true">
          <img className="aura-loading-logo" src="/logo-favicon.png" alt="" width="512" height="512" decoding="async" />
        </span>
        <div>
          <p className="aura-loading-title">AuraNails</p>
          <p className="aura-loading-description">{label}</p>
        </div>
        <span className="aura-loading-indicator" aria-hidden="true" />
      </div>
    </main>
  );
}

export default AuraLoadingScreen;
