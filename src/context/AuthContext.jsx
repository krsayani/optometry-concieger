import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AuthContext = createContext(undefined);

async function fetchProfileAndRoles(userId) {
  try {
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId),
    ]);

    const roleList = roles?.map(r => r.role) || [];

    return {
      profile: profile ?? null,
      roles: roleList,
      // Default 'role' to super_admin if they have it, else first available
      role: roleList.includes("super_admin") ? "super_admin" : (roleList[0] || null)
    };
  } catch (error) {
    console.error("Error fetching profile/role:", error);
    return { profile: null, role: null, roles: [] };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState({
    session: null,
    user: null,
    profile: null,
    role: null,
    roles: [],
    loading: true,
  });

  const lastLoadedUserId = useRef(null);
  const dataLoaded = useRef(false);

  const syncUserData = useCallback(async (session, force = false) => {
    const user = session?.user ?? null;

    if (!user) {
      lastLoadedUserId.current = null;
      dataLoaded.current = false;
      setAuthState({
        session: null,
        user: null,
        profile: null,
        role: null,
        roles: [],
        loading: false,
      });
      return;
    }

    // If same user and we already successfully loaded data, just update session/user info
    // unless a force refresh is requested (e.g. from Realtime)
    if (!force && lastLoadedUserId.current === user.id && dataLoaded.current) {
      setAuthState(prev => ({ ...prev, session, user, loading: false }));
      return;
    }

    let { profile, role, roles } = await fetchProfileAndRoles(user.id);

    // Retry once for new signups
    if (!profile && roles.length === 0) {
      await new Promise(r => setTimeout(r, 1500));
      const retry = await fetchProfileAndRoles(user.id);
      profile = retry.profile;
      role = retry.role;
      roles = retry.roles;
    }

    lastLoadedUserId.current = user.id;
    dataLoaded.current = !!(profile || roles.length > 0);

    setAuthState({
      session,
      user,
      profile,
      role,
      roles,
      loading: false,
    });
  }, []);

  useEffect(() => {
    let active = true;

    // 1. Initial Load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      syncUserData(session);
    });

    // 2. Auth State Listeners
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!active) return;

        if (event === "SIGNED_OUT") {
          lastLoadedUserId.current = null;
          dataLoaded.current = false;
          setAuthState({
            session: null,
            user: null,
            profile: null,
            role: null,
            roles: [],
            loading: false,
          });
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          syncUserData(session);
        }
      }
    );

    // 3. Realtime listening for changes to own profile / role
    // This allows instant updates if a Super Admin suspends the user or changes their role
    let channel = null;
    if (authState.user?.id) {
      channel = supabase
        .channel(`auth-user-sync-${authState.user.id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles", filter: `id=eq.${authState.user.id}` },
          async (payload) => {
            const { data: { session } } = await supabase.auth.getSession();
            await syncUserData(session, true); // Force refresh

            if (payload.new?.role) {
                const roleLabel = payload.new.role === 'od' ? 'Optometrist (OD)' :
                                 payload.new.role === 'employer' ? 'Practice' :
                                 payload.new.role;

                toast.success("Permissions Updated", {
                  description: `You now have access to the ${roleLabel} dashboard.`,
                });
            }
          }
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${authState.user.id}` },
          async (payload) => {
            const { data: { session } } = await supabase.auth.getSession();
            await syncUserData(session, true); // Force refresh

            if (payload.new?.role) {
                const roleLabel = payload.new.role === 'od' ? 'Optometrist (OD)' :
                                 payload.new.role === 'employer' ? 'Practice' :
                                 payload.new.role;

                toast.success("Permissions Updated", {
                  description: `You now have access to the ${roleLabel} dashboard.`,
                });
            }
          }
        )
        .subscribe();
    }

    return () => {
      active = false;
      subscription.unsubscribe();
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [syncUserData, authState.user?.id]);

  const refreshProfile = useCallback(async () => {
    await syncUserData(authState.session, true);
  }, [syncUserData, authState.session]);

  const signOut = useCallback(async () => {
    setAuthState({
      session: null,
      user: null,
      profile: null,
      role: null,
      roles: [],
      loading: false,
    });
    lastLoadedUserId.current = null;
    dataLoaded.current = false;
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ ...authState, refreshProfile, signOut }),
    [authState, refreshProfile, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
