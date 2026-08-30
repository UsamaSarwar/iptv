"use client";

import { useEffect, useCallback } from "react";

interface TVNavigationOptions {
  enabled?: boolean;
  onSelect?: () => void;
  onBack?: () => void;
  onChannelUp?: () => void;
  onChannelDown?: () => void;
}

/**
 * Spatial D-Pad & TV Remote navigation hook supporting Android TV, Fire TV, and Keyboard Arrow navigation.
 */
export function useTVNavigation({
  enabled = true,
  onSelect,
  onBack,
  onChannelUp,
  onChannelDown,
}: TVNavigationOptions = {}) {
  const handleTVKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // Skip navigation if inside text input or textarea
      const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        if (e.key === "Escape") {
          (document.activeElement as HTMLElement).blur();
        }
        return;
      }

      // Android TV / Remote key codes
      switch (e.key) {
        case "ArrowRight":
        case "ArrowLeft":
        case "ArrowUp":
        case "ArrowDown": {
          const focusable = Array.from(
            document.querySelectorAll<HTMLElement>(
              'a[href], button:not([disabled]), [tabindex="0"], input, [role="button"]'
            )
          ).filter((el) => {
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).visibility !== "hidden";
          });

          if (focusable.length === 0) return;

          const activeIdx = focusable.indexOf(document.activeElement as HTMLElement);

          if (activeIdx === -1) {
            focusable[0]?.focus();
            e.preventDefault();
            return;
          }

          let nextIdx = activeIdx;

          if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            nextIdx = (activeIdx + 1) % focusable.length;
          } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            nextIdx = (activeIdx - 1 + focusable.length) % focusable.length;
          }

          if (nextIdx !== activeIdx) {
            focusable[nextIdx]?.focus();
            focusable[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
            e.preventDefault();
          }
          break;
        }

        case "Enter":
        case "Select":
          if (onSelect) {
            onSelect();
          }
          break;

        case "Back":
        case "BrowserBack":
        case "GoBack":
        case "Escape":
          if (onBack) {
            e.preventDefault();
            onBack();
          }
          break;

        case "ChannelUp":
        case "MediaTrackNext":
          if (onChannelUp) {
            e.preventDefault();
            onChannelUp();
          }
          break;

        case "ChannelDown":
        case "MediaTrackPrevious":
          if (onChannelDown) {
            e.preventDefault();
            onChannelDown();
          }
          break;

        default:
          break;
      }
    },
    [enabled, onSelect, onBack, onChannelUp, onChannelDown]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleTVKeyDown);
    return () => window.removeEventListener("keydown", handleTVKeyDown);
  }, [handleTVKeyDown]);
}
