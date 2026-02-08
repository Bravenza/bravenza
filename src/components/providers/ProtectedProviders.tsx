import { ReactNode } from "react";
import { ClientAuthProvider } from "@/hooks/useClientAuth";
import { ClientSessionProvider } from "@/hooks/useClientSession";

/**
 * Wraps routes that need client authentication context.
 * Avoids loading auth providers on public pages (landing, terms, etc.)
 * which saves API calls on initial page load.
 */
export function ProtectedProviders({ children }: { children: ReactNode }) {
  return (
    <ClientAuthProvider>
      <ClientSessionProvider>
        {children}
      </ClientSessionProvider>
    </ClientAuthProvider>
  );
}
