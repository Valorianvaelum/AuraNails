import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

let bodyLockCount = 0;
let previousBodyOverflow = "";

function lockBodyScroll() {
  if (bodyLockCount === 0) {
    previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
  }
  bodyLockCount += 1;
}

function unlockBodyScroll() {
  bodyLockCount = Math.max(0, bodyLockCount - 1);
  if (bodyLockCount === 0) {
    document.body.style.overflow = previousBodyOverflow;
  }
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => {
    const styles = window.getComputedStyle(element);
    return styles.visibility !== "hidden" && styles.display !== "none";
  });
}

export default function useDialogAccessibility({
  active,
  suspended = false,
  containerRef,
  initialFocusRef,
  onEscape,
  restoreFocus = true,
}) {
  const previousFocusRef = useRef(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return undefined;

    previousFocusRef.current = document.activeElement;
    lockBodyScroll();

    const frameId = window.requestAnimationFrame(() => {
      const container = containerRef.current;
      const preferred = initialFocusRef?.current
        || container?.querySelector("[autofocus]")
        || getFocusableElements(container)[0]
        || container;
      preferred?.focus?.({ preventScroll: true });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
      unlockBodyScroll();
      if (restoreFocus) previousFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [active, containerRef, initialFocusRef, restoreFocus]);

  useEffect(() => {
    if (!active || suspended) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscapeRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;
      const container = containerRef.current;
      const items = getFocusableElements(container);

      if (!items.length) {
        event.preventDefault();
        container?.focus?.();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || !container?.contains(activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (activeElement === last || !container?.contains(activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, containerRef, suspended]);
}
