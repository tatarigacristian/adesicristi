"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Swiper as SwiperType } from "swiper";

/**
 * Fixes iOS Safari viewport shift when virtual keyboard opens/closes
 * inside a vertical Swiper layout.
 *
 * The problem: iOS Safari doesn't resize the layout viewport when the keyboard
 * opens. Instead it shifts the visual viewport upward via visualViewport.offsetTop.
 * When the keyboard dismisses, this offset often doesn't reset, leaving the page
 * stuck in a shifted position.
 *
 * This hook:
 * 1. Disables Swiper touch/swiping while an input is focused (prevents Swiper
 *    from fighting with iOS's viewport adjustments)
 * 2. On keyboard dismiss (focusout), forces a scroll correction and tells
 *    Swiper to recalculate
 * 3. Uses visualViewport resize events to detect keyboard open/close
 */
export function useIOSKeyboardFix(swiper: SwiperType | null) {
  const isIOSRef = useRef(false);
  const keyboardOpenRef = useRef(false);
  const activeSlideIndexRef = useRef(0);

  // Detect iOS
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      isIOSRef.current =
        /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    }
  }, []);

  const handleFocusIn = useCallback(
    (e: FocusEvent) => {
      if (!isIOSRef.current || !swiper) return;

      const target = e.target as HTMLElement;
      const isFormInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      if (!isFormInput) return;

      keyboardOpenRef.current = true;
      activeSlideIndexRef.current = swiper.activeIndex;

      // Disable Swiper touch movement while keyboard is open
      // This prevents Swiper from interfering with iOS viewport adjustments
      swiper.allowTouchMove = false;

      // Also disable mousewheel to prevent accidental slide changes
      if (swiper.mousewheel) {
        swiper.mousewheel.disable();
      }
    },
    [swiper]
  );

  const handleFocusOut = useCallback(
    (e: FocusEvent) => {
      if (!isIOSRef.current || !swiper) return;

      // Check if focus is moving to another form input (e.g. tabbing between fields)
      // In that case, don't run the keyboard-dismiss fix
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (
        relatedTarget &&
        (relatedTarget.tagName === "INPUT" ||
          relatedTarget.tagName === "TEXTAREA" ||
          relatedTarget.tagName === "SELECT")
      ) {
        return;
      }

      if (!keyboardOpenRef.current) return;
      keyboardOpenRef.current = false;

      // Give iOS time to dismiss the keyboard and settle the viewport
      setTimeout(() => {
        // Force scroll correction - this is the key fix for the stuck viewport
        window.scrollTo(0, 0);

        // Additional nudge to force Safari to recalculate layout
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;

        // Force a tiny scroll bounce to unstick the visual viewport
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);

        // Re-enable Swiper
        swiper.allowTouchMove = true;
        if (swiper.mousewheel) {
          swiper.mousewheel.enable();
        }

        // Force Swiper to go back to the correct slide
        // (in case iOS's viewport shift confused Swiper's position tracking)
        swiper.slideTo(activeSlideIndexRef.current, 0);

        // Tell Swiper to recalculate its dimensions
        swiper.update();
      }, 300);
    },
    [swiper]
  );

  // VisualViewport resize handler - detects keyboard open/close
  const handleViewportResize = useCallback(() => {
    if (!isIOSRef.current || !swiper) return;

    const vv = window.visualViewport;
    if (!vv) return;

    // When keyboard opens, visualViewport.height shrinks significantly
    // When it closes, it returns close to window.innerHeight
    const heightDiff = window.innerHeight - vv.height;
    const keyboardLikelyOpen = heightDiff > 150; // keyboard is typically 250-350px

    if (!keyboardLikelyOpen && keyboardOpenRef.current) {
      // Keyboard just closed but focusout didn't fire (can happen with
      // keyboard dismiss button or swipe-down gesture)
      keyboardOpenRef.current = false;

      setTimeout(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        window.scrollBy(0, 1);
        window.scrollBy(0, -1);

        swiper.allowTouchMove = true;
        if (swiper.mousewheel) {
          swiper.mousewheel.enable();
        }
        swiper.slideTo(activeSlideIndexRef.current, 0);
        swiper.update();
      }, 100);
    }
  }, [swiper]);

  useEffect(() => {
    if (!swiper) return;

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
  }, [swiper, handleFocusIn, handleFocusOut, handleViewportResize]);
}
