import html2canvas from "html2canvas";

/**
 * Generates a PNG data URL from an HTML element.
 * Uses html2canvas (canvas fillText) so fonts render identically to the live DOM,
 * including Romanian comma-below diacritics from latin-ext italic subsets.
 */
export async function safeToPng(
  element: HTMLElement,
  options: { pixelRatio?: number; skipFonts?: boolean } = {}
): Promise<string> {
  const scale = options.pixelRatio ?? 6;

  if (typeof document !== "undefined" && document.fonts) {
    // Eșantion: diacritice RO + litere + simboluri, ca subseturile să se încarce.
    const sample =
      "ăâîșțĂÂÎȘȚ&AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz 0123456789";

    // Familiile reale next/font sunt obfuscate și expuse prin variabile CSS pe
    // <body>. Le rezolvăm ca să încărcăm EXACT fontul folosit în DOM (altfel
    // html2canvas poate captura cu fontul de rezervă → metrici/spațiere diferite).
    const bodyStyle = getComputedStyle(document.body);
    const rootStyle = getComputedStyle(document.documentElement);
    const readVar = (name: string) =>
      (bodyStyle.getPropertyValue(name) || rootStyle.getPropertyValue(name) || "").trim();
    const varFamilies = ["--font-cormorant", "--font-script", "--font-montserrat", "--font-lora"]
      .flatMap((v) => readVar(v).split(","))
      .map((f) => f.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
    const literalFamilies = ["Cormorant Garamond", "Montserrat", "Alex Brush", "Lora"];
    const families = Array.from(new Set([...varFamilies, ...literalFamilies]));

    const weights = ["300", "400", "500", "600", "700"];
    const styles = ["normal", "italic"];
    await Promise.all(
      families.flatMap((f) =>
        weights.flatMap((w) =>
          styles.map((s) =>
            document.fonts.load(`${s} ${w} 1em "${f}"`, sample).catch(() => {})
          )
        )
      )
    );
    await document.fonts.ready;
  }

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: null,
    logging: false,
  });

  return canvas.toDataURL("image/png");
}
