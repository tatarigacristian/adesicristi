"use client";

import { useState } from "react";

const NAV_ITEMS = [
  { label: "Noi doi", href: "#couple" },
  { label: "Familie", href: "#family" },
  { label: "Locatii", href: "#locations" },
  { label: "Confirma prezenta", href: "#rsvp" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setOpen(false);
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="lg:hidden">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm
                   border border-border-light shadow-sm flex items-center justify-center
                   text-text-heading transition-colors hover:bg-white"
        aria-label="Menu"
      >
        <span className="text-lg">{open ? "\u2715" : "\u2630"}</span>
      </button>

      {/* Overlay menu */}
      {open && (
        <div className="fixed inset-0 z-40 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center gap-6">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => handleClick(e, item.href)}
              className="text-sm tracking-[0.2em] uppercase text-text-heading hover:text-button transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
