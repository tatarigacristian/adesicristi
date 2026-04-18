"use client";

import { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { WeddingSettings, getCoupleNames, formatDate } from "@/utils/settings";
import { getInvitationAudience, getAsteptamLine } from "@/utils/invitation-text";
import Flourish from "@/components/Ornaments/Flourish";
import ScrollIndicator from "@/components/Ornaments/ScrollIndicator";
import SectionFooterNav from "@/components/Ornaments/SectionFooterNav";
import SectionDots from "@/components/Ornaments/SectionDots";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import { useSlideActive } from "@/hooks/useSlideActive";
import { CalendarBlank, DownloadSimple, CheckCircle, SmileySad, User, Users, Car, Leaf, Baby } from "@phosphor-icons/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

type FormState = "loading" | "idle" | "submitting" | "confirmed" | "declined" | "cancelled" | "error";

interface GuestChild {
  id: number;
  nume: string;
  prenume: string;
}

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
  sex: "M" | "F" | null;
  partner: { nume: string; prenume: string } | null;
  children?: GuestChild[];
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
        <CalendarBlank size={14} weight="duotone" />
        Adaugă în calendar
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 bg-background-soft rounded-xl shadow-lg border border-border-light p-2 min-w-[200px]">
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
              <DownloadSimple size={16} weight="duotone" />
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
  const [childrenMenu, setChildrenMenu] = useState(false);
  const showContent = useSlideActive("rsvp");
  const [formState, setFormState] = useState<FormState>(guest ? "loading" : "idle");
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeErrors, setShakeErrors] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [step, setStep] = useState(1);
  const [slideDir, setSlideDir] = useState<"left" | "right">("left");
  const [animating, setAnimating] = useState(false);

  const triggerErrors = (e: Record<string, string>) => {
    setErrors(e);
    setShakeErrors(true);
    setTimeout(() => setShakeErrors(false), 600);
  };

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

  const hasChildren = Boolean(guest?.children && guest.children.length > 0);

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
    if (guest.children && guest.children.length > 0) {
      setChildrenMenu(true);
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

    if (Object.keys(newErrors).length) {
      triggerErrors(newErrors);
      return false;
    }
    setErrors({});
    return true;
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
          children_menu: childrenMenu,
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

  const confirmareDeadline = settings?.confirmare_pana_la ? formatDate(settings.confirmare_pana_la) : null;

  // Loading state
  if (formState === "loading") {
    return (
      <section id="rsvp" className="content-section bg-background">
        <div className="section-header">
          <h2 className="serif-font text-4xl md:text-4xl font-bold text-text-heading uppercase mb-2">Confirmare</h2>
          <SectionDots />
          <SmallFlourish className="hidden sm:block mx-auto my-2" />
          <p className="body-font text-[0.7rem] sm:text-[0.85rem] tracking-[0.2em] uppercase text-text-muted">
            Prezența ta contează
          </p>
          {confirmareDeadline && (
            <p className="body-font text-[0.6rem] sm:text-[0.7rem] text-text-muted mt-1.5">
              Vă rugăm să ne confirmați prezența până la data de {confirmareDeadline}
            </p>
          )}
        </div>
        <div className={`section-content transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
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
          <h2 className="serif-font text-4xl md:text-4xl font-bold text-text-heading uppercase mb-2">
            Confirmare
          </h2>
          <SectionDots />
          <SmallFlourish className="hidden sm:block mx-auto my-2" />
          <p className="body-font text-[0.7rem] sm:text-[0.85rem] tracking-[0.2em] uppercase text-text-muted">
            Prezența ta contează
          </p>
          {confirmareDeadline && (
            <p className="body-font text-[0.6rem] sm:text-[0.7rem] text-text-muted mt-1.5">
              Vă rugăm să ne confirmați prezența până la data de {confirmareDeadline}
            </p>
          )}
        </div>

        <div className={`section-content max-w-md px-6 transition-all duration-700 ease-out ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <div className="w-full flex flex-col items-center text-center animate-fade-in-up">
            {/* Icon */}
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${isPositive ? "bg-button/10" : "bg-text-muted/10"}`}>
              {isPositive ? (
                <CheckCircle size={28} weight="duotone" className="text-button" />
              ) : (
                <SmileySad size={28} weight="duotone" className="text-text-muted" />
              )}
            </div>

            {/* Title */}
            <p className="body-font text-xs text-text-muted tracking-[0.2em] uppercase mb-2">
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
            <p className="text-sm text-text-muted leading-relaxed mb-5 max-w-[260px]">
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
        <h2 className="serif-font text-4xl md:text-4xl font-bold text-text-heading uppercase mb-2">
          Confirmare
        </h2>
        <SectionDots />
        <SmallFlourish className="hidden sm:block mx-auto my-2" />
        <p className="body-font text-sm sm:text-[0.85rem] tracking-[0.2em] uppercase text-text-muted">
          Prezența ta contează
        </p>
        {confirmareDeadline && (
          <p className="body-font text-[0.65rem] sm:text-[0.7rem] text-text-muted mt-1.5">
            Vă rugăm să ne confirmați prezența până la data de {confirmareDeadline}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="section-content max-w-md sm:max-w-lg px-6" style={{ opacity: showContent ? 1 : 0, transform: showContent ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.7s ease-out, transform 0.7s ease-out" }}>
        <form onSubmit={(e: FormEvent) => e.preventDefault()} className="w-full">

          {/* ── Step dots ── */}
          <div className="flex justify-center gap-2 mb-6">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={`h-1 rounded-full transition-all duration-300 ${
                  s === step ? "w-5 bg-button" : "w-1.5 bg-button/20"
                }`}
              />
            ))}
          </div>

          {/* ── Step container ── */}
          <div className="relative" style={{ minHeight: "160px" }}>

            {/* ═══ STEP 1: Câte persoane ═══ */}
            <div className={`
              transition-all duration-300 ease-out flex flex-col items-center justify-center ${stepClass(1)}`}>
              <p className="body-font text-xs sm:text-[0.75rem] text-text-muted tracking-[0.2em] uppercase mb-4">
                Câte persoane participă?
              </p>
              <div className="flex gap-3 w-full max-w-xs sm:max-w-sm">
                <button
                  type="button"
                  onClick={() => {
                    setPersonCount(1);
                    setErrors((prev) => ({ ...prev, personCount: "" }));
                    goToStep(2);
                  }}
                  className={`flex-1 py-4 sm:py-5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 sm:gap-3
                    ${personCount === 1 ? "border-button bg-button/5" : "border-border-light bg-background-soft hover:border-button/40"}`}
                >
                  <User size={20} weight="duotone" className="text-button sm:hidden" />
                  <User size={26} weight="duotone" className="text-button hidden sm:block" />
                  <span className="body-font text-sm sm:text-sm font-medium text-text-heading">O persoană</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPersonCount(2);
                    setErrors((prev) => ({ ...prev, personCount: "" }));
                    goToStep(2);
                  }}
                  className={`flex-1 py-4 sm:py-5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col items-center gap-2 sm:gap-3
                    ${personCount === 2 ? "border-button bg-button/5" : "border-border-light bg-background-soft hover:border-button/40"}`}
                >
                  <Users size={24} weight="duotone" className="text-button sm:hidden" />
                  <Users size={30} weight="duotone" className="text-button hidden sm:block" />
                  <span className="body-font text-sm sm:text-sm font-medium text-text-heading">Două persoane</span>
                </button>
              </div>
              {errors.personCount && (
                <p className="text-[0.6rem] text-button mt-2">{errors.personCount}</p>
              )}
            </div>

            {/* ═══ STEP 2: Nume ═══ */}
            <div className={`
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(2)}`}>
              <p className="body-font text-xs sm:text-[0.75rem] text-text-muted tracking-[0.2em] uppercase mb-1">
                {personCount === 2 ? "Numele vostru" : "Numele tău"}
              </p>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((prev) => ({ ...prev, name: "" })); }}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                placeholder={errors.name || "Numele tău"}
                enterKeyHint="next"
                className={`w-full max-w-xs sm:max-w-sm border rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-background-soft text-center
                           focus:outline-none focus:border-button transition-colors disabled:opacity-50
                           ${errors.name ? "border-button placeholder:text-button" : "border-border-light"}
                           ${errors.name && shakeErrors ? "animate-shake" : ""}`}
              />

              {personCount === 2 && (
                <>
                  <input
                    ref={partnerRef}
                    type="text"
                    value={partnerName}
                    onChange={(e) => { setPartnerName(e.target.value); setErrors((prev) => ({ ...prev, partnerName: "" })); }}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled}
                    placeholder={errors.partnerName || "Numele partenerului"}
                    enterKeyHint="next"
                    className={`w-full max-w-xs sm:max-w-sm border rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-background-soft text-center
                               focus:outline-none focus:border-button transition-colors disabled:opacity-50
                               ${errors.partnerName ? "border-button placeholder:text-button" : "border-border-light"}
                               ${errors.partnerName && shakeErrors ? "animate-shake" : ""}`}
                  />
                </>
              )}

              <div className="flex gap-3 w-full max-w-xs sm:max-w-sm mt-2">
                <button type="button" onClick={() => goToStep(1)}
                  className="flex-1 border border-button py-2 sm:py-2.5 rounded-xl text-sm sm:text-sm text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => {
                  const e: Record<string, string> = {};
                  if (!name.trim()) e.name = "Introdu numele";
                  if (personCount === 2 && !partnerName.trim()) e.partnerName = "Introdu numele partenerului";
                  if (Object.keys(e).length) { triggerErrors(e); return; }
                  goToStep(3);
                }}
                  className="flex-1 bg-button text-white py-2 sm:py-2.5 rounded-xl text-sm sm:text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
                  Continuă
                </button>
              </div>
            </div>

            {/* ═══ STEP 3: Preferințe ═══ */}
            <div className={`
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(3)}`}>
              <p className="body-font text-xs sm:text-[0.75rem] text-text-muted tracking-[0.2em] uppercase mb-1">
                Preferințe
              </p>

              {/* Transport */}
              <button type="button" onClick={() => setNeedsTransport(!needsTransport)} disabled={isDisabled}
                className={`w-full max-w-xs sm:max-w-sm flex items-center justify-between py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${needsTransport ? "border-button bg-button/5" : "border-border-light bg-background-soft"}`}>
                <div className="flex items-center gap-2.5">
                  <Car size={18} weight="duotone" className="text-button sm:hidden" />
                  <Car size={22} weight="duotone" className="text-button hidden sm:block" />
                  <span className="body-font text-sm sm:text-sm text-text-heading">Transport</span>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                  ${needsTransport ? "bg-button" : "bg-text-muted/20"}`}>
                  <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200
                    ${needsTransport ? "translate-x-[18px] bg-white" : "translate-x-0 bg-white/80"}`} />
                </div>
              </button>

              {/* Vegetarian */}
              <button type="button" onClick={() => setVegetarianMenu(!vegetarianMenu)} disabled={isDisabled}
                className={`w-full max-w-xs sm:max-w-sm flex items-center justify-between py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                  ${vegetarianMenu ? "border-button bg-button/5" : "border-border-light bg-background-soft"}`}>
                <div className="flex items-center gap-2.5">
                  <Leaf size={18} weight="duotone" className="text-button sm:hidden" />
                  <Leaf size={22} weight="duotone" className="text-button hidden sm:block" />
                  <span className="body-font text-sm sm:text-sm text-text-heading">Meniu vegetarian</span>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                  ${vegetarianMenu ? "bg-button" : "bg-text-muted/20"}`}>
                  <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200
                    ${vegetarianMenu ? "translate-x-[18px] bg-white" : "translate-x-0 bg-white/80"}`} />
                </div>
              </button>

              {/* Children menu - shown when guest has children */}
              {hasChildren && (
                <button type="button" onClick={() => setChildrenMenu(!childrenMenu)} disabled={isDisabled}
                  className={`w-full max-w-xs sm:max-w-sm flex items-center justify-between py-3 sm:py-3.5 px-4 sm:px-5 rounded-xl border-2 transition-all duration-200 cursor-pointer
                    ${childrenMenu ? "border-button bg-button/5" : "border-border-light bg-background-soft"}`}>
                  <div className="flex items-center gap-2.5">
                    <Baby size={18} weight="duotone" className="text-button sm:hidden" />
                    <Baby size={22} weight="duotone" className="text-button hidden sm:block" />
                    <div className="flex flex-col items-start">
                      <span className="body-font text-sm sm:text-sm text-text-heading">Meniu copil</span>
                      <span className="text-[0.6rem] text-text-muted">
                        {guest!.children!.map((c) => c.prenume).join(", ")}
                      </span>
                    </div>
                  </div>
                  <div className={`relative w-10 h-5 rounded-full transition-colors duration-200
                    ${childrenMenu ? "bg-button" : "bg-text-muted/20"}`}>
                    <span className={`absolute top-[3px] left-[3px] w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200
                      ${childrenMenu ? "translate-x-[18px] bg-white" : "translate-x-0 bg-white/80"}`} />
                  </div>
                </button>
              )}

              <div className="flex gap-3 w-full max-w-xs sm:max-w-sm mt-2">
                <button type="button" onClick={() => goToStep(2)}
                  className="flex-1 border border-button py-2 sm:py-2.5 rounded-xl text-sm sm:text-sm text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => goToStep(4)}
                  className="flex-1 bg-button text-white py-2 sm:py-2.5 rounded-xl text-sm sm:text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer">
                  Continuă
                </button>
              </div>
            </div>

            {/* ═══ STEP 4: Mesaj + Confirmare ═══ */}
            <div className={`
              transition-all duration-300 ease-out flex flex-col items-center justify-center gap-3 ${stepClass(4)}`}>
              <p className="body-font text-xs sm:text-[0.75rem] text-text-muted tracking-[0.2em] uppercase mb-1">
                Un mesaj pentru noi?
              </p>
              <textarea
                ref={messageRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isDisabled}
                rows={2}
                placeholder="Opțional"
                className="w-full max-w-xs sm:max-w-sm border border-border-light rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base bg-background-soft text-center
                           focus:outline-none focus:border-button transition-colors resize-none disabled:opacity-50"
              />

              {formState === "error" && (
                <p className="text-[0.6rem] text-button">A apărut o eroare. Încearcă din nou.</p>
              )}

              <div className="flex gap-3 w-full max-w-xs sm:max-w-sm pt-1">
                <button type="button" onClick={() => goToStep(3)}
                  className="flex-1 border border-button py-2 sm:py-2.5 rounded-xl text-sm sm:text-sm text-text-muted hover:bg-background-soft transition-colors cursor-pointer">
                  Înapoi
                </button>
                <button type="button" onClick={() => handleSubmit(false)} disabled={isDisabled}
                  className="flex-1 border border-button py-2 rounded-xl text-xs text-text-muted hover:bg-background-soft transition-colors disabled:opacity-50 cursor-pointer">
                  Nu pot
                </button>
              </div>
              <button type="button" onClick={() => handleSubmit(true)} disabled={isDisabled}
                className="w-full max-w-xs sm:max-w-sm bg-button text-white py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-medium
                           hover:bg-button-hover transition-colors disabled:opacity-50 cursor-pointer">
                {formState === "submitting" ? "Se trimite..." : "Da, confirm prezența"}
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
