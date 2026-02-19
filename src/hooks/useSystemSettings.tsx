import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  whatsapp_number: string;
  whatsapp_message: string;
  public_base_url: string;
  payment_fee_pix: number;
  payment_fee_credit_card: number;
}

const DEFAULT_SETTINGS: SystemSettings = {
  whatsapp_number: "5551981055425",
  whatsapp_message: "Olá! Gostaria de saber mais sobre a BRAVENZA.",
  public_base_url: "https://bravenza.com.br",
  payment_fee_pix: 0.0099,
  payment_fee_credit_card: 0.0499,
};

let cachedSettings: SystemSettings | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useSystemSettings() {
  const [settings, setSettings] = useState<SystemSettings>(cachedSettings || DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(!cachedSettings);

  const fetchSettings = useCallback(async () => {
    // Use cache if fresh
    if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
      setSettings(cachedSettings);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value")
        .in("key", [
          "whatsapp_number",
          "whatsapp_message",
          "public_base_url",
          "payment_fee_pix",
          "payment_fee_credit_card",
        ]);

      if (error) throw error;

      const newSettings = { ...DEFAULT_SETTINGS };

      data?.forEach((row) => {
        const key = row.key as keyof SystemSettings;
        const value = row.value;

        if (key === "payment_fee_pix" || key === "payment_fee_credit_card") {
          newSettings[key] = typeof value === "number" ? value : parseFloat(String(value));
        } else if (key in newSettings) {
          newSettings[key] = typeof value === "string" ? value.replace(/^"|"$/g, "") : String(value);
        }
      });

      cachedSettings = newSettings;
      cacheTimestamp = Date.now();
      setSettings(newSettings);
    } catch (err) {
      // Keep defaults on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const refreshSettings = useCallback(async () => {
    cachedSettings = null;
    cacheTimestamp = 0;
    await fetchSettings();
  }, [fetchSettings]);

  return { settings, isLoading, refreshSettings };
}

// Utility function to get settings synchronously (for edge functions calls)
export async function getSystemSettings(): Promise<SystemSettings> {
  if (cachedSettings && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedSettings;
  }

  try {
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", [
        "whatsapp_number",
        "whatsapp_message",
        "public_base_url",
        "payment_fee_pix",
        "payment_fee_credit_card",
      ]);

    if (error) throw error;

    const newSettings = { ...DEFAULT_SETTINGS };

    data?.forEach((row) => {
      const key = row.key as keyof SystemSettings;
      const value = row.value;

      if (key === "payment_fee_pix" || key === "payment_fee_credit_card") {
        newSettings[key] = typeof value === "number" ? value : parseFloat(String(value));
      } else if (key in newSettings) {
        newSettings[key] = typeof value === "string" ? value.replace(/^"|"$/g, "") : String(value);
      }
    });

    cachedSettings = newSettings;
    cacheTimestamp = Date.now();
    return newSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

// Export defaults for fallback
export { DEFAULT_SETTINGS };
