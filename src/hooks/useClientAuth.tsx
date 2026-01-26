import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClientSession {
  cpf: string;
  client_name: string;
  session_token: string;
  expires_at: string;
}

interface ClientAuthContextType {
  session: ClientSession | null;
  isLoading: boolean;
  requestCode: (cpf: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  verifyCode: (cpf: string, code: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

const SESSION_KEY = "bravenza_client_session";

export function ClientAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as ClientSession;
          
          // Validate session with backend
          const { data, error } = await supabase.functions.invoke("client-auth", {
            body: {
              action: "validate_session",
              session_token: parsed.session_token,
            },
          });

          if (error || !data?.valid) {
            localStorage.removeItem(SESSION_KEY);
            setSession(null);
          } else {
            setSession({
              ...parsed,
              client_name: data.client_name,
            });
          }
        } catch {
          localStorage.removeItem(SESSION_KEY);
        }
      }
      setIsLoading(false);
    };

    loadSession();
  }, []);

  const requestCode = async (cpf: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("client-auth", {
        body: {
          action: "request_code",
          cpf,
        },
      });

      if (error) throw error;

      if (data?.error) {
        return { success: false, error: data.error };
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao enviar código" };
    }
  };

  const verifyCode = async (cpf: string, code: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("client-auth", {
        body: {
          action: "verify_code",
          cpf,
          code,
        },
      });

      if (error) throw error;

      if (data?.error) {
        return { success: false, error: data.error };
      }

      const newSession: ClientSession = {
        cpf: cpf.replace(/\D/g, ''),
        client_name: data.client_name,
        session_token: data.session_token,
        expires_at: data.expires_at,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
      setSession(newSession);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Erro ao verificar código" };
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  };

  return (
    <ClientAuthContext.Provider value={{ session, isLoading, requestCode, verifyCode, logout }}>
      {children}
    </ClientAuthContext.Provider>
  );
}

export function useClientAuth() {
  const context = useContext(ClientAuthContext);
  if (context === undefined) {
    throw new Error("useClientAuth must be used within a ClientAuthProvider");
  }
  return context;
}
