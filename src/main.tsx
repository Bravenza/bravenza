import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear all old caches and service workers on app boot
const APP_VERSION = "3.1.0";
const VERSION_KEY = "bravenza-app-version";

async function clearAllCaches() {
  // 1. Unregister ALL service workers
  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }

  // 2. Delete ALL Cache Storage entries
  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((name) => caches.delete(name)));
  }
}

async function boot() {
  const storedVersion = localStorage.getItem(VERSION_KEY);

  // Always nuke service workers — they cause stale previews
  await clearAllCaches();

  if (storedVersion !== APP_VERSION) {
    console.log(`[BRAVENZA] Upgrading ${storedVersion} → ${APP_VERSION}`);
    localStorage.setItem(VERSION_KEY, APP_VERSION);

    // Only hard-reload on actual upgrades (not first visit)
    if (storedVersion !== null) {
      window.location.reload();
      return false;
    }
  }
  return true;
}

boot().then((proceed) => {
  if (proceed) {
    createRoot(document.getElementById("root")!).render(<App />);
  }
});
