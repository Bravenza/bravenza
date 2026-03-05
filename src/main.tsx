import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";
import { logger } from "@/lib/logger";

// Initialize Sentry in production only
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (import.meta.env.PROD && sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
    tracesSampleRate: 0.2,
    environment: "production",
  });
}

const APP_VERSION = "3.6.0";
const VERSION_KEY = "bravenza-app-version";

// Version-gated cleanup — only runs when the app version changes
const storedVersion = localStorage.getItem(VERSION_KEY);
if (storedVersion !== APP_VERSION) {
  logger.log(`[BRAVENZA] Upgrading ${storedVersion} → ${APP_VERSION}`);
  localStorage.setItem(VERSION_KEY, APP_VERSION);

  // Unregister stale service workers on upgrade
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.getRegistrations().then((regs) =>
      regs.forEach((r) => r.unregister())
    );
  }

  // Purge cache storage on upgrade
  if ("caches" in window) {
    caches.keys().then((names) => names.forEach((n) => caches.delete(n)));
  }

  // Hard reload if upgrading (not first visit)
  if (storedVersion !== null) {
    sessionStorage.clear();
    window.location.reload();
  }
}

createRoot(document.getElementById("root")!).render(<App />);
