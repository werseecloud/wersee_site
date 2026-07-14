import { supabase } from '../lib/supabase';

// 👤 GUEST & USER IDENTIFICATION
// Genereert een unieke ID voor gasten en slaat deze op in localStorage.
export const getSessionId = () => {
  let sessionId = localStorage.getItem('wersee_shadow_id');
  if (!sessionId) {
    sessionId = 'anon_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('wersee_shadow_id', sessionId);
  }
  return sessionId;
};

// ⚡ 1. INTERACTION TRACKING (Micro-interactions)
// Trackt alles: clicks, hovers, watch time, purchases.
export const trackInteraction = async (
  listingId: string, 
  eventType: 'impression' | 'click' | 'view' | 'purchase' | 'save' | 'share',
  durationSeconds: number = 0
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    // 1. Sla de interactie op in de database (voor het algoritme)
    await supabase.from('wersee_interactions').insert({
      user_id: user?.id || null,
      session_id: sessionId,
      listing_id: listingId,
      event_type: eventType,
      duration_seconds: durationSeconds
    });

    // 2. Update het Shadow Profile (User Profiling)
    updateShadowProfile(sessionId, user?.id, listingId, eventType);
  } catch (error) {
    console.error('Tracking error:', error);
  }
};

// 🧠 3. USER PROFILING (Shadow Profiles voor Gasten & Users)
const updateShadowProfile = async (sessionId: string, userId: string | undefined | null, listingId: string, eventType: string) => {
  try {
    // Haal categorie op om interesse te bepalen
    const { data: listing } = await supabase.from('listings').select('category').eq('id', listingId).single();
    if (!listing) return;

    // Bepaal de "waarde" van de interactie (Hoe belangrijker, hoe meer punten)
    let points = 0;
    switch(eventType) {
      case 'impression': points = 0.1; break;
      case 'click': points = 1.0; break;
      case 'view': points = 2.0; break; // Dwell time (kijktijd)
      case 'save': points = 3.0; break;
      case 'share': points = 4.0; break; // Viral loop indicator
      case 'purchase': points = 10.0; break; // Conversion (Heilig)
    }

    // Update het profiel in de database via de SQL RPC
    await supabase.rpc('update_shadow_profile_affinity', {
      p_session_id: sessionId,
      p_user_id: userId || null,
      p_category: listing.category,
      p_points: points
    });
  } catch (error) {
    console.error('Shadow profile update error:', error);
  }
};

// 🎯 5. PERSONALIZATION ENGINE (Feed Ophalen)
// Haalt de perfecte mix van listings op voor deze specifieke user.
export const getPersonalizedFeed = async (limit: number = 20) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = getSessionId();

    // Haal de feed op via de SQL RPC (Combineert Global Score + Personal Affinity)
    const { data, error } = await supabase.rpc('get_personalized_feed', {
      p_session_id: sessionId,
      p_user_id: user?.id || null,
      p_limit: limit
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Feed error:', error);
    return [];
  }
};
