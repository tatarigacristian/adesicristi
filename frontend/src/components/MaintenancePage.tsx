import { Heart } from "@phosphor-icons/react";

/** Pagina afisata cand /api/wedding-settings nu este disponibil */
export default function MaintenancePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-8 py-16 bg-[#faf8f6]">
      <div className="max-w-md w-full text-center">
        <p className="script-font text-4xl sm:text-5xl text-[#2c2622] mb-2 tracking-wide">Ade &amp; Cristi</p>
        <div className="flex items-center justify-center gap-3 my-6">
          <span className="h-px w-10 bg-[#b8a090]" />
          <Heart size={20} weight="fill" className="text-[#b8a090]" />
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
