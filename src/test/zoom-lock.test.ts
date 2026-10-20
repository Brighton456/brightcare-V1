import { describe, it, expect, afterEach, vi } from "vitest";
import { installZoomLock } from "@/lib/zoomLock";

describe("installZoomLock", () => {
  let teardown: (() => void) | undefined;

  afterEach(() => {
    teardown?.();
    teardown = undefined;
    vi.restoreAllMocks();
  });

  it("blocks ctrl+wheel page zoom", () => {
    teardown = installZoomLock();

    const event = new WheelEvent("wheel", { ctrlKey: true, deltaY: -100, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("leaves ordinary scrolling wheels alone", () => {
    teardown = installZoomLock();

    const event = new WheelEvent("wheel", { deltaY: 120, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("blocks pinch gesture events", () => {
    teardown = installZoomLock();

    const event = new Event("gesturestart", { cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("blocks ctrl+plus / ctrl+minus / ctrl+0 zoom shortcuts", () => {
    teardown = installZoomLock();

    for (const key of ["+", "-", "0"]) {
      const event = new KeyboardEvent("keydown", { key, ctrlKey: true, cancelable: true, bubbles: true });
      document.dispatchEvent(event);
      expect(event.defaultPrevented, `expected ctrl+${key} to be blocked`).toBe(true);
    }
  });

  it("does not block ordinary typing", () => {
    teardown = installZoomLock();

    const event = new KeyboardEvent("keydown", { key: "-", cancelable: true, bubbles: true });
    document.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it("removes its listeners on teardown", () => {
    teardown = installZoomLock();
    teardown();
    teardown = undefined;

    const event = new WheelEvent("wheel", { ctrlKey: true, deltaY: -100, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });
});
