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
    const roDiacritics = "ăâîșțĂÂÎȘȚ";
    const families = ["Cormorant Garamond", "Montserrat", "Alex Brush", "Lora"];
    const weights = ["300", "400", "500", "600"];
    const styles = ["normal", "italic"];
    await Promise.all(
      families.flatMap((f) =>
        weights.flatMap((w) =>
          styles.map((s) =>
            document.fonts.load(`${s} ${w} 1em "${f}"`, roDiacritics).catch(() => {})
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
