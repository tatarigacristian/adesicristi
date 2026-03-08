"use client";

import { useState, useEffect, useRef, FormEvent, KeyboardEvent } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3011";

type FormState = "loading" | "idle" | "submitting" | "confirmed" | "declined" | "cancelled" | "error";

interface GuestData {
  id: number;
  nume: string;
  prenume: string;
  plus_one: boolean;
  intro: string | null;
  partner: { nume: string; prenume: string } | null;
}

export default function RSVP({ guest }: { guest?: GuestData | null }) {
  const sectionRef = useScrollAnimation<HTMLElement>();
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

  // Check existing RSVP for this guest
  useEffect(() => {
    if (!guest) return;
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
        newErrors.personCount = "Te rog sa alegi numarul de persoane";
      }
      if (!name.trim()) {
        newErrors.name = "Te rog sa introduci numele";
      }
      if (personCount === 2 && !partnerName.trim()) {
        newErrors.partnerName = "Te rog sa introduci numele partenerului";
      }
    } else {
      if (!name.trim()) {
        newErrors.name = "Te rog sa introduci numele";
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
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background-soft">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="glass-card py-12">
            <p className="text-sm text-text-muted">Se incarca...</p>
          </div>
        </div>
      </section>
    );
  }

  // Confirmed state — show confirmation + cancel option
  if (formState === "confirmed") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background-soft">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="glass-card py-12">
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Multumim pentru confirmare!
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ade & Cristi</p>
            <p className="text-sm text-foreground/70 mb-8">
              Va multumim din suflet ca ati confirmat prezenta.
              <br />
              Abia asteptam sa fiti alaturi de noi!
            </p>
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="text-xs text-text-muted hover:text-accent-rose transition-colors cursor-pointer underline underline-offset-2 disabled:opacity-50"
            >
              {cancelling ? "Se anuleaza..." : "Anuleaza prezenta"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  // Cancelled state
  if (formState === "cancelled") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background-soft">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="glass-card py-12">
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Prezenta anulata
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ne pare rau</p>
            <p className="text-sm text-foreground/70">
              Regretam ca nu veti putea fi alaturi de noi.
              <br />
              Va dorim numai bine!
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Declined state (submitted "Nu pot sa particip")
  if (formState === "declined") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background-soft">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="glass-card py-12">
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Am primit raspunsul tau
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ne pare rau</p>
            <p className="text-sm text-foreground/70">
              Regretam ca nu veti putea fi alaturi de noi.
              <br />
              Va dorim numai bine!
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="rsvp"
      ref={sectionRef}
      className="snap-section content-section bg-background-soft animate-on-scroll"
    >
      <div className="max-w-lg mx-auto w-full">
        <div className="glass-card">
          <div className="text-center mb-6">
            <h2 className="serif-font text-2xl md:text-3xl font-light text-text-heading mb-2">
              Confirmare
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Va asteptam cu drag!<br />
              Completati formularul de mai jos pentru a ne anunta decizia.
            </p>
          </div>

          <form onSubmit={(e: FormEvent) => e.preventDefault()} className="space-y-4">
            {/* Person count */}
            <div>
              <label className="block text-xs text-text-muted mb-1 tracking-wide">
                Cate persoane
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
                <option value={0}>Alege numar persoane</option>
                <option value={1}>O persoana</option>
                <option value={2}>Doua persoane</option>
              </select>
              {errors.personCount && (
                <p className="text-xs text-accent-rose mt-1">{errors.personCount}</p>
              )}
            </div>

            {/* Names row */}
            {personCount > 0 && (
              <div className={`grid gap-4 ${personCount === 2 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                <div>
                  <label className="block text-xs text-text-muted mb-1 tracking-wide">
                    Numele tau
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
                    <p className="text-xs text-accent-rose mt-1">{errors.name}</p>
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
                      <p className="text-xs text-accent-rose mt-1">{errors.partnerName}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div>
              <label className="block text-xs text-text-muted mb-1 tracking-wide">
                Vrei sa ne transmiti ceva?
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
              <p className="text-xs text-accent-rose text-center">
                A aparut o eroare. Te rog incearca din nou.
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={isDisabled}
                className="flex-1 bg-accent text-white py-2.5 px-4 rounded-lg text-sm font-medium
                           hover:bg-accent-light transition-colors disabled:opacity-50"
              >
                {formState === "submitting" ? "Se trimite..." : "Da, confirm prezenta"}
              </button>
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={isDisabled}
                className="flex-1 border border-border py-2.5 px-4 rounded-lg text-sm
                           text-foreground hover:bg-background-soft transition-colors disabled:opacity-50"
              >
                Nu pot sa particip
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
