import { FEATURE_FLAGS, type FeatureFlag } from "@/config/featureFlags";

/**
 * Hook to check feature flags.
 *
 * Usage:
 *   const { isEnabled } = useConfig();
 *   if (isEnabled("enable_favorites_lists")) { ... }
 */
export function useConfig() {
  const isEnabled = (flag: FeatureFlag): boolean => {
    return FEATURE_FLAGS[flag] ?? false;
  };

  return { isEnabled, flags: FEATURE_FLAGS };
}
