import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear all old caches and service workers on app boot
const APP_VERSION = "3.4.0";
const VERSION_KEY = "bravenza-app-version";

// Always unregister service workers and clear caches on every boot
// to prevent stale preview/PWA cache issues
(async () => {
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
    if ("caches" in window) {
      const names = await caches.keys();
      await Promise.all(names.map((n) => caches.delete(n)));
    }
  } catch {
    // silently ignore
  }
})();

// Version-based hard reload (one-time on upgrade)
const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== APP_VERSION) {
  console.log(`[BRAVENZA] Upgrading ${storedVersion} → ${APP_VERSION}`);
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  if (storedVersion !== null) {
    window.location.reload();
  }
}

// Render immediately — no async blocking
createRoot(document.getElementById("root")!).render(<App />);
