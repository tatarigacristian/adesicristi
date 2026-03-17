/**
 * Formulări pentru invitații, în funcție de sexul invitatului și plus one (singular vs plural).
 * plural = invitat + partener (adresare la persoana a 2-a).
 */

export type GuestSex = "M" | "F" | null;

export interface InvitationAudience {
  /** Are partener (plus one) → adresare la plural */
  hasPartner: boolean;
  /** Sexul invitatului principal (pentru singular: Dragul nostru / Draga noastră) */
  sex: GuestSex;
}

export function isPlural(audience: InvitationAudience): boolean {
  return audience.hasPartner;
}

/**
 * Formă de adresare: Dragii noștri (plural), Dragul nostru (M), Draga noastră (F).
 * Pentru card/invitații scurte se poate folosi forma scurtă pentru singular.
 */
export function getGreeting(audience: InvitationAudience, shortForm = false): string {
  if (audience.hasPartner) return "Dragii noștri";
  if (audience.sex === "M") return "Dragul nostru";
  if (shortForm) return "Dragă"; // formă scurtă comună (sau poți diferenția M/F)
  return audience.sex === "F" ? "Draga noastră" : "Dragul nostru";
}

/** "Draga" / "Dragul nostru" / "Dragii nostri" pentru card (formă scurtă). */
export function getGreetingShort(audience: InvitationAudience): string {
  if (audience.hasPartner) return "Dragii noștri";
  return audience.sex === "M" ? "Dragul nostru" : "Draga";
}

/**
 * "Cu drag te invităm" / "Cu drag vă invităm"
 */
export function getInvitationLine(audience: InvitationAudience): string {
  return audience.hasPartner ? "Cu drag vă invităm" : "Cu drag te invităm";
}

/** Uppercase pentru invitații tipărite: "CU DRAG TE INVITĂM" / "CU DRAG VĂ INVITĂM" */
export function getInvitationLineUpper(audience: InvitationAudience): string {
  return getInvitationLine(audience).toUpperCase();
}

/**
 * "Să fii alături de noi" / "Să fiți alături de noi"
 */
export function getAlaturiLine(audience: InvitationAudience): string {
  return audience.hasPartner ? "Să fiți alături de noi" : "Să fii alături de noi";
}

/**
 * "Te așteptăm cu drag!" / "Vă așteptăm cu drag!"
 */
export function getAsteptamLine(audience: InvitationAudience): string {
  return audience.hasPartner ? "Vă așteptăm cu drag!" : "Te așteptăm cu drag!";
}

/** Formă scurtă pentru design: "Te asteptam cu drag!" / "Va asteptam cu drag!" (fără diacritice pe a) */
export function getAsteptamLineShort(audience: InvitationAudience): string {
  return audience.hasPartner ? "Va asteptam cu drag!" : "Te asteptam cu drag!";
}

/**
 * Text intro implicit (când nu există intro_short/intro_long).
 * Singular: "să fii alături"; plural: "să fiți alături".
 */
export function getDefaultIntroShort(audience: InvitationAudience): string {
  if (audience.hasPartner) {
    return "Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială.";
  }
  return "Ne-ar face o deosebită plăcere să fii alături de noi în această zi specială.";
}

/**
 * Text intro lung implicit (Hero / invitație).
 */
export function getDefaultIntroLong(audience: InvitationAudience): string {
  if (audience.hasPartner) {
    return "Ne-ar face o deosebită plăcere să fiți alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment.";
  }
  return "Ne-ar face o deosebită plăcere să fii alături de noi în această zi specială, să împărtășim împreună emoția și fericirea acestui moment.";
}

export function getInvitationAudience(hasPartner: boolean, sex: GuestSex): InvitationAudience {
  return { hasPartner, sex: sex ?? null };
}

/** Linii default pentru invitație (uppercase), în funcție de singular/plural */
export function getDefaultInvitationLines(audience: InvitationAudience): string[] {
  if (audience.hasPartner) {
    return [
      "AVEM PLĂCEREA DE A VĂ INVITA SĂ FIȚI ALĂTURI DE NOI",
      "ÎN ZIUA ÎN CARE NE LEGĂM DESTINELE",
      "ȘI PĂȘIM ÎMPREUNĂ PE DRUMUL UNEI NOI VIEȚI.",
    ];
  }
  return [
    "AVEM PLĂCEREA DE A TE INVITA SĂ FII ALĂTURI DE NOI",
    "ÎN ZIUA ÎN CARE NE LEGĂM DESTINELE",
    "ȘI PĂȘIM ÎMPREUNĂ PE DRUMUL UNEI NOI VIEȚI.",
  ];
}
