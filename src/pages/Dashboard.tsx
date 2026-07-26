import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { WorkspaceView } from '../components/dashboard/WorkspaceView';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';
import {
  parseAccountHandle,
  parseUsernameRouteValue,
  parseUsername,
  routes,
  usernameFromAccountHandle,
} from '../routing/routes';

// --- Main Dashboard Page ---

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { pageName, accountHandle } = params;
  const restPath = params['*'];
  const authUsername = parseUsername(user?.email?.split('@')[0]);
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [activeView, setActiveView] = useState('home');
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [listingId, setListingId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);
  const [resolvedAccountHandle, setResolvedAccountHandle] = useState<string | null>(null);
  const [accountResolution, setAccountResolution] = useState<
    'idle' | 'loading' | 'resolved' | 'not-found' | 'error'
  >('idle');

  const knownPages = [
    'home', 'overview', 'chats', 'notifications', 'announcements', 'jobs', 'applications', 
    'plans', 'create-business', 'create-community', 'create-product', 'storage', 'management-orders', 
    'management-jobs', 'management-webshop', 'management-listings', 'management-crm', 'buyer-library', 
    'community-home', 'communities', 'joined-products', 'safety-legal', 'safety-support', 'help', 
    'early-access', 'profile', 'money-setup', 'money-methods', 'money-balance', 
    'money-points', 'money-payouts', 'money-splits', 'money-links', 'money-subscriptions', 
    'money-coupons', 'money-taxes', 'money-afterpay', 'money-insights', 'money-invoices', 
    'money-pos', 'money-crypto', 'money-proposals', 'money-contracts', 'money-invest', 'money-investments', 'money-seller', 'management-products', 'management-plans', 'management-sites', 'management-site-editor', 'management-terms',
    'management-analytics', 'management-team', 'management-affiliates', 'management-apps', 'management-legal',
    'management-automations', 'management-emails', 'management-ads', 'management-developer', 'management-marketplace', 'management-store-health', 'create-listing',
    'management-notes', 'management-websites', 'management-funnels', 'management-ab-testing', 'management-giveaways', 'management-partnerships',
    'management-reviews', 'management-funding', 'management-workflows', 'management-forms', 'investments', 'portfolio', 'management-portal', 'leads', 'management-calls', 'management-guardian',
    'passkeys', 'security', 'account', 'account-settings', 'settings'
  ];

  const tabMap: Record<string, string> = {
    'store-health': 'management-store-health',
    'finances': 'money-balance',
    'finance': 'money-balance',
    'seller': 'money-seller',
    'sell': 'money-seller',
    'marketplace-seller': 'money-seller',
    'marketplace-compliance': 'management-marketplace',
    'trust': 'management-legal',
    'trust-operations': 'management-marketplace',
    'listings': 'management-products',
    'orders': 'management-orders',
    'jobs': 'jobs',
    'community': 'communities',
    'announcements': 'announcements',
    'settings': 'profile',
    'library': 'joined-products',
    'applications': 'applications',
    'webshop': 'management-sites',
    'splits': 'money-splits',
    'affiliates': 'management-affiliates',
    'overview': 'home',
    'calls': 'management-calls',
    'money/investments': 'money-investments',
    'finance/investments': 'money-investments',
    'account': 'profile',
    'account-settings': 'profile',
    'security': 'settings-security',
    'passkeys': 'settings-passkeys',
    'accessibility': 'settings-accessibility',
  };

  const parseWorkspaceTarget = (view: string) => {
    const [routeView, rawQuery = ''] = view.split('?', 2);
    return {
      view: routeView || 'home',
      search: rawQuery ? `?${rawQuery}` : '',
    };
  };

  const parseSafeAccountHandle = (value: string) => {
    try {
      return parseAccountHandle(value);
    } catch {
      return null;
    }
  };

  // Handle last_workspace_page memory and username fetch
  useEffect(() => {
    if (!user) {
      setAccountResolution(accountHandle ? 'loading' : 'idle');
      setResolvedAccountHandle(null);
      return;
    }

    let cancelled = false;
    setAccountResolution('loading');
    setResolvedAccountHandle(null);

    const handleWorkspacePage = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, last_workspace_page, username')
          .eq('id', user.id)
          .single();
        if (error) throw error;
        if (cancelled) return;

        const currentUsername = parseUsername(data?.username || '') || authUsername;
        if (!currentUsername) {
          throw new Error('The authenticated profile has no valid username.');
        }
        setProfileUsername(currentUsername);

        if (accountHandle) {
          const parsedAccountHandle = parseSafeAccountHandle(accountHandle);
          const requestedUsername = parsedAccountHandle
            ? usernameFromAccountHandle(parsedAccountHandle)
            : parseUsernameRouteValue(accountHandle);

          if (!requestedUsername) {
            setAccountResolution('not-found');
            return;
          }

          if (requestedUsername !== currentUsername) {
            const { data: requestedAccount, error: requestedAccountError } = await supabase
              .from('profiles')
              .select('id, username')
              .eq('username', requestedUsername)
              .maybeSingle();
            if (requestedAccountError) throw requestedAccountError;
            if (cancelled) return;

            // Workspaces are scoped to the authenticated profile. Never render
            // the current user's cached workspace under another account URL.
            if (!requestedAccount || requestedAccount.id !== user.id) {
              setAccountResolution('not-found');
              return;
            }
          }

          setResolvedAccountHandle(accountHandle);
        }

        const isRootWorkspace = !params.pageName && !restPath;
        const hasWorkspaceQueryTarget =
          searchParams.has('tab') || searchParams.has('view') || searchParams.has('page');
        const lastPage = data?.last_workspace_page || 'overview';

        if (isRootWorkspace && !hasWorkspaceQueryTarget) {
          // If accessing root workspace, redirect to last visited page with personal link
          navigate(routes.userWorkspacePage({
            username: currentUsername,
            pageName: lastPage,
          }), { replace: true });
        } else if (pageName && pageName !== lastPage) {
          // If accessing a specific page, save it as the last visited page
          await supabase
            .from('profiles')
            .update({ last_workspace_page: pageName })
            .eq('id', user.id);
        }
        if (!cancelled) setAccountResolution('resolved');
      } catch (err) {
        console.error('Error handling workspace page memory:', err);
        if (!cancelled) setAccountResolution('error');
      }
    };

    handleWorkspacePage();
    return () => {
      cancelled = true;
    };
  }, [user, accountHandle, params.pageName, restPath, pageName, navigate, searchParams, authUsername]);

  useEffect(() => {
    if ((pageName === 'money' || pageName === 'finance') && restPath === 'investments') {
      setActiveView('money-investments');
      setBusinessId(undefined);
      setListingId(undefined);
    } else if ((pageName === 'settings' || pageName === 'account' || pageName === 'account-settings') && restPath) {
      const settingsTab = restPath.split('/')[0];
      setActiveView(settingsTab ? `settings-${settingsTab}` : 'profile');
      setBusinessId(undefined);
      setListingId(undefined);
  } else if (pageName) {
      const normalizedPageName = parseWorkspaceTarget(pageName).view;
      const mappedView = tabMap[normalizedPageName];
      if (mappedView) {
        setActiveView(mappedView);
        setBusinessId(undefined);
      } else if (normalizedPageName === 'management-crm' && restPath) {
        setActiveView('management-crm');
        setBusinessId(undefined);
        setListingId(restPath.replace(/^\//, ''));
      } else if (knownPages.includes(normalizedPageName)) {
        setActiveView(normalizedPageName);
        setBusinessId(undefined);
        setListingId(undefined);
      } else if (normalizedPageName.startsWith('apply-flow_') || normalizedPageName.startsWith('edit-product_') || normalizedPageName.startsWith('edit-community_') || normalizedPageName.startsWith('community_') || normalizedPageName.startsWith('access_') || normalizedPageName.startsWith('product_') || normalizedPageName.startsWith('course-player_')) {
        setActiveView(normalizedPageName);
        setBusinessId(undefined);
        setListingId(undefined);
      } else {
        // If pageName is not a known page, assume it's a business ID
        setActiveView('home');
        setBusinessId(normalizedPageName);
        setListingId(undefined);
      }
    } else {
      const tab = searchParams.get('tab');
      const view = searchParams.get('view');
      const page = searchParams.get('page');
      
      const initialPage = page || view || (tab === 'overview' ? 'home' : tab) || 'home';
      setActiveView(initialPage);
      setBusinessId(undefined);
    }
  }, [searchParams, pageName, restPath]);

  const handleViewChange = (view: string) => {
    const { view: targetView, search } = parseWorkspaceTarget(view);
    const pageSlugByView: Record<string, string> = {
      'management-store-health': 'store-health',
    };
    const nextPageName = pageSlugByView[targetView] || targetView;
    const resolvedUsername = parseUsernameRouteValue(resolvedAccountHandle || '');
    const parsedAccountHandleForRoute = parseSafeAccountHandle(resolvedAccountHandle || '');

    if (resolvedAccountHandle && resolvedAccountHandle === accountHandle && parsedAccountHandleForRoute) {
      navigate({
        pathname: routes.accountWorkspacePage({
          accountHandle: parsedAccountHandleForRoute,
          pageName: nextPageName,
        }),
        search,
      });
      return;
    }

    const username = parseUsername(profileUsername || '') || authUsername;
    const finalUsername = resolvedUsername || username;
    if (finalUsername) {
      navigate({
        pathname: routes.userWorkspacePage({ username: finalUsername, pageName: nextPageName }),
        search,
      });
    }
  };

  useEffect(() => {
    if (!user) {
      const redirectPath = `${location.pathname}${location.search}${location.hash}`;
      navigate(`/auth?redirect=${encodeURIComponent(redirectPath)}`);
      return;
    }
    // Force seller role for now as requested
    setRole('seller');
    setLoading(false);
  }, [user, navigate, location.pathname, location.search, location.hash]);

  const isResolvingAccount =
    Boolean(accountHandle) &&
    resolvedAccountHandle !== accountHandle &&
    accountResolution !== 'not-found' &&
    accountResolution !== 'error';

  if (loading || isResolvingAccount) return <div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

  if (accountResolution === 'not-found') {
    return (
      <div className="min-h-[100dvh] bg-black px-6 text-white flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/40">Workspace</p>
          <h1 className="mt-4 text-3xl font-bold">Account niet gevonden</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">
            Het account {accountHandle ? <strong className="text-white">{accountHandle}</strong> : null} bestaat niet
            of is niet beschikbaar voor deze sessie.
          </p>
          <button
            type="button"
            onClick={() => {
              const username = parseUsername(profileUsername || '') || authUsername;
              if (username) {
                navigate(routes.userWorkspacePage({ username, pageName: 'overview' }));
              }
            }}
            className="mt-7 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/85"
          >
            Naar mijn workspace
          </button>
        </div>
      </div>
    );
  }

  if (accountResolution === 'error') {
    return (
      <div className="min-h-[100dvh] bg-black px-6 text-white flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-3xl font-bold">Account kon niet worden geladen</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">Probeer de pagina opnieuw te laden.</p>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceLayout 
      onNavigate={handleViewChange} 
      activeView={activeView} 
      setActiveView={handleViewChange}
    >
      <WorkspaceView 
        onNavigate={handleViewChange} 
        initialView={activeView} 
        businessId={businessId} 
        listingId={listingId}
        user={user} 
      />
    </WorkspaceLayout>
  );
};
