import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface ClientProfile {
  id: string;
  user_id: string;
  cpf: string;
  full_name: string;
  phone: string | null;
  vault_member_id: string | null;
  vault_tier: string | null;
  vault_status: string | null;
}

interface ClientSessionContextType {
  user: User | null;
  session: Session | null;
  profile: ClientProfile | null;
  isLoading: boolean;
  isVaultMember: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, cpf: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const ClientSessionContext = createContext<ClientSessionContextType | undefined>(undefined);

export function ClientSessionProvider({ children }: { children: ReactNode }) {
  // Reuse session from the parent AuthProvider — avoids duplicate getSession() call
  const { user, session, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase.rpc("get_client_profile");
      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      if (data && data.length > 0) {
        setProfile(data[0] as ClientProfile);
      }
    } catch (err) {
      console.error("Error in fetchProfile:", err);
    }
  };

  // Fetch profile whenever user changes (derived from parent auth)
  useEffect(() => {
    if (authLoading) return;

    if (user) {
      setProfileLoading(true);
      fetchProfile().finally(() => setProfileLoading(false));
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user, authLoading]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signUp = async (
    email: string, 
    password: string, 
    cpf: string, 
    fullName: string, 
    phone?: string
  ) => {
    // First, check if CPF already exists
    const { data: existingProfile } = await supabase
      .from("client_profiles")
      .select("cpf")
      .eq("cpf", cpf.replace(/\D/g, ""))
      .maybeSingle();

    if (existingProfile) {
      return { error: new Error("Este CPF já está cadastrado no sistema.") };
    }

    // Sign up the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/minha-conta`,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      return { error: error as Error };
    }

    // If signup successful, create profile
    if (data.user) {
      const { error: profileError } = await supabase
        .from("client_profiles")
        .insert({
          user_id: data.user.id,
          cpf: cpf.replace(/\D/g, ""),
          full_name: fullName,
          phone: phone?.replace(/\D/g, "") || null,
        });

      if (profileError) {
        console.error("Error creating profile:", profileError);
      }
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  const isLoading = authLoading || profileLoading;

  return (
    <ClientSessionContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isVaultMember: !!profile?.vault_member_id,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </ClientSessionContext.Provider>
  );
}

export function useClientSession() {
  const context = useContext(ClientSessionContext);
  if (context === undefined) {
    throw new Error("useClientSession must be used within a ClientSessionProvider");
  }
  return context;
}
