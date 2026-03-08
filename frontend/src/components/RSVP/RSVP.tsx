"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type FormState = "idle" | "submitting" | "success" | "error";

export default function RSVP() {
  const sectionRef = useScrollAnimation<HTMLElement>();
  const [personCount, setPersonCount] = useState(0);
  const [name, setName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const partnerRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

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
        }),
      });

      if (!res.ok) throw new Error("Server error");
      setFormState("success");
    } catch {
      setFormState("error");
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

  const isDisabled = formState === "submitting" || formState === "success";

  if (formState === "success") {
    return (
      <section id="rsvp" ref={sectionRef} className="snap-section content-section bg-background-soft">
        <div className="max-w-lg mx-auto w-full text-center">
          <div className="glass-card py-12">
            <p className="text-[0.65rem] tracking-[0.25em] uppercase text-text-muted mb-3">
              Multumim pentru confirmare!
            </p>
            <p className="script-font text-4xl text-text-heading mb-4">Ade & Cristi</p>
            <p className="text-sm text-foreground/70">Va multumim din suflet</p>
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
