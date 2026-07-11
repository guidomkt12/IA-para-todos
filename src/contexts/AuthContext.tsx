import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserPermissions {
  cliente_id: string;
  plano_id: string;
  status: string;
  trial_ends_at: string | null;
  cliente_nome: string | null;
  access_contacts: boolean;
  access_cities: boolean;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isGestor: boolean;
  allowedClients: string[];
  permissions: UserPermissions | null;
  loading: boolean;
  clienteId: string;
  trialExpiresAt: string | null;
  isAtivo: boolean;
  isTrialActive: boolean;
  trialDaysLeft: number;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  impersonateClienteId: string | null;
  setImpersonateClienteId: (id: string | null) => void;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGestor, setIsGestor] = useState(false);
  const [allowedClients, setAllowedClients] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonateClienteId, setImpersonateClienteId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const fetchUserData = useCallback(async (userId: string, requestId: number) => {
    try {
      const [permResult, gestorResult, roleResult] = await Promise.all([
        supabase
          .from("user_permissions")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("gestor_clients").select("cliente_id").eq("user_id", userId),
        supabase.from("user_roles").select("role").eq("user_id", userId),
      ]);

      if (requestIdRef.current !== requestId) return;

      let roles = (roleResult.data as any[])?.map((r: any) => r.role) || [];

      const p = permResult.data as any;

      setIsAdmin(roles.includes("admin"));
      setIsGestor((gestorResult.data?.length ?? 0) > 0 || roles.includes("gestor"));
      setAllowedClients(gestorResult.data?.map(g => g.cliente_id) || []);
      setPermissions(
        p
          ? {
              cliente_id: p.cliente_id || '',
              plano_id: p.plano_id || 'trial',
              status: p.status || 'trial',
              trial_ends_at: p.trial_ends_at || null,
              cliente_nome: p.cliente_nome || null,
              access_contacts: p.access_contacts !== false,
              access_cities: p.access_cities !== false,
            }
          : null
      );
    } catch {
      if (requestIdRef.current !== requestId) return;
      setIsAdmin(false);
      setIsGestor(false);
      setAllowedClients([]);
      setPermissions(null);
    }
  }, []);

  const refreshPermissions = useCallback(async () => {
    if (!user) return;
    requestIdRef.current += 1;
    await fetchUserData(user.id, requestIdRef.current);
  }, [user, fetchUserData]);

  useEffect(() => {
    let mounted = true;

    const sync = (nextSession: Session | null) => {
      if (!mounted) return;
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      requestIdRef.current += 1;
      const reqId = requestIdRef.current;

      if (!nextSession?.user) {
        setIsAdmin(false);
        setIsGestor(false);
        setAllowedClients([]);
        setPermissions(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      void fetchUserData(nextSession.user.id, reqId).finally(() => {
        if (mounted && requestIdRef.current === reqId) setLoading(false);
      });
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => sync(s));
    void supabase.auth.getSession().then(({ data: { session: s } }) => sync(s));

    return () => {
      mounted = false;
      requestIdRef.current += 1;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Derived values
  const clienteId = impersonateClienteId || permissions?.cliente_id || '';
  const trialExpiresAt = permissions?.trial_ends_at || null;
  const isAtivo = !['paused', 'cancelled'].includes(permissions?.status || '');
  const isTrialActive = Boolean(
    permissions?.status === 'trial' &&
    trialExpiresAt &&
    new Date(trialExpiresAt) > new Date()
  );
  const trialDaysLeft = isTrialActive
    ? Math.ceil((new Date(trialExpiresAt!).getTime() - Date.now()) / 86400000)
    : 0;

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    setImpersonateClienteId(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      session, user, isAdmin, isGestor, allowedClients, permissions, loading,
      clienteId,
      trialExpiresAt, isAtivo, isTrialActive, trialDaysLeft,
      signIn, signOut,
      impersonateClienteId, setImpersonateClienteId,
      refreshPermissions,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
