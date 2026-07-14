import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { isAuthEmail2faPending, supabase, trackCurrentAuthDevice } from '../lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ session: null, user: null, loading: true, signOut: async () => {} });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const effectiveSession = session && !isAuthEmail2faPending() ? session : null;
      setSession(effectiveSession);
      setUser(effectiveSession?.user ?? null);
      setLoading(false);
      if (effectiveSession) {
        void trackCurrentAuthDevice();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const effectiveSession = session && !isAuthEmail2faPending() ? session : null;
      setSession(prev => {
        if (prev?.access_token === effectiveSession?.access_token) return prev;
        return effectiveSession;
      });
      setUser(prev => {
        if (prev?.id === effectiveSession?.user?.id) return prev;
        return effectiveSession?.user ?? null;
      });
      if (event === 'SIGNED_IN' && effectiveSession) {
        void trackCurrentAuthDevice();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
