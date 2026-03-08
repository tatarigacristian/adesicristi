"use client";

export default function Hero() {
  const handleClick = () => {
    const target = document.getElementById("couple");
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="snap-section content-section bg-background">
      <div className="max-w-2xl mx-auto text-center">
        {/* Mobile-only hero info (hidden on desktop where sidebar shows it) */}
        <div className="lg:hidden mb-8">
          <p className="text-[0.7rem] tracking-[0.3em] uppercase text-text-muted mb-3">
            Ne casatorim!
          </p>
          <h1 className="script-font text-5xl text-text-heading mb-4 leading-tight">
            Ade & Cristi
          </h1>
          <div className="elegant-divider">
            <span></span>
            <span className="heart-icon">&#9829;</span>
            <span></span>
          </div>
          <p className="serif-font text-xl text-text-heading font-light mt-2 tracking-wide">
            4 Iulie 2026
          </p>
        </div>

        {/* Monogram */}
        <div className="relative mb-8">
          <div className="w-28 h-28 mx-auto rounded-full border border-border flex items-center justify-center">
            <div className="w-24 h-24 rounded-full border border-border-light flex items-center justify-center">
              <span className="script-font text-3xl text-accent">
                A <span className="text-xl">&</span> C
              </span>
            </div>
          </div>
        </div>

        <p className="text-[0.65rem] tracking-[0.3em] uppercase text-text-muted mb-4">
          Cu drag va invitam
        </p>
        <h2 className="serif-font text-2xl md:text-3xl font-light italic text-text-heading leading-relaxed mb-6">
          Sa petreceti alaturi de noi cel mai important moment din viata noastra
        </h2>
        <div className="elegant-divider">
          <span></span>
          <span className="heart-icon">&#9829;</span>
          <span></span>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80 mt-6 max-w-lg mx-auto">
          Dragii nostri, cu bucurie in suflet va anuntam ca ne casatorim!
          Ne-ar face o deosebita placere sa fiti alaturi de noi in aceasta zi speciala,
          sa impartasim impreuna emotia si fericirea acestui moment unic.
        </p>

        {/* Scroll hint */}
        <div className="mt-12">
          <p className="text-[0.6rem] tracking-[0.25em] uppercase text-text-muted mb-2">
            Descopera mai mult
          </p>
          <button
            onClick={handleClick}
            className="text-accent-rose hover:text-accent-rose-light transition-colors text-xl"
            aria-label="Scroll down"
          >
            &#8964;
          </button>
        </div>
      </div>
    </section>
  );
}
