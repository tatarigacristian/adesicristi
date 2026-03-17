"use client";

import { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";
import { getInvitationAudience, getAsteptamLine } from "@/utils/invitation-text";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import Flourish from "@/components/Ornaments/Flourish";
import ScrollIndicator from "@/components/Ornaments/ScrollIndicator";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

type FormState = "loading" | "idle" | "submitting" | "confirmed" | "declined" | "cancelled" | "error";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  sex: "M" | "F" | null;
  partner: { nume: string; prenume: string } | null;
}

function formatICSDate(dateStr: string, timeStr: string): string {
  // dateStr: "2026-07-03T21:00:00.000Z" or "2026-07-04", timeStr: "15:00"
  const datePart = dateStr.split("T")[0].replace(/-/g, "");
  const timePart = timeStr.replace(":", "") + "00";
  return `${datePart}T${timePart}`;
}

function buildGoogleCalendarUrl(settings: WeddingSettings, couple: { display: string }): string {
  const firstDate = settings.ceremonie_data?.split("T")[0].replace(/-/g, "") || "20260704";
  const firstTime = (settings.ceremonie_ora || "15:00").replace(":", "") + "00";
  // End: petrecere time + 5h or midnight
  const lastTime = "235900";

  const title = `Nunta ${couple.display}`;
  const location = settings.petrecere_adresa || settings.ceremonie_adresa || "";
  const details = [
    settings.ceremonie_descriere ? `${settings.ceremonie_descriere}: ${settings.ceremonie_ora || ""}` : "",
    settings.transport_descriere ? `${settings.transport_descriere}: ${settings.transport_ora || ""}` : "",
    settings.petrecere_descriere ? `${settings.petrecere_descriere}: ${settings.petrecere_ora || ""}` : "",
  ].filter(Boolean).join("\\n");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${firstDate}T${firstTime}/${firstDate}T${lastTime}`,
    details,
    location,
  });
  return `https://www.google.com/calendar/render?${params.toString()}`;
}

function buildICSContent(settings: WeddingSettings, couple: { display: string }): string {
  const firstDate = settings.ceremonie_data ? formatICSDate(settings.ceremonie_data, settings.ceremonie_ora || "15:00") : "20260704T150000";
  const endDate = settings.petrecere_data ? formatICSDate(settings.petrecere_data, "23:59") : "20260704T235900";

  const title = `Nunta ${couple.display}`;
  const location = settings.petrecere_adresa || settings.ceremonie_adresa || "";
  const description = [
    settings.ceremonie_descriere ? `${settings.ceremonie_descriere}: ${settings.ceremonie_ora || ""}` : "",
    settings.transport_descriere ? `${settings.transport_descriere}: ${settings.transport_ora || ""}` : "",
    settings.petrecere_descriere ? `${settings.petrecere_descriere}: ${settings.petrecere_ora || ""}` : "",
  ].filter(Boolean).join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AdesiCristi//Wedding//RO",
    "BEGIN:VEVENT",
    `DTSTART:${firstDate}`,
    `DTEND:${endDate}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function AddToCalendar({ settings }: { settings: WeddingSettings }) {
  const [open, setOpen] = useState(false);
  const couple = getCoupleNames(settings);

  const handleICS = useCallback(() => {
    const ics = buildICSContent(settings, couple);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nunta-${couple.display.toLowerCase().replace(/\s+/g, "-")}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  }, [settings, couple]);

  const googleUrl = buildGoogleCalendarUrl(settings, couple);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="btn-glass text-xs cursor-pointer inline-flex items-center gap-1.5"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        Adaugă în calendar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-white rounded-xl shadow-lg border border-border-light p-2 min-w-[200px]">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-heading hover:bg-background-soft transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="19" rx="3" fill="#4285F4"/>
                <rect x="5" y="10" width="4" height="4" rx="0.5" fill="#fff"/>
                <rect x="10" y="10" width="4" height="4" rx="0.5" fill="#fff"/>
                <rect x="15" y="10" width="4" height="4" rx="0.5" fill="#fff"/>
                <rect x="5" y="15" width="4" height="4" rx="0.5" fill="#fff"/>
                <rect x="10" y="15" width="4" height="4" rx="0.5" fill="#fff"/>
              </svg>
              Google Calendar
            </a>
            <button
              onClick={handleICS}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-text-heading hover:bg-background-soft transition-colors cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Apple / Outlook (.ics)
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function RSVP({ guest, settings }: { guest?: GuestData | null; settings?: WeddingSettings | null }) {
  const couple = getCoupleNames(settings ?? null);
  const audience = guest ? getInvitationAudience(Boolean(guest.plus_one && guest.partner), guest.sex ?? null) : null;
  const [personCount, setPersonCount] = useState(0);
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [message, setMessage] = useState("");
  const [needsTransport, setNeedsTransport] = useState(false);
  const [vegetarianMenu, setVegetarianMenu] = useState(false);
  const [formState, setFormState] = useState<FormState>(guest ? "loading" : "idle");
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cancelling, setCancelling] = useState(false);
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [animating, setAnimating] = useState(false);

  const goToStep = (target: number) => {
    if (animating) return;
    setSlideDir(target > step ? "left" : "right");
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setTimeout(() => setAnimating(false), 250);
    }, 150);
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const partnerRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const initialCheckDone = useRef(false);

  // Auto-fill from guest data
  useEffect(() => {
    if (!guest) return;
    setName(`${guest.prenume} ${guest.nume}`);
    if (guest.plus_one && guest.partner) {
      setPersonCount(2);
      setPartnerName(`${guest.partner.prenume} ${guest.partner.nume}`);
    } else {
      setPersonCount(1);
    }
  }, [guest]);

  // Check existing RSVP for this guest (only once on mount)
  useEffect(() => {
    if (!guest || initialCheckDone.current) return;
    initialCheckDone.current = true;
    async function checkExistingRsvp() {
      try {
        const res = await fetch(`${API_URL}/api/rsvp/guest/${guest!.id}`);
        if (res.ok) {
          const data = await res.json();
          setRsvpId(data.id);
          if (data.attending) {
            setFormState("confirmed");
          } else {
            setFormState("declined");
          }
        } else {
          setFormState("idle");
        }
      } catch {
        setFormState("idle");
      }
    }
    checkExistingRsvp();
  }, [guest]);

  function validate(attending: boolean): boolean {
    const newErrors: Record<string, string> = {};

    if (attending) {
      if (personCount === 0) {
        newErrors.personCount = "Te rog să alegi numărul de persoane";
      }
      if (!name.trim()) {
        newErrors.name = "Te rog să introduci numele";
      }
      if (personCount === 2 && !partnerName.trim()) {
        newErrors.partnerName = "Te rog să introduci numele partenerului";
      }
    } else {
      if (!name.trim()) {
        newErrors.name = "Te rog să introduci numele";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(attending: boolean) {
    if (!validate(attending)) return;

    setFormState("submitting");
    try {
      const res = await fetch(`${API_URL}/api/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_count: attending ? personCount || 1 : 1,
          name: name.trim(),
          partner_name: personCount === 2 ? partnerName.trim() : undefined,
          message: message.trim() || undefined,
          attending,
          guest_id: guest?.id || undefined,
          needs_transport: needsTransport,
          vegetarian_menu: vegetarianMenu,
        }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setRsvpId(data.id);
      setFormState(attending ? "confirmed" : "declined");
    } catch {
      setFormState("error");
    }
  }

  async function handleCancel() {
    if (!rsvpId) return;
    setCancelling(true);
    try {
      const res = await fetch(`${API_URL}/api/rsvp/${rsvpId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attending: false }),
      });
      if (!res.ok) throw new Error("Server error");
      setFormState("cancelled");
    } catch {
      // silently fail
    } finally {
      setCancelling(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement | HTMLSelectElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const fields = [nameRef.current, partnerRef.current, messageRef.current].filter(
        (f): f is NonNullable<typeof f> => f !== null && f.offsetParent !== null
      );
      const idx = fields.indexOf(e.currentTarget as HTMLInputElement);
      if (idx >= 0 && idx < fields.length - 1) {
        fields[idx + 1].focus();
      }
    }
  }

  const isDisabled = formState === "submitting";
  const isResult = formState === "confirmed" || formState === "declined" || formState === "cancelled";
  const isPositive = formState === "confirmed";
  const isPlural = personCount === 2;

  // Loading state
  if (formState === "loading") {
    return (
      <section id="rsvp" className="content-section bg-background">
        <div className="section-header">
          <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">Confirmare</h2>
          <SmallFlourish className="mx-auto" />
        </div>
        <div className="section-content">
          <p className="text-sm text-text-muted">Se încarcă...</p>
        </div>
        <SectionFooterNav settings={settings} />
      </section>
    );
  }

  // Result states (confirmed / declined / cancelled) — with fade-in animation
  if (isResult) {
    return (
      <section id="rsvp" className="content-section bg-background">
        <div className="section-header">
          <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
            Confirmare
          </h2>
          <SmallFlourish className="mx-auto" />
        </div>

        <div className="section-content max-w-md px-6">
          <div className="w-full flex flex-col items-center text-center animate-fade-in-up">
            {/* Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isPositive ? "bg-button/10" : "bg-text-muted/10"}`}>
              {isPositive ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-text-muted">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 15s1.5-2 4-2 4 2 4 2" />
                  <line x1="9" y1="9" x2="9.01" y2="9" />
                  <line x1="15" y1="9" x2="15.01" y2="9" />
                </svg>
              )}
            </div>

            {/* Title */}
            <p className="text-[0.55rem] text-text-muted tracking-[0.2em] uppercase mb-2">
              {isPositive
                ? (isPlural ? "Mulțumim pentru confirmare" : "Mulțumim pentru confirmare")
                : formState === "declined"
                  ? (isPlural ? "Am primit răspunsul vostru" : "Am primit răspunsul tău")
                  : "Prezența anulată"}
            </p>
            <p className="script-font text-3xl text-text-heading mb-3">
              {isPositive ? couple.display : "Ne pare rău"}
            </p>

            {/* Message */}
            <p className="text-xs text-text-muted leading-relaxed mb-5 max-w-[260px]">
              {isPositive
                ? (isPlural ? "Abia așteptăm să fiți alături de noi!" : "Abia așteptăm să fii alături de noi!")
                : (isPlural ? "Regretăm că nu veți putea fi alături de noi." : "Regretăm că nu vei putea fi alături de noi.")}
            </p>

            {/* Actions */}
            {isPositive ? (
              <div className="flex flex-col items-center gap-3">
                {settings && <AddToCalendar settings={settings} />}
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="text-[0.6rem] text-text-muted hover:text-button transition-colors cursor-pointer disabled:opacity-50"
                >
                  {cancelling ? "Se anulează..." : (isPlural ? "Anulați prezența" : "Anulează prezența")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setFormState("idle"); setStep(1); }}
                className="bg-button text-white py-2.5 px-8 rounded-xl text-xs font-medium hover:bg-button-hover transition-colors cursor-pointer"
              >
                {isPlural ? "Confirmați prezența" : "Confirmă prezența"}
              </button>
            )}
          </div>
        </div>

        <SectionFooterNav settings={settings} />
      </section>
    );
  }

  const TOTAL_STEPS = 4;

  /* helper: step animation classes (mobile only) */
  function stepClass(s: number) {
    if (step === s && !animating) return "opacity-100 translate-x-0";
    if (step === s && animating) return slideDir === "left" ? "opacity-0 -translate-x-6" : "opacity-0 translate-x-6";
    return "opacity-0 pointer-events-none absolute inset-0";
  }

  return (
    <section
      id="rsvp"
      className="content-section bg-background"
    >
      {/* Header */}
      <div className="section-header">
        <h2 className="serif-font text-2xl md:text-3xl font-bold text-text-heading mb-2">
          Confirmare
        </h2>
        <SmallFlourish className="mx-auto mb-2 sm:mb-3" />
        <p className="text-xs text-text-muted leading-snug">
          {audience ? getAsteptamLine(audience) : "Vă așteptăm cu drag!"}
        </p>
      </div>

      {/* Content */}
      <div className="section-content max-w-md px-6">
        <form onSubmit={(e: FormEvent) => e.preventDefault()} className="w-full">

          {/* ── Step dots (mobile only) ── */}
          <div className="flex justify-center gap-2 mb-6 sm:hidden">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step ? "w-5 bg-button" : "w-1.5 bg-button/20"
                }`}
              />
            ))}
          </div>

          {/* ── Step container (mobile: relative with fixed height; desktop: normal flow) ── */}
          <div className="relative sm:space-y-5" style={{ minHeight: "160px" }}>

            {/* ═══ STEP 1: Câte persoane ═══ */}
            <div className={`sm:!opacity-100 sm:!translate-x-0 sm:!pointer-events-auto sm:!relative sm:!inset-auto
              transition-all duration-300 ease-out flex flex-col items-center justify-center ${stepClass(1)}`}>
              <p className="text-[0.55rem] text-text-muted tracking-[0.2em] uppercase mb-4">
                Câte persoane participă?
              </p>
              <div className="flex gap-3 w-full max-w-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPersonCount(1);
                    setErrors((prev) => ({ ...prev, personCount: "" }));
                    goToStep(2);
                  }}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2
                    ${personCount === 1 ? "border-button bg-button/5" : "border-border-light bg-white hover:border-button/40"}`}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span className="text-xs font-medium text-text-heading">O persoană</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonCount(2);
                    setErrors((prev) => ({ ...prev, personCount: "" }));
                    goToStep(2);
                  }}
                  className={`flex-1 py-4 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2
                    ${personCount === 2 ? "border-button bg-button/5" : "border-border-light bg-white hover:border-button/40"}`}
                >
                  <svg width="24" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="text-xs font-medium text-text-heading">Două persoane</span>
                </button>
              </div>
              {errors.personCount && (
                <p className="text-[0.6rem] text-button mt-2">{errors.personCount}</p>
              )}
            </div>

            {/* ═══ STEP 2: Nume ═══ */}
            <div className={`sm:!opacity-100 sm:!translate-x-0 sm:!pointer-events-auto sm:!relative sm:!inset-auto
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(2)}`}>
              <p className="text-[0.55rem] text-text-muted tracking-[0.2em] uppercase mb-1 sm:hidden">
                {personCount === 2 ? "Numele vostru" : "Numele tău"}
              </p>

              {/* Desktop: side by side labels visible */}
              <div className="hidden sm:block text-center">
                <label className="block text-[0.55rem] text-text-muted mb-1 tracking-[0.15em] uppercase">Numele tău</label>
              </div>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                placeholder="Numele tău"
                enterKeyHint="next"
                className="w-full max-w-xs border border-border-light rounded-xl px-4 py-2.5 text-sm bg-white text-center
                           focus:outline-none focus:border-button transition-colors disabled:opacity-50"
              />
              {errors.name && <p className="text-[0.6rem] text-button">{errors.name}</p>}

              {personCount === 2 && (
                <>
                  <div className="hidden sm:block text-center">
                    <label className="block text-[0.55rem] text-text-muted mb-1 tracking-[0.15em] uppercase">Nume partener</label>
                  </div>
                  <input
                    ref={partnerRef}
                    type="text"
                    value={partnerName}
                    onChange={(e) => { setPartnerName(e.target.value); setErrors((prev) => ({ ...prev, partnerName: "" })); }}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled}
                    placeholder="Numele partenerului"
                    enterKeyHint="next"
                    className="w-full max-w-xs border border-border-light rounded-xl px-4 py-2.5 text-sm bg-white text-center
                               focus:outline-none focus:border-button transition-colors disabled:opacity-50"
                  />
                  {errors.partnerName && <p className="text-[0.6rem] text-button">{errors.partnerName}</p>}
                </>
              )}

              {/* Mobile nav */}
              <div className="flex gap-3 w-full max-w-xs mt-2 sm:hidden">
                <button type="button" onClick={() => goToStep(1)}
                  className="flex-1 border border-button py-2 rounded-xl text-xs text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => {
                  const e: Record<string, string> = {};
                  if (!name.trim()) e.name = "Introdu numele";
                  if (personCount === 2 && !partnerName.trim()) e.partnerName = "Introdu numele partenerului";
                  setErrors(e);
                  if (!Object.keys(e).length) goToStep(3);
                }}
                  className="flex-1 bg-button text-white py-2 rounded-xl text-xs font-medium hover:bg-button-hover transition-colors cursor-pointer">
                  Continuă
                </button>
              </div>
            </div>

            {/* ═══ STEP 3: Preferințe ═══ */}
            <div className={`sm:!opacity-100 sm:!translate-x-0 sm:!pointer-events-auto sm:!relative sm:!inset-auto
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(3)}`}>
              <p className="text-[0.55rem] text-text-muted tracking-[0.2em] uppercase mb-1 sm:hidden">
                Preferințe
              </p>

              {/* Transport */}
              <button type="button" onClick={() => setNeedsTransport(!needsTransport)} disabled={isDisabled}
                className={`w-full max-w-xs flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${needsTransport ? "border-button bg-button/5" : "border-border-light bg-white"}`}>
                <div className="flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
                    <path d="M3 7 Q3 5, 5 5 L19 5 Q21 5, 21 7 L21 15 Q21 17, 19 17 L5 17 Q3 17, 3 15Z" />
                    <circle cx="7" cy="19" r="1.5" /><circle cx="17" cy="19" r="1.5" />
                  </svg>
                  <span className="text-xs text-text-heading">Transport</span>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                  ${needsTransport ? "bg-button" : "bg-text-muted/20"}`}>
                  <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200
                    ${needsTransport ? "translate-x-[18px] bg-white" : "translate-x-0 bg-white/80"}`} />
                </div>
              </button>

              {/* Vegetarian */}
              <button type="button" onClick={() => setVegetarianMenu(!vegetarianMenu)} disabled={isDisabled}
                className={`w-full max-w-xs flex items-center justify-between py-3 px-4 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${vegetarianMenu ? "border-button bg-button/5" : "border-border-light bg-white"}`}>
                <div className="flex items-center gap-2.5">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-button">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10" />
                    <path d="M15 3c-1 4-4 7-8 8" />
                    <path d="M22 2c-4 1-7 4-8 8" />
                  </svg>
                  <span className="text-xs text-text-heading">Meniu vegetarian</span>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                  ${vegetarianMenu ? "bg-button" : "bg-text-muted/20"}`}>
                  <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200
                    ${vegetarianMenu ? "translate-x-[18px] bg-white" : "translate-x-0 bg-white/80"}`} />
                </div>
              </button>

              {/* Mobile nav */}
              <div className="flex gap-3 w-full max-w-xs mt-2 sm:hidden">
                <button type="button" onClick={() => goToStep(2)}
                  className="flex-1 border border-button py-2 rounded-xl text-xs text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => goToStep(4)}
                  className="flex-1 bg-button text-white py-2 rounded-xl text-xs font-medium hover:bg-button-hover transition-colors cursor-pointer">
                  Continuă
                </button>
              </div>
            </div>

            {/* ═══ STEP 4: Mesaj + Confirmare ═══ */}
            <div className={`sm:!opacity-100 sm:!translate-x-0 sm:!pointer-events-auto sm:!relative sm:!inset-auto
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(4)}`}>
              <p className="text-[0.55rem] text-text-muted tracking-[0.2em] uppercase mb-1 sm:hidden">
                Un mesaj pentru noi?
              </p>
              <div className="hidden sm:block text-center">
                <label className="block text-[0.55rem] text-text-muted mb-1 tracking-[0.15em] uppercase">Vrei să ne transmiți ceva?</label>
              </div>
              <textarea
                ref={messageRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isDisabled}
                rows={2}
                placeholder="Opțional"
                className="w-full max-w-xs border border-border-light rounded-xl px-4 py-2.5 text-sm bg-white text-center
                           focus:outline-none focus:border-button transition-colors resize-none disabled:opacity-50"
              />

              {formState === "error" && (
                <p className="text-[0.6rem] text-button">A apărut o eroare. Încearcă din nou.</p>
              )}

              <div className="flex gap-3 w-full max-w-xs sm:max-w-none pt-1 sm:hidden">
                <button type="button" onClick={() => goToStep(3)}
                  className="flex-1 border border-button py-2 rounded-xl text-xs text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => handleSubmit(false)} disabled={isDisabled}
                  className="flex-1 border border-button py-2 rounded-xl text-xs text-text-muted hover:bg-background-soft transition-colors disabled:opacity-50 cursor-pointer">
                  Nu pot
                </button>
              </div>
              <button type="button" onClick={() => handleSubmit(true)} disabled={isDisabled}
                className="w-full max-w-xs sm:max-w-none bg-button text-white py-2.5 rounded-xl text-xs sm:text-sm font-medium
                           hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
                {formState === "submitting" ? "Se trimite..." : "Da, confirm prezența"}
              </button>
              {/* Desktop: decline button */}
              <button type="button" onClick={() => handleSubmit(false)} disabled={isDisabled}
                className="hidden sm:block w-full border border-button py-2.5 rounded-xl text-sm
                           text-text-muted hover:bg-background-soft transition-colors disabled:opacity-50 cursor-pointer">
                Nu pot să particip
              </button>
            </div>

          </div>
        </form>
      </div>

      {/* Footer */}
      <SectionFooterNav settings={settings} />
    </section>
  );
}
