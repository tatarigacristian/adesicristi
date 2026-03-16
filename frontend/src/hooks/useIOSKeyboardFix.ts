"use client";

import { useEffect, useRef } from "react";

/**
 * Fixes iOS Chrome bug where the viewport height stays "stuck" after
 * the virtual keyboard closes. A pinch-zoom (resize event) fixes it,
 * so this hook simulates that recalculation on keyboard dismiss.
 */
export function useIOSKeyboardFix() {
  const keyboardOpenRef = useRef(false);

  useEffect(() => {
    // Only run on iOS
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (!isIOS) return;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      ) {
        keyboardOpenRef.current = true;
      }
    };

    const forceViewportRecalc = () => {
      // Force the browser to recalculate viewport height
      // This mimics what a pinch-zoom (resize) does
      const panel = document.querySelector(".right-panel") as HTMLElement;
      if (panel) {
        // Briefly set a fixed height then remove it to trigger reflow
        const h = panel.offsetHeight;
        panel.style.height = h + "px";
        // Force a synchronous reflow
        void panel.offsetHeight;
        panel.style.height = "";
      }

      // Also reset any stuck scroll position on the window
      window.scrollTo(0, 0);
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (!keyboardOpenRef.current) return;

      // Skip if focus moves to another input
      const related = e.relatedTarget as HTMLElement | null;
      if (
        related &&
        (related.tagName === "INPUT" ||
          related.tagName === "TEXTAREA" ||
          related.tagName === "SELECT")
      ) {
        return;
      }

      keyboardOpenRef.current = false;

      // Wait for keyboard dismiss animation to complete
      setTimeout(forceViewportRecalc, 300);
    };

    // Also catch keyboard dismiss via the Done button / swipe gesture
    // which may not fire focusout
    const handleViewportResize = () => {
      if (!keyboardOpenRef.current) return;

      const vv = window.visualViewport;
      if (!vv) return;

      const heightDiff = window.innerHeight - vv.height;
      if (heightDiff < 150) {
        // Keyboard closed
        keyboardOpenRef.current = false;
        setTimeout(forceViewportRecalc, 100);
      }
    };

    document.addEventListener("focusin", handleFocusIn, true);
    document.addEventListener("focusout", handleFocusOut, true);

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", handleViewportResize);
    }

    return () => {
      document.removeEventListener("focusin", handleFocusIn, true);
      document.removeEventListener("focusout", handleFocusOut, true);
      if (vv) {
        vv.removeEventListener("resize", handleViewportResize);
      }
    };
  }, []);
}
