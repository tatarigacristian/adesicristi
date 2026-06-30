"use client";

import { useEffect, useState } from "react";
import { WeddingSettings, applyThemeColors, getCoupleNames } from "@/utils/settings";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

export default function VideoInvitePage() {
  const [ready, setReady] = useState(false);
  const [initials, setInitials] = useState({ mireasa: "A", mire: "C" });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/api/wedding-settings`);
        if (res.ok) {
          const s: WeddingSettings = await res.json();
          applyThemeColors(s);
          const names = getCoupleNames(s);
          setInitials({
            mireasa: names.mireasa.charAt(0).toUpperCase(),
            mire: names.mire.charAt(0).toUpperCase(),
          });
        } else {
          applyThemeColors(null);
        }
      } catch {
        applyThemeColors(null);
      }
      requestAnimationFrame(() => setReady(true));
    }
    load();
  }, []);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "var(--color-background-soft)" }}
    >
      {/* 9:16 card */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "min(100vw, calc(100vh * 9 / 16))",
          height: "min(100vh, calc(100vw * 16 / 9))",
          background: "var(--color-background-soft)",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.8s ease",
        }}
      >
        {/* Outer border */}
        <div
          className="absolute pointer-events-none"
          style={{ inset: "clamp(10px, 2.5%, 16px)", border: "1px solid var(--color-accent)", opacity: 0.38 }}
        />
        {/* Inner border */}
        <div
          className="absolute pointer-events-none"
          style={{ inset: "clamp(17px, 4%, 25px)", border: "1px solid var(--color-accent)", opacity: 0.16 }}
        />

        {/* Corner ornaments */}
        {[
          { style: { top: 0, left: 0 }, rotate: 0 },
          { style: { top: 0, right: 0 }, rotate: 90 },
          { style: { bottom: 0, right: 0 }, rotate: 180 },
          { style: { bottom: 0, left: 0 }, rotate: 270 },
        ].map(({ style, rotate }, i) => (
          <svg
            key={i}
            className="absolute pointer-events-none"
            style={{ ...style, transform: `rotate(${rotate}deg)` }}
            width="34"
            height="34"
            viewBox="0 0 34 34"
            fill="none"
          >
            <path d="M3 31 L3 3 L31 3" stroke="var(--color-accent)" strokeWidth="1" strokeOpacity="0.5" />
          </svg>
        ))}

        {/* Main content — centered vertically */}
        <div
          className="absolute flex flex-col items-center justify-center"
          style={{
            inset: "clamp(34px, 9%, 56px)",
            gap: "clamp(1.2rem, 5vh, 2.8rem)",
            textAlign: "center",
          }}
        >
          {/* TOP — monogram circle */}
          <div className="flex flex-col items-center" style={{ gap: "0.5em" }}>
            <div style={{ position: "relative", width: "clamp(80px, 22vh, 140px)", height: "clamp(80px, 22vh, 140px)" }}>
              <svg viewBox="0 0 160 160" style={{ width: "100%", height: "100%" }} xmlns="http://www.w3.org/2000/svg">
                <circle cx="80" cy="80" r="72" stroke="var(--color-button)" strokeWidth="0.5" strokeOpacity="0.4" fill="none" />
                <circle cx="80" cy="80" r="68" stroke="var(--color-button)" strokeWidth="0.3" strokeOpacity="0.25" fill="none" />
                {/* top ornament */}
                <path d="M80 6 Q74 6, 68 10 Q64 13, 68 16 Q72 14, 76 11 Q78 9, 80 8 Q82 9, 84 11 Q88 14, 92 16 Q96 13, 92 10 Q86 6, 80 6Z" fill="var(--color-button)" fillOpacity="0.6" />
                {/* bottom ornament */}
                <path d="M80 154 Q74 154, 68 150 Q64 147, 68 144 Q72 146, 76 149 Q78 151, 80 152 Q82 151, 84 149 Q88 146, 92 144 Q96 147, 92 150 Q86 154, 80 154Z" fill="var(--color-button)" fillOpacity="0.6" />
              </svg>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.18em",
                }}
              >
                <span className="serif-font" style={{ fontSize: "clamp(1.8rem, 7vh, 3.5rem)", fontWeight: 300, color: "var(--color-text-heading)", letterSpacing: "0.04em", lineHeight: 1 }}>
                  {initials.mireasa}
                </span>
                <span className="script-font" style={{ fontSize: "clamp(1rem, 4vh, 2rem)", color: "var(--color-button)", opacity: 0.8, lineHeight: 1 }}>
                  &amp;
                </span>
                <span className="serif-font" style={{ fontSize: "clamp(1.8rem, 7vh, 3.5rem)", fontWeight: 300, color: "var(--color-text-heading)", letterSpacing: "0.04em", lineHeight: 1 }}>
                  {initials.mire}
                </span>
              </div>
            </div>
            <p
              style={{
                fontFamily: "var(--font-montserrat), sans-serif",
                fontWeight: 300,
                color: "var(--color-accent)",
                fontSize: "clamp(0.45rem, 1.5vh, 0.8rem)",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
              }}
            >
              cu drag vă invităm
            </p>
          </div>

          {/* DIVIDER top */}
          <Divider />

          {/* CENTER — names */}
          <div className="flex flex-col items-center" style={{ gap: "0.5em" }}>
            <p
              className="script-font"
              style={{
                color: "var(--color-text-heading)",
                fontSize: "clamp(1.8rem, 6.5vh, 3.6rem)",
                lineHeight: 1,
                whiteSpace: "nowrap",
              }}
            >
              Ade &amp; Cristi
            </p>
            <p
              className="serif-font"
              style={{
                color: "var(--color-text-heading)",
                fontSize: "clamp(0.75rem, 2.6vh, 1.4rem)",
                fontWeight: 400,
                letterSpacing: "0.28em",
                opacity: 0.9,
              }}
            >
              04 · 07 · 2026
            </p>
          </div>

          {/* DIVIDER bottom */}
          <Divider />

          {/* BOTTOM — tagline */}
          <div className="flex flex-col items-center">
            <p
              className="script-font"
              style={{
                color: "var(--color-text-muted)",
                fontSize: "clamp(1rem, 3.5vh, 1.8rem)",
                lineHeight: 1.15,
                opacity: 0.78,
              }}
            >
              să fiți alături de noi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center" style={{ gap: "clamp(6px, 2vw, 14px)" }}>
      <div style={{ width: "clamp(18px, 6vw, 36px)", height: "1px", background: "var(--color-accent)", opacity: 0.4 }} />
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <rect x="4" y="0.3" width="5.2" height="5.2" transform="rotate(45 4 4)" fill="var(--color-accent)" fillOpacity="0.45" />
      </svg>
      <div style={{ width: "clamp(18px, 6vw, 36px)", height: "1px", background: "var(--color-accent)", opacity: 0.4 }} />
    </div>
  );
}
