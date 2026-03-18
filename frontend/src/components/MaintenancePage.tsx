/** Pagina afisata cand /api/wedding-settings nu este disponibil */
export default function MaintenancePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 py-16 bg-[#faf8f6]">
      <div className="max-w-md w-full text-center">
        <p className="script-font text-4xl sm:text-5xl text-[#2c2622] mb-2 tracking-wide">Ade &amp; Cristi</p>
        <div className="flex items-center justify-center gap-3 my-6">
          <span className="h-px w-10 bg-[#b8a090]" />
          <svg viewBox="0 0 24 22" className="w-5 h-5 text-[#b8a090]" fill="currentColor" aria-hidden>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="h-px w-10 bg-[#b8a090]" />
        </div>
        <h1 className="serif-font text-2xl sm:text-3xl text-[#2c2622] font-light mb-4">Revenim în curând</h1>
        <p className="text-[0.95rem] text-[#6b6560] leading-relaxed font-light">
          Pagina noastră este momentan indisponibilă. Te rugăm să revii puțin mai târziu — pregătim totul cu drag pentru tine.
        </p>
      </div>
    </div>
  );
}
