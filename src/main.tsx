import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Force clear all old caches and service workers on app boot
const APP_VERSION = "3.2.0";
const VERSION_KEY = "bravenza-app-version";

function clearAllCaches() {
  // Run in background — don't block rendering
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }
  if ("caches" in window) {
    caches.keys().then((names) =>
      names.forEach((name) => caches.delete(name))
    );
  }
}

// Check version — only clear caches on version change
const storedVersion = localStorage.getItem(VERSION_KEY);

if (storedVersion !== APP_VERSION) {
  console.log(`[BRAVENZA] Upgrading ${storedVersion} → ${APP_VERSION}`);
  localStorage.setItem(VERSION_KEY, APP_VERSION);
  clearAllCaches();
  if (storedVersion !== null) {
    window.location.reload();
  }
}

// Render immediately — no async blocking
createRoot(document.getElementById("root")!).render(<App />);
