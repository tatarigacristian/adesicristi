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
      <div className="flex flex-col items-center text-center px-8 w-full">
        {/* "Ne casatorim!" label */}
        <p className="text-[0.8rem] tracking-[0.35em] uppercase text-foreground/50 serif-font font-medium mb-2">
          Ne casatorim!
        </p>

        {/* Names - large script font */}
        <h1 className="script-font text-6xl xl:text-7xl text-text-heading mb-4 leading-tight">
          Ade & Cristi
        </h1>

        {/* Heart divider */}
        <div className="elegant-divider mb-4">
          <span></span>
          <span className="heart-icon">&#9829;</span>
          <span></span>
        </div>

        {/* Date - large serif */}
        <p className="serif-font text-2xl text-text-heading font-light tracking-wide mb-2">
          4 Iulie 2026
        </p>

        {/* Location */}
        <div className="flex flex-col items-center gap-0.5 text-foreground/50 mb-8">
          <div className="flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="serif-font text-sm">Iasi</span>
          </div>
        </div>

        {/* Countdown */}
        <div className="w-full max-w-xs mb-10">
          <Countdown variant="sidebar" />
        </div>

        {/* Navigation - centered */}
        <nav className="w-full">
          <ul className="flex flex-col items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <li key={item.href} className="flex items-center gap-3">
                <span
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    activeSection === item.href.slice(1)
                      ? "bg-accent-rose"
                      : "bg-border"
                  }`}
                />
                <a
                  href={item.href}
                  onClick={(e) => handleClick(e, item.href)}
                  className={`text-[0.7rem] tracking-[0.2em] uppercase transition-colors duration-300 cursor-pointer ${
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
