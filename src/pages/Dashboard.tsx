import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { WorkspaceView } from '../components/dashboard/WorkspaceView';
import { WorkspaceLayout } from '../components/workspace/WorkspaceLayout';

// --- Main Dashboard Page ---

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  const { pageName, username: urlUsername } = params;
  const userUsername = user?.email?.split('@')[0] || 'user';
  const cleanUrlUsername = urlUsername?.replace(/^@/, '');
  const [role, setRole] = useState<'buyer' | 'seller' | null>(null);
  const [activeView, setActiveView] = useState('home');
  const [businessId, setBusinessId] = useState<string | undefined>(undefined);
  const [listingId, setListingId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [profileUsername, setProfileUsername] = useState<string | null>(null);

  const knownPages = [
    'home', 'overview', 'chats', 'notifications', 'announcements', 'jobs', 'applications', 
    'plans', 'create-business', 'create-community', 'create-product', 'storage', 'management-orders', 
    'management-jobs', 'management-webshop', 'management-listings', 'management-crm', 'buyer-library', 
    'community-home', 'communities', 'joined-products', 'safety-legal', 'safety-support', 'help', 
    'early-access', 'profile', 'money-setup', 'money-methods', 'money-balance', 
    'money-points', 'money-payouts', 'money-splits', 'money-links', 'money-subscriptions', 
    'money-coupons', 'money-taxes', 'money-afterpay', 'money-insights', 'money-invoices', 
    'money-pos', 'money-crypto', 'money-proposals', 'money-contracts', 'money-invest', 'money-investments', 'money-seller', 'management-products', 'management-plans', 'management-site-editor', 'management-terms',
    'management-analytics', 'management-team', 'management-affiliates', 'management-apps', 'management-legal',
    'management-automations', 'management-emails', 'management-ads', 'management-developer', 'management-marketplace', 'management-store-health', 'create-listing',
    'management-notes', 'management-websites', 'management-funnels', 'management-ab-testing', 'management-giveaways', 'management-partnerships',
    'management-reviews', 'management-funding', 'management-workflows', 'management-forms', 'investments', 'portfolio', 'management-portal', 'leads', 'management-calls', 'management-guardian'
  ];

  const tabMap: Record<string, string> = {
    'finances': 'money-balance',
    'finance': 'money-balance',
    'seller': 'money-seller',
    'sell': 'money-seller',
    'marketplace-seller': 'money-seller',
    'marketplace-compliance': 'management-marketplace',
    'listings': 'management-products',
    'orders': 'management-orders',
    'jobs': 'jobs',
    'community': 'communities',
    'announcements': 'announcements',
    'settings': 'profile',
    'library': 'joined-products',
    'applications': 'applications',
    'webshop': 'management-site-editor',
    'splits': 'money-splits',
    'affiliates': 'management-affiliates',
    'overview': 'home',
    'calls': 'management-calls',
    'money/investments': 'money-investments',
    'finance/investments': 'money-investments',
  };

  // Handle last_workspace_page memory and username fetch
  useEffect(() => {
    if (!user) return;

    const handleWorkspacePage = async () => {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('last_workspace_page, username')
          .eq('id', user.id)
          .single();

        const currentUsername = data?.username || user?.email?.split('@')[0] || 'user';
        setProfileUsername(currentUsername);

        const isRootWorkspace = !params.pageName && !params['*'];
        const lastPage = data?.last_workspace_page || 'overview';

        if (isRootWorkspace) {
          // If accessing root workspace, redirect to last visited page with personal link
          navigate(`/@${currentUsername}/workspace/${lastPage}`, { replace: true });
        } else if (pageName && pageName !== lastPage) {
          // If accessing a specific page, save it as the last visited page
          await supabase
            .from('profiles')
            .update({ last_workspace_page: pageName })
            .eq('id', user.id);
        }
      } catch (err) {
        console.error('Error handling workspace page memory:', err);
      }
    };

    handleWorkspacePage();
  }, [user, params.pageName, params['*'], pageName, navigate]);

  const effectiveUsername = cleanUrlUsername || profileUsername || userUsername;

  // Redirect to own workspace if accessing another user's workspace
  useEffect(() => {
    if (user && profileUsername && cleanUrlUsername && cleanUrlUsername !== profileUsername) {
      // Redirect to own workspace
      const restOfPath = params['*'] ? `/${params['*']}` : '';
      navigate(`/@${profileUsername}/workspace/${params.pageName || 'overview'}${restOfPath}`, { replace: true });
    }
  }, [user, cleanUrlUsername, profileUsername, navigate, params]);

  useEffect(() => {
    if ((pageName === 'money' || pageName === 'finance') && params['*'] === 'investments') {
      setActiveView('money-investments');
      setBusinessId(undefined);
      setListingId(undefined);
    } else if (pageName) {
      const mappedView = tabMap[pageName];
      if (mappedView) {
        setActiveView(mappedView);
        setBusinessId(undefined);
      } else if (pageName === 'management-crm' && params['*']) {
        setActiveView('management-crm');
        setBusinessId(undefined);
        setListingId(params['*'].replace(/^\//, ''));
      } else if (knownPages.includes(pageName.split('?')[0])) {
        setActiveView(pageName.split('?')[0]);
        setBusinessId(undefined);
        setListingId(undefined);
      } else if (pageName.startsWith('apply-flow_') || pageName.startsWith('edit-product_') || pageName.startsWith('edit-community_') || pageName.startsWith('community_') || pageName.startsWith('access_') || pageName.startsWith('product_') || pageName.startsWith('course-player_')) {
        setActiveView(pageName);
        setBusinessId(undefined);
        setListingId(undefined);
      } else {
        // If pageName is not a known page, assume it's a business ID
        setActiveView('home');
        setBusinessId(pageName);
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
  }, [searchParams, pageName]);

  const handleViewChange = (view: string) => {
    navigate(`/@${effectiveUsername}/workspace/${view}`);
  };

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Force seller role for now as requested
    setRole('seller');
    setLoading(false);
  }, [user, navigate]);

  if (loading) return <div className="min-h-[100dvh] flex items-center justify-center bg-black"><div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div></div>;

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
