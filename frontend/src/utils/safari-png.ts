import { toPng } from "html-to-image";

const isIOS =
  typeof navigator !== "undefined" &&
  /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Generates a PNG data URL from an HTML element.
 * On iOS Safari, does a warm-up render first to ensure embedded images
 * (base64 QR codes) and thin CSS elements (gradients, borders) are captured.
 */
export async function safeToPng(
  element: HTMLElement,
  options: { pixelRatio?: number } = {}
): Promise<string> {
  const opts = { pixelRatio: 3, ...options };

  if (isIOS) {
    // Warm-up render — forces Safari to rasterize all resources
    await toPng(element, opts).catch(() => {});
  }

  return toPng(element, opts);
}
