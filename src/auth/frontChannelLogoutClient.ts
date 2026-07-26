import { clearClientAuthArtifacts } from '../lib/authSessionCleanup';
import { supabase } from '../lib/supabase';

void (async () => {
  try {
    await supabase.auth.signOut({ scope: 'local' });
  } catch {
    // Microsoft may call this route after the local session has already ended.
  } finally {
    clearClientAuthArtifacts();
  }
})();
