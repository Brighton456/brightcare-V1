/**
 * Viewport zoom lock.
 *
 * The clinical UI is a dense desktop-first workspace: a pinch or a stray
 * Ctrl+wheel scrolls the layout out from under the operator and makes
 * data entry (amounts, stock counts) error-prone. This module keeps the
 * visual viewport pinned at 1:1 for every gesture the page can observe.
 *
 * What is blocked:
 *  - Ctrl/⌘ + wheel  → browser page zoom
 *  - pinch gesture   → Safari `gesturestart` / `gesturechange` events
 *  - Ctrl/⌘ + +/-/0  → browser zoom in/out/reset shortcuts
 *  - double-tap zoom → CSS `touch-action` on <html> (see index.css)
 *
 * What is intentionally NOT blocked: the browser's own zoom menu
 * (View → Zoom). That is a browser-chrome setting a page cannot change.
 *
 * Text scaling for accessibility is left intact — we lock *zoom*, not
 * user font-size preferences.
 */

const ZOOM_KEYS = new Set(["+", "=", "-", "_", "0", "Add", "Subtract"]);

/**
 * Installs the zoom lock and returns a teardown function.
 * Safe to call in any environment without a DOM (returns a no-op).
 */
export function installZoomLock(): () => void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return () => {};
  }

  // Ctrl/⌘ + wheel is the browser's page-zoom gesture.
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
    }
  };

  // Safari pinch-to-zoom (also fires for trackpad pinch on macOS).
  const onGesture = (event: Event) => {
    event.preventDefault();
  };

  // Ctrl/⌘ + "+" / "-" / "0" zoom shortcuts.
  const onKeyDown = (event: KeyboardEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    if (!ZOOM_KEYS.has(event.key)) return;
    event.preventDefault();
  };

  // Chrome/Edge pinch-zoom on touch devices is not exposed as a DOM event,
  // so it is suppressed by CSS `touch-action` on <html> instead.

  window.addEventListener("wheel", onWheel, { passive: false, capture: true });
  window.addEventListener("gesturestart", onGesture, { passive: false });
  window.addEventListener("gesturechange", onGesture, { passive: false });
  window.addEventListener("gestureend", onGesture, { passive: false });
  document.addEventListener("keydown", onKeyDown, { capture: true });

  return () => {
    window.removeEventListener("wheel", onWheel, { capture: true } as EventListenerOptions);
    window.removeEventListener("gesturestart", onGesture);
    window.removeEventListener("gesturechange", onGesture);
    window.removeEventListener("gestureend", onGesture);
    document.removeEventListener("keydown", onKeyDown, { capture: true } as EventListenerOptions);
  };
}
