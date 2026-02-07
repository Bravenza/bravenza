import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear all old caches and service workers on app boot
const APP_VERSION = "2.3.0";
const VERSION_KEY = "bravenza-app-version";

async function clearOldCaches() {
  const storedVersion = localStorage.getItem(VERSION_KEY);
  
  if (storedVersion !== APP_VERSION) {
    console.log(`[BRAVENZA] Upgrading from ${storedVersion} to ${APP_VERSION} — clearing all caches`);

    // Unregister all service workers
    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }

    // Delete all caches
    if ("caches" in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
    }

    localStorage.setItem(VERSION_KEY, APP_VERSION);

    // Reload to get fresh assets
    if (storedVersion !== null) {
      window.location.reload();
      // Stop execution — the reload will re-run this script with matching version
      return false;
    }
  }
  return true;
}

clearOldCaches().then((proceed) => {
  if (proceed) {
    createRoot(document.getElementById("root")!).render(<App />);
  }
});
