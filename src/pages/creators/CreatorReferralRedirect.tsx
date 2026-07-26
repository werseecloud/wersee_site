import { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { normalizeCreatorUsername } from '../../lib/creatorGrowth';
import { supabaseUrl } from '../../lib/supabase';

export default function CreatorReferralRedirect() {
  const { username = '', slug } = useParams();
  const location = useLocation();
  const normalizedUsername = normalizeCreatorUsername(username);

  useEffect(() => {
    if (!normalizedUsername || !supabaseUrl) return;
    const path = [normalizedUsername, slug].filter(Boolean).map(encodeURIComponent).join('/');
    window.location.replace(`${supabaseUrl.replace(/\/+$/, '')}/functions/v1/creator-referral/${path}${location.search}`);
  }, [location.search, normalizedUsername, slug]);

  if (!normalizedUsername || !supabaseUrl) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-black px-6 text-center text-white">
      <Loader2 className="h-7 w-7 animate-spin text-orange-300" />
      <p className="text-sm text-white/45">Je creatorlink wordt geopend…</p>
    </div>
  );
}
