import { ReactNode } from "react";
import { ClientSessionProvider } from "@/hooks/useClientSession";

/**
 * Wraps routes that need client authentication context.
 * Uses Supabase Auth via ClientSessionProvider (legacy CPF/OTP removed).
 */
export function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <ClientSessionProvider>
      {children}
    </ClientSessionProvider>
  );
}
