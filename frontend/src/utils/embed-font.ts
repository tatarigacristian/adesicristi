// Încarcă fontul Montserrat 700 (cel servit de next/font, same-origin) ca
// data-URI base64. Necesar pentru a-l încorpora într-un SVG: html2canvas
// rasterizează SVG-ul ca imagine izolată, fără acces la fonturile paginii,
// deci fontul trebuie inline. Cu fontul în SVG + dominant-baseline="central",
// numărul se centrează fiabil (browserul rasterizează SVG-ul corect, spre
// deosebire de textul HTML pe care html2canvas îl așază prea jos).

let cache: Promise<string | null> | null = null;

export function getNumberFontDataUri(): Promise<string | null> {
  if (cache) return cache;
  cache = (async () => {
    try {
      if (typeof document === "undefined") return null;
      const varVal = getComputedStyle(document.body).getPropertyValue("--font-montserrat");
      const fam = varVal.split(",")[0].trim().replace(/^['"]|['"]$/g, "");
      if (!fam) return null;

      let url: string | null = null;
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try {
          rules = sheet.cssRules;
        } catch {
          continue; // cross-origin sheet
        }
        for (const rule of Array.from(rules)) {
          const r = rule as CSSFontFaceRule;
          if (r.type === 5 /* FONT_FACE_RULE */) {
            const ff = r.style.getPropertyValue("font-family").replace(/['"]/g, "").trim();
            const fw = r.style.getPropertyValue("font-weight");
            if (ff === fam && (fw === "700" || fw.includes("700"))) {
              const m = r.style.getPropertyValue("src").match(/url\(["']?([^"')]+)["']?\)/);
              if (m) {
                url = m[1];
                break;
              }
            }
          }
        }
        if (url) break;
      }
      if (!url) return null;

      const buf = await (await fetch(url)).arrayBuffer();
      let bin = "";
      const bytes = new Uint8Array(buf);
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      return `data:font/woff2;base64,${btoa(bin)}`;
    } catch {
      return null;
    }
  })();
  return cache;
}
