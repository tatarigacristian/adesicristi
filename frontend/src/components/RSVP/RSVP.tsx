"use client";

import { useState, useEffect, useRef, useCallback, FormEvent, KeyboardEvent } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { WeddingSettings, getCoupleNames } from "@/utils/settings";
import SmallFlourish from "@/components/Ornaments/SmallFlourish";
import Flourish from "@/components/Ornaments/Flourish";
import SectionCorners from "@/components/Ornaments/SectionCorners";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

type FormState = "loading" | "idle" | "submitting" | "confirmed" | "declined" | "cancelled" | "error";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro_short: string | null;
  intro_long: string | null;
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
  const sectionRef = useScrollAnimation<HTMLElement>();
  const couple = getCoupleNames(settings ?? null);
  const [personCount, setPersonCount] = useState(0);
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>(guest ? "loading" : "idle");
  const [rsvpId, setRsvpId] = useState<number | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cancelling, setCancelling] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const partnerRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const initialCheckDone = useRef(false);
  const [skipAnimation, setSkipAnimation] = useState(false);

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

  // Loading state
  if (formState === "loading") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background !items-center">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="relative glass-card py-12">
            <SectionCorners size="w-[25px] h-[25px]" offset={10} />
            <p className="text-sm text-text-muted">Se încarcă...</p>
          </div>
        </div>
      </section>
    );
  }

  // Confirmed state — show confirmation + cancel option
  if (formState === "confirmed") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background !items-center">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="relative glass-card py-12">
            <SectionCorners size="w-[25px] h-[25px]" offset={10} />
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Mulțumim pentru confirmare!
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">{couple.display}</p>
            <p className="text-sm text-foreground mb-6">
              Vă mulțumim din suflet că ați confirmat prezența.
              <br />
              Abia așteptăm să fiți alături de noi!
            </p>
            {settings && (
              <div className="mb-6">
                <AddToCalendar settings={settings} />
              </div>
            )}
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-text-muted hover:text-button transition-colors cursor-pointer underline underline-offset-2 disabled:opacity-50"
            >
              {cancelling ? "Se anulează..." : "Anulează prezența"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Cancelled state
  if (formState === "cancelled") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background !items-center">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="relative glass-card py-12">
            <SectionCorners size="w-[25px] h-[25px]" offset={10} />
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Prezența anulată
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ne pare rău</p>
            <p className="text-sm text-foreground mb-6">
              Regretăm că nu veți putea fi alături de noi.
            </p>
            <button
              onClick={() => { setSkipAnimation(true); setFormState("idle"); }}
              className="bg-button text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer"
            >
              Confirmă prezența
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Declined state (submitted "Nu pot sa particip")
  if (formState === "declined") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background !items-center">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="relative glass-card py-12">
            <SectionCorners size="w-[25px] h-[25px]" offset={10} />
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Am primit răspunsul tău
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ne pare rău</p>
            <p className="text-sm text-foreground mb-6">
              Regretăm că nu veți putea fi alături de noi.
            </p>
            <button
              onClick={() => { setSkipAnimation(true); setFormState("idle"); }}
              className="bg-button text-white py-2.5 px-6 rounded-lg text-sm font-medium hover:bg-button-hover transition-colors cursor-pointer"
            >
              Confirmă prezența
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="rsvp"
      ref={sectionRef}
      className={`snap-section content-section bg-background${skipAnimation ? "" : " animate-on-scroll"}`}
    >
      <div className="max-w-lg mx-auto w-full">
        <div className="relative glass-card">
          <SectionCorners size="w-[25px] h-[25px]" offset={10} />
          <div className="text-center mb-6">
            <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
              Confirmare
            </h2>
            <SmallFlourish className="mx-auto mb-3" />
            <p className="text-xs text-text-muted leading-relaxed">
              Vă așteptăm cu drag!<br />
              Completați formularul de mai jos pentru a ne anunța decizia.
            </p>
          </div>

          <form onSubmit={(e: FormEvent) => e.preventDefault()} className="space-y-4">
            {/* Person count */}
            <div>
              <label className="block text-xs text-text-muted mb-1 tracking-wide">
                Câte persoane
              </label>
              <select
                value={personCount}
                onChange={(e) => {
                  setPersonCount(parseInt(e.target.value));
                  setErrors((prev) => ({ ...prev, personCount: "" }));
                }}
                onKeyDown={handleKeyDown}
                disabled={isDisabled}
                className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
              >
                <option value={0}>Alege număr persoane</option>
                <option value={1}>O persoană</option>
                <option value={2}>Două persoane</option>
              </select>
              {errors.personCount && (
                <p className="text-xs text-button mt-1">{errors.personCount}</p>
              )}
            </div>

            {/* Names row */}
            {personCount > 0 && (
              <div className={`grid gap-4 ${personCount === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-wide">
                    Numele tău
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    onKeyDown={handleKeyDown}
                    disabled={isDisabled}
                    placeholder="Nume"
                    enterKeyHint="next"
                    className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white
                               focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                  />
                  {errors.name && (
                    <p className="text-xs text-button mt-1">{errors.name}</p>
                  )}
                </div>

                {personCount === 2 && (
                  <div>
                    <label className="block text-xs text-text-muted mb-1 tracking-wide">
                      Nume partener
                    </label>
                    <input
                      ref={partnerRef}
                      type="text"
                      value={partnerName}
                      onChange={(e) => {
                        setPartnerName(e.target.value);
                        setErrors((prev) => ({ ...prev, partnerName: "" }));
                      }}
                      onKeyDown={handleKeyDown}
                      disabled={isDisabled}
                      placeholder="Partener"
                      enterKeyHint="next"
                      className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white
                                 focus:outline-none focus:border-accent transition-colors disabled:opacity-50"
                    />
                    {errors.partnerName && (
                      <p className="text-xs text-button mt-1">{errors.partnerName}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs text-text-muted mb-1 tracking-wide">
                Vrei să ne transmiți ceva?
              </label>
              <textarea
                ref={messageRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={isDisabled}
                rows={3}
                enterKeyHint="enter"
                className="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm bg-white
                           focus:outline-none focus:border-accent transition-colors resize-none disabled:opacity-50"
              />
            </div>

            {/* Error message */}
            {formState === "error" && (
              <p className="text-xs text-button text-center">
                A apărut o eroare. Te rog încearcă din nou.
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isDisabled}
                className="flex-1 bg-button text-white py-2.5 px-4 rounded-lg text-sm font-medium
                           hover:bg-button-hover transition-colors disabled:opacity-50"
              >
                {formState === "submitting" ? "Se trimite..." : "Da, confirm prezența"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isDisabled}
                className="flex-1 border border-button py-2.5 px-4 rounded-lg text-sm
                           text-foreground hover:bg-background-soft transition-colors disabled:opacity-50"
              >
                Nu pot să particip
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
