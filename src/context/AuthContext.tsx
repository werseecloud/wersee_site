import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import {
  clearSupabaseBrowserAuthStorage,
  isAuthEmail2faPending,
  supabase,
  trackCurrentAuthDevice,
} from '../lib/supabase';
import { connectCreatorAttribution } from '../lib/creatorGrowth';
import {
  clearImplicitAuthCallbackHash,
  clearClientAuthArtifacts,
  terminateInteractiveWerseeSession,
} from '../lib/authSessionCleanup';
import { recoverSupabaseSession } from '../lib/authSessionRecovery';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refreshAuth: () => Promise<Session | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  refreshAuth: async () => null,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastSideEffectUserRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<Session | null> | null>(null);

  const scheduleSignedInSideEffects = useCallback((nextSession: Session | null) => {
    const userId = nextSession?.user.id;
    if (!userId || lastSideEffectUserRef.current === userId) return;
    lastSideEffectUserRef.current = userId;

    // Supabase callbacks must stay synchronous. Deferring prevents auth-client
    // deadlocks when these helpers make their own Supabase requests.
    window.setTimeout(() => {
      void Promise.allSettled([
        trackCurrentAuthDevice(),
        connectCreatorAttribution(),
      ]);
    }, 0);
  }, []);

  const applySession = useCallback((nextSession: Session | null) => {
    const effectiveSession = nextSession && !isAuthEmail2faPending() ? nextSession : null;
    setSession((previous) => (
      previous?.access_token === effectiveSession?.access_token ? previous : effectiveSession
    ));
    setUser((previous) => (
      previous?.id === effectiveSession?.user.id ? previous : effectiveSession?.user ?? null
    ));

    if (effectiveSession) {
      scheduleSignedInSideEffects(effectiveSession);
    } else if (!nextSession) {
      lastSideEffectUserRef.current = null;
    }

    return effectiveSession;
  }, [scheduleSignedInSideEffects]);

  const refreshAuth = useCallback(async () => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const recovery = recoverSupabaseSession(supabase, {
      clearStoredSession: () => {
        clearSupabaseBrowserAuthStorage();
        clearClientAuthArtifacts();
        // auth-js deliberately leaves a failed implicit callback hash intact.
        // Remove it so a refresh cannot replay the same rejected token forever.
        clearImplicitAuthCallbackHash();
      },
    })
      .then(applySession)
      .catch(() => {
        applySession(null);
        return null;
      })
      .finally(() => {
        refreshPromiseRef.current = null;
      });

    refreshPromiseRef.current = recovery;
    return recovery;
  }, [applySession]);

  useEffect(() => {
    let active = true;

    void refreshAuth().finally(() => {
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // The initial stored value is validated by refreshAuth before any page
      // query is allowed to mount.
      if (event === 'INITIAL_SESSION') return;
      applySession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [applySession, refreshAuth]);

  const signOut = async () => {
    const currentUser = user;
    applySession(null);
    const microsoftLogoutUrl = await terminateInteractiveWerseeSession(supabase, currentUser);
    if (microsoftLogoutUrl) {
      window.location.replace(microsoftLogoutUrl);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, refreshAuth, signOut }}>
      {loading ? (
        <div
          role="status"
          aria-label="Loading Wersee"
          className="min-h-[100dvh] bg-[#07070a]"
        />
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
