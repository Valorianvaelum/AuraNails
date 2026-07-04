function App() {
  return (
    <main className="min-h-screen bg-[#fff8f7] text-[#3d2f32]">
      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12 sm:px-8">
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.22em] text-[#b76e79]">
            Gestion para manicuras
          </p>
          <h1 className="text-5xl font-semibold tracking-normal text-[#2f2528] sm:text-6xl">
            AuraNails
          </h1>
          <p className="mt-5 text-lg leading-8 text-[#6f5b60] sm:text-xl">
            Organizá tus turnos, clientas y cobros en un solo lugar.
          </p>
          <button className="mt-8 rounded-full bg-[#b76e79] px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-[#9e5e68] focus:outline-none focus:ring-4 focus:ring-[#e8c8ce]">
            Comenzar
          </button>
        </div>

        <div className="mt-12 grid gap-3 text-sm text-[#6f5b60] sm:grid-cols-3">
          <div className="rounded-lg border border-[#efdadd] bg-white/70 p-4">
            Turnos simples
          </div>
          <div className="rounded-lg border border-[#efdadd] bg-white/70 p-4">
            Clientas ordenadas
          </div>
          <div className="rounded-lg border border-[#efdadd] bg-white/70 p-4">
            Cobros claros
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
