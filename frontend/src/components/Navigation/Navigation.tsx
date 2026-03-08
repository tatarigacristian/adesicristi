"use client";

import { useState, useEffect } from "react";

const NAV_ITEMS = [
  { label: "Noi doi", href: "#couple" },
  { label: "Familie", href: "#family" },
  { label: "Locatii", href: "#locations" },
  { label: "Confirma prezenta", href: "#rsvp" },
];

export default function Navigation() {
  const [activeSection, setActiveSection] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const container = document.querySelector(".snap-container");
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      // Show nav after scrolling past hero
      setIsVisible(scrollTop > window.innerHeight * 0.5);

      // Determine active section
      const sections = NAV_ITEMS.map((item) => ({
        id: item.href.slice(1),
        el: document.getElementById(item.href.slice(1)),
      }));

      for (const section of sections.reverse()) {
        if (section.el) {
          const rect = section.el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    target?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-sm shadow-sm">
        <ul className="flex items-center justify-center gap-2 px-4 py-3 md:gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                onClick={(e) => handleClick(e, item.href)}
                className={`text-xs md:text-sm font-medium transition-colors px-2 py-1 ${
                  activeSection === item.href.slice(1)
                    ? "text-accent"
                    : "text-foreground hover:text-accent"
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
