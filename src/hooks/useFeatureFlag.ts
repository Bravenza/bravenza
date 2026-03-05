import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { FEATURE_FLAGS, type FeatureFlag } from "@/config/featureFlags";

/**
 * Hook that checks a feature flag via PostHog (dynamic, remote)
 * and falls back to the static value in featureFlags.ts.
 *
 * Usage:
 *   const { enabled, loading } = useFeatureFlag("enable_favorites_lists");
 */
export function useFeatureFlag(flag: FeatureFlag) {
  const fallback = FEATURE_FLAGS[flag] ?? false;
  const posthogReady =
    typeof window !== "undefined" &&
    import.meta.env.PROD &&
    !!import.meta.env.VITE_POSTHOG_KEY &&
    posthog.__loaded;

  const [enabled, setEnabled] = useState<boolean>(fallback);
  const [loading, setLoading] = useState<boolean>(posthogReady);

  useEffect(() => {
    if (!posthogReady) {
      setEnabled(fallback);
      setLoading(false);
      return;
    }

    // PostHog may already have flags cached
    const check = () => {
      const val = posthog.isFeatureEnabled(flag);
      setEnabled(val ?? fallback);
      setLoading(false);
    };

    // If flags are already loaded, resolve immediately
    if (posthog.featureFlags?.getFlagVariants?.()) {
      check();
    }

    // Also listen for async flag load
    posthog.onFeatureFlags(() => check());
  }, [flag, fallback, posthogReady]);

  return { enabled, loading };
}
