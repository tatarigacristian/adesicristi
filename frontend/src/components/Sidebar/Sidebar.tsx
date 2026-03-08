"use client";

import { useState, useEffect } from "react";
import Countdown from "../Countdown/Countdown";

const NAV_ITEMS = [
  { label: "Noi doi", href: "#couple" },
  { label: "Familie", href: "#family" },
  { label: "Locatii", href: "#locations" },
  { label: "Confirma prezenta", href: "#rsvp" },
];

export default function Sidebar() {
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );

    NAV_ITEMS.forEach((item) => {
      const el = document.getElementById(item.href.slice(1));
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <aside className="left-panel">
      <div className="flex flex-col items-center text-center px-8">
        {/* Hero info */}
        <p className="text-[0.7rem] tracking-[0.3em] uppercase text-text-muted mb-3">
          Ne casatorim!
        </p>
        <h1 className="script-font text-5xl lg:text-6xl text-text-heading mb-4 leading-tight">
          Ade & Cristi
        </h1>
        <div className="elegant-divider">
          <span></span>
          <span className="heart-icon">&#9829;</span>
          <span></span>
        </div>
        <p className="serif-font text-xl text-text-heading font-light mt-2 mb-1 tracking-wide">
          4 Iulie 2026
        </p>
        <p className="text-[0.75rem] text-text-muted mt-1">
          {/* TODO: add venue */}
        </p>

        {/* Countdown */}
        <div className="mt-8 mb-10 w-full">
          <Countdown variant="sidebar" />
        </div>

        {/* Navigation */}
        <nav className="w-full">
          <ul className="flex flex-col items-start gap-3 pl-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    activeSection === item.href.slice(1)
                      ? "bg-accent-rose"
                      : "bg-border"
                  }`}
                />
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors ${
                    activeSection === item.href.slice(1)
                      ? "text-text-heading font-medium"
                      : "text-text-muted hover:text-text-heading"
                  }`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
