// Build bust: 2026-02-21T17:05:00Z
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear ALL caches, service workers, and stale data on EVERY page load
// This guarantees the preview always shows the latest version
const APP_VERSION = "3.5.6";
const VERSION_KEY = "bravenza-app-version";
const FORCE_CLEAN_KEY = "bravenza-force-clean-done";

// Aggressive cleanup — runs synchronously before render
function nukeAllCaches() {
  // 1. Unregister ALL service workers
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        r.unregister();
        console.log("[BRAVENZA] Unregistered SW:", r.scope);
      });
    });
    // Also clear the controller immediately
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "SKIP_WAITING" });
    }
  }

  // 2. Delete ALL Cache Storage entries
  if ("caches" in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
        console.log("[BRAVENZA] Deleted cache:", name);
      });
    });
  }
}

// Run cleanup on every boot
nukeAllCaches();

// Version-based hard reload (forces browser to fetch fresh assets)
const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== APP_VERSION) {
  console.log(`[BRAVENZA] Upgrading ${storedVersion} → ${APP_VERSION}`);
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  // Force a clean reload if upgrading (not on first visit)
  if (storedVersion !== null) {
    // Clear sessionStorage too
    sessionStorage.clear();
    window.location.reload();
  }
}

// One-time force clean for users stuck on old cache
if (!localStorage.getItem(FORCE_CLEAN_KEY)) {
  localStorage.setItem(FORCE_CLEAN_KEY, "1");
  sessionStorage.clear();
  // If we had a previous version, force reload
  if (storedVersion !== null) {
    window.location.reload();
  }
}

// Render immediately
createRoot(document.getElementById("root")!).render(<App />);
