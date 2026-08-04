import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, Shield, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react';
import { SEO } from '../components/SEO';

type AuthorizationDetailsResponse = Awaited<
  ReturnType<typeof supabase.auth.oauth.getAuthorizationDetails>
>['data'];

type AuthorizationDetails = Extract<
  NonNullable<AuthorizationDetailsResponse>,
  { authorization_id: string }
>;

const scopeDescriptions: Record<string, string> = {
  openid: 'Confirm your Wersee identity.',
  email: 'Read the email address linked to your Wersee account.',
  phone: 'Read the phone number linked to your Wersee account.',
  profile: 'Read your basic Wersee profile information.',
  offline_access: 'Stay connected when you are not actively using the application.',
};

export const OAuthConsent = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const authorizationId = searchParams.get('authorization_id');
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [signInPath, setSignInPath] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAuthDetails() {
      if (!authorizationId) {
        if (!cancelled) {
          setError('This authorization request is missing its authorization ID.');
          setLoading(false);
        }
        return;
      }

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) {
          const consentPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
          if (!cancelled) setSignInPath(`/auth?redirect=${encodeURIComponent(consentPath)}`);
          return;
        }

        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!userData.user) {
          const consentPath = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
          if (!cancelled) setSignInPath(`/auth?redirect=${encodeURIComponent(consentPath)}`);
          return;
        }

        const { data, error: authorizationError } =
          await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

        if (authorizationError) throw authorizationError;
        if (!data) throw new Error('The authorization request could not be found.');

        // Supabase skips the consent screen when these scopes were already granted.
        if (!('authorization_id' in data)) {
          window.location.assign(data.redirect_url);
          return;
        }

        if (!cancelled) setAuthDetails(data);
      } catch (err: unknown) {
        console.error('Error fetching auth details:', err);
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load authorization details');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAuthDetails();

    return () => {
      cancelled = true;
    };
  }, [authorizationId, navigate]);

  async function handleApprove() {
    if (!authorizationId) return;
    setProcessing(true);
    
    try {
      const { data, error } = await supabase.auth.oauth.approveAuthorization(
        authorizationId,
        { skipBrowserRedirect: true },
      );
      
      if (error) throw error;
      if (!data?.redirect_url) throw new Error('Supabase did not return a redirect URL.');

      window.location.assign(data.redirect_url);
    } catch (err: unknown) {
      console.error('Error approving authorization:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve authorization');
      setProcessing(false);
    }
  }

  async function handleDeny() {
    if (!authorizationId) return;
    setProcessing(true);
    
    try {
      const { data, error } = await supabase.auth.oauth.denyAuthorization(
        authorizationId,
        { skipBrowserRedirect: true },
      );
      
      if (error) throw error;
      if (!data?.redirect_url) throw new Error('Supabase did not return a redirect URL.');

      window.location.assign(data.redirect_url);
    } catch (err: unknown) {
      console.error('Error denying authorization:', err);
      setError(err instanceof Error ? err.message : 'Failed to deny authorization');
      setProcessing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D1D1F]" />
          <p className="text-gray-500 font-medium">Loading authorization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1D1D1F] mb-2">Authorization Error</h2>
          <p className="text-gray-500 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="w-full py-3 bg-[#1D1D1F] text-white rounded-xl font-bold hover:bg-black/90 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (signInPath) {
    return (
      <>
        <SEO title="Connect account" noIndex />
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-[#1D1D1F] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 mb-3">Wersee OAuth</p>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1D1D1F] mb-3">Continue with Wersee account</h1>
            <p className="text-gray-500 text-sm leading-6 mb-8">
              Sign in to choose exactly what ChatGPT or another MCP client may use. Your Wersee password is never shared with the client.
            </p>
            <button
              onClick={() => navigate(signInPath)}
              className="w-full py-4 bg-[#1D1D1F] text-white rounded-2xl font-bold hover:bg-black/90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Continue with Wersee account
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={() => navigate('/')} className="mt-4 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!authDetails) return null;

  return (
    <>
    <SEO title="Authorization" noIndex />
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7] p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1D1D1F] text-white p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Continue with Wersee account</h1>
            <p className="text-white/60 text-sm">Connect your account securely with Wersee OAuth</p>
          </div>
          
          {/* Decorative background */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 mix-blend-overlay"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-lg text-[#1D1D1F] mb-2">
              <span className="font-bold">{authDetails.client.name}</span> wants to access your account.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500 font-mono">
              {authDetails.redirect_uri}
            </div>
          </div>

          {authDetails.scope && authDetails.scope.trim() && (
            <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Requested Permissions</h3>
              <ul className="space-y-3">
                {authDetails.scope.split(/\s+/).filter(Boolean).map((scopeItem) => (
                  <li key={scopeItem} className="flex items-start gap-3 text-[#1D1D1F]">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <span>
                      <span className="block font-semibold">{scopeItem}</span>
                      <span className="block text-sm text-gray-500">
                        {scopeDescriptions[scopeItem] || 'Allow this application to use this requested permission.'}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-3">
            <button 
              onClick={handleApprove}
              disabled={processing}
              className="w-full py-4 bg-[#1D1D1F] text-white rounded-2xl font-bold hover:bg-black/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue with Wersee account'}
            </button>
            <button 
              onClick={handleDeny}
              disabled={processing}
              className="w-full py-4 bg-white border border-gray-200 text-[#1D1D1F] rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-400 mt-6">
            You can revoke this access at any time in your profile settings.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};
