import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { clearStoredStripeAccount, getOrCreateTeamChat, isStripeAccountInaccessibleError, supabase, invokeApiRunner } from '../../lib/supabase';
import { SellerOverview, SellerFinances, SellerCommunity, SellerOrders, SellerJobs } from './SellerViews';
import { SellerListings } from './SellerListings';
import { BuyerOverview, BuyerLibrary } from './BuyerViews';
import { WebshopBuilder } from './WebshopBuilder';
import { WorkspaceLayout } from '../workspace/WorkspaceLayout';
import { WorkspaceHome } from '../workspace/WorkspaceHome';
import { CommunityView } from '../workspace/CommunityView';
import { WorkspaceChats } from '../workspace/WorkspaceChats';
import { WorkspaceCreateBusinessWizard } from '../workspace/WorkspaceCreateBusinessWizard';
import { ManageProductsView } from '../workspace/ManageProductsView';
import { PlansManagementView } from '../workspace/PlansManagementView';
import { SiteEditorView } from '../workspace/SiteEditorView';
import { CreditCard, ShieldCheck, DollarSign, Zap } from 'lucide-react';
import { ProductEditor } from '../workspace/ProductEditor';
import { CommunityEditor } from '../workspace/CommunityEditor';
import { AccessContent } from '../workspace/AccessContent';
import { ManagementLayout } from '../workspace/ManagementLayout';
import { MoneyLayout } from '../workspace/MoneyLayout';
import { MoneySetupView } from '../workspace/MoneySetupView';
import { MoneyMethodsView } from '../workspace/MoneyMethodsView';
import { MoneyBalanceView } from '../workspace/MoneyBalanceView';
import { MoneyPaymentLinksView } from '../workspace/MoneyPaymentLinksView';
import { MoneyCryptoView } from '../workspace/MoneyCryptoView';
import { MoneyInvoicesView } from '../workspace/MoneyInvoicesView';
import { MoneyTaxesView } from '../workspace/MoneyTaxesView';
import { MoneySubscriptionsView } from '../workspace/MoneySubscriptionsView';
import { MoneyPosView } from '../workspace/MoneyPosView';
import { MoneyPayoutsView } from '../workspace/MoneyPayoutsView';
import { MoneyPointsView } from '../workspace/MoneyPointsView';
import { AfterpayApplyView } from '../workspace/AfterpayApplyView';
import { MoneyInsightsView } from '../workspace/MoneyInsightsView';
import { MoneyCouponsView } from '../workspace/MoneyCouponsView';
import { JoinedProductsView } from '../workspace/JoinedProductsView';
import { AnalyticsView } from '../workspace/AnalyticsView';
import { StoreHealthView } from '../workspace/StoreHealthView';
import { FundingView } from '../workspace/FundingView';
import { AffiliatesView } from '../workspace/AffiliatesView';
import { AutomationsView } from '../workspace/AutomationsView';
import { EmailSender } from '../workspace/EmailSender';
import { WorkspaceCreateCommunityWizard } from '../workspace/WorkspaceCreateCommunityWizard';
import { WorkspaceProductBuilder } from '../workspace/WorkspaceProductBuilder';
import { CustomAppsView } from '../workspace/CustomAppsView';
import { DeveloperView } from '../workspace/DeveloperView';
import { PlansView } from '../workspace/PlansView';
import { SplitsView } from './SplitsView';
import { TeamManagementView } from './TeamManagementView';
import { AdsManager } from '../workspace/AdsManager';
import { WorkspaceHelpCenter } from '../workspace/WorkspaceHelpCenter';
import { StorageView } from '../workspace/StorageView';
import { WerseeCoursePlayer } from '../workspace/WerseeCoursePlayer';
import { NotificationsView } from '../workspace/NotificationsView';

import { AnnouncementsView } from '../workspace/AnnouncementsView';
import { JobsView } from '../workspace/JobsView';
import { BusinessJobsView } from '../workspace/BusinessJobsView';
import { ApplyFlowBuilder } from '../workspace/ApplyFlowBuilder';
import { ApplicationDetailView } from '../workspace/ApplicationDetailView';
import { BusinessDashboard } from './BusinessDashboard';
import { CommunitiesListView } from '../workspace/CommunitiesListView';
import { EarlyAccessView } from '../workspace/EarlyAccessView';
import { AccountSettingsView } from '../workspace/AccountSettingsView';
import { JobApplicationsView } from '../workspace/JobApplicationsView';
import { CrmView } from '../workspace/CrmView';
import { MoneyContractsView } from '../workspace/MoneyContractsView';
import { MoneyInvestView } from '../workspace/MoneyInvestView';
import MoneyInvestmentsView from '../workspace/money/MoneyInvestmentsView';
import { SellFirstMarketplaceView } from '../workspace/SellFirstMarketplaceView';
import { MarketplaceComplianceAdminView } from '../workspace/MarketplaceComplianceAdminView';
import { ProposalsView } from '../workspace/ProposalsView';
import { ReviewsSupportView } from '../workspace/ReviewsSupportView';
import { InternalNotesView } from '../workspace/InternalNotesView';
import { WebsitesBuilderView } from '../workspace/WebsitesBuilderView';
import { FunnelsBuilderView } from '../workspace/FunnelsBuilderView';
import { ABTestingView } from '../workspace/ABTestingView';
import { GiveawaysView } from '../workspace/GiveawaysView';
import { PartnershipsView } from '../workspace/PartnershipsView';
import { FormsManagementView } from '../workspace/FormsManagementView';
import { TermsCreatorView } from '../workspace/TermsCreatorView';
import { ComplianceView } from '../workspace/ComplianceView';
import { PortalManagementView } from '../workspace/PortalManagementView';
import { CallsManagementView } from '../workspace/CallsManagementView';
import { SafetyLegalView } from '../workspace/SafetyLegalView';
import { GuardianControlsView } from '../workspace/GuardianControlsView';
import { useListingWizard } from '../../context/ListingWizardContext';

import { LeadScraper } from '../workspace/LeadScraper';

const ProductWizardTrigger = ({ onDone }: { onDone: () => void }) => {
  const { openWizard } = useListingWizard();
  React.useEffect(() => {
    openWizard('product');
    onDone();
  }, []);
  return null;
};

import { Investments } from '../../pages/Investments';
import { Portfolio } from '../../pages/Portfolio';

interface WorkspaceViewProps {
  onNavigate: (tab: string) => void;
  initialView?: string;
  businessId?: string;
  listingId?: string;
  user: any;
}

export const WorkspaceView: React.FC<WorkspaceViewProps> = ({ onNavigate, initialView, businessId, listingId, user }) => {
  const [searchParams] = useSearchParams();
  const [activeView, setActiveView] = useState(initialView || 'home');
  const [isStripeComplete, setIsStripeComplete] = useState(false);

  // Load last active tab on mount
  React.useEffect(() => {
    const loadLastTab = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('last_active_tab')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data?.last_active_tab && !initialView) {
        setActiveView(data.last_active_tab);
      }
    };
    loadLastTab();
  }, [user, initialView]);

  React.useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  React.useEffect(() => {
    const checkStripe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const savedAccountId = localStorage.getItem(`stripe_account_id_${user.id}`);
        if (savedAccountId) {
          try {
            const data = await invokeApiRunner('stripe-account-get', { id: savedAccountId });
            const reqs = data?.requirements;
            if (data.payouts_enabled && data.charges_enabled && (!reqs?.currently_due || reqs.currently_due.length === 0)) {
              setIsStripeComplete(true);
            }
          } catch (err: any) {
            console.error(err);
            if (isStripeAccountInaccessibleError(err)) {
              await clearStoredStripeAccount(user.id);
              setIsStripeComplete(false);
            }
          }
        }
      }
    };
    checkStripe();
  }, []);

  React.useEffect(() => {
    const syncTeamChats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch teams the user is in
      const { data: teamMembers } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id);
        
      if (teamMembers && teamMembers.length > 0) {
        // Call RPC for each team to ensure chat and participation exists
        // This is idempotent and ensures the user sees their team chats
        try {
          await Promise.all(teamMembers.map(tm => 
            getOrCreateTeamChat(tm.team_id)
          ));
        } catch (err) {
          console.error('Error syncing team chats:', err);
        }
      }
    };
    
    syncTeamChats();
  }, []);

  const renderContent = () => {
    if (activeView === 'home' || activeView === 'overview') {
      if (businessId) {
        return <BusinessDashboard businessId={businessId} onNavigate={handleSetActiveView} />;
      }
      return <WorkspaceHome onNavigate={handleSetActiveView} />;
    }
    
    if (activeView === 'chats') {
      return <WorkspaceChats />;
    }

    if (activeView === 'notifications') {
      return <NotificationsView user={user} />;
    }

    if (activeView === 'announcements') {
      return <AnnouncementsView user={user} />;
    }

    if (activeView === 'jobs') {
      return <JobsView user={user} />;
    }

    if (activeView === 'applications') {
      return <JobApplicationsView />;
    }

    if (activeView === 'leads') {
      return <LeadScraper />;
    }

    if (activeView === 'plans') {
      return <PlansView />;
    }

    if (activeView === 'create-business') {
      return <WorkspaceCreateBusinessWizard onClose={() => handleSetActiveView('home')} />;
    }

    if (activeView === 'create-listing') {
      const type = searchParams.get('type') || 'physical';
      return <WorkspaceProductBuilder initialType={type} onClose={() => handleSetActiveView('management-products')} />;
    }

    if (activeView === 'create-product') {
      return <ProductWizardTrigger onDone={() => handleSetActiveView('management-products')} />;
    }

    if (activeView === 'create-community') {
      return <WorkspaceCreateCommunityWizard onClose={() => handleSetActiveView('home')} />;
    }

    if (activeView === 'storage') {
      return <StorageView />;
    }

    if (activeView.startsWith('course-player_')) {
      const courseId = activeView.replace('course-player_', '');
      return <WerseeCoursePlayer courseId={courseId} onBack={() => handleSetActiveView('home')} />;
    }

    if (activeView === 'management-jobs') {
      return (
        <ManagementLayout activeView={activeView} onNavigate={handleSetActiveView} businessId={businessId}>
          <BusinessJobsView user={user} onNavigate={handleSetActiveView} />
        </ManagementLayout>
      );
    }

    if (activeView.startsWith('apply-flow_')) {
      const jobId = activeView.replace('apply-flow_', '');
      return (
        <ManagementLayout activeView="management-jobs" onNavigate={handleSetActiveView} businessId={businessId}>
          <ApplyFlowBuilder jobId={jobId} user={user} onBack={() => handleSetActiveView('management-jobs')} />
        </ManagementLayout>
      );
    }

    if (activeView.startsWith('application_')) {
      const applicationId = activeView.replace('application_', '');
      return (
        <ManagementLayout activeView="management-jobs" onNavigate={handleSetActiveView} businessId={businessId}>
          <ApplicationDetailView applicationId={applicationId} user={user} onBack={() => handleSetActiveView('management-jobs')} />
        </ManagementLayout>
      );
    }

    if (activeView === 'management-webshop') {
      return <WebshopBuilder user={user} />;
    }

    if (activeView === 'management-listings') {
      return <SellerListings user={user} />;
    }

    if (activeView === 'buyer-library') {
      return <BuyerLibrary user={user} />;
    }

    if (activeView === 'community-home') {
      return <SellerCommunity user={user} />;
    }

    if (activeView.startsWith('management-')) {
      return (
        <ManagementLayout activeView={activeView} onNavigate={handleSetActiveView} businessId={businessId}>
          {activeView === 'management-orders' && <SellerOrders user={user} />}
          {activeView === 'management-marketplace' && <MarketplaceComplianceAdminView />}
          {activeView === 'management-products' && (
            <ManageProductsView 
              onEdit={(id) => {
                if (id.startsWith('create')) {
                  handleSetActiveView(id.replace('create', 'create-listing'));
                } else {
                  handleSetActiveView(`edit-product_${id}`);
                }
              }} 
            />
          )}
          {activeView === 'management-reviews' && <ReviewsSupportView />}
          {activeView === 'management-terms' && <TermsCreatorView />}
          {activeView === 'management-legal' && <ComplianceView />}
          {activeView === 'management-crm' && (
            <CrmView listingId={listingId} />
          )}
          {activeView === 'management-plans' && (
            <PlansManagementView />
          )}
          {activeView === 'management-site-editor' && (
            <SiteEditorView />
          )}
          {activeView === 'management-funding' && <FundingView businessId={businessId || ''} />}
          {activeView === 'management-analytics' && <AnalyticsView />}
          {activeView === 'management-store-health' && <StoreHealthView />}
          {activeView === 'management-team' && (
            <TeamManagementView />
          )}
          {activeView === 'management-affiliates' && <AffiliatesView />}
          {activeView === 'management-apps' && <CustomAppsView businessId={businessId} />}
          {activeView === 'management-automations' && <AutomationsView />}
          {activeView === 'management-emails' && <EmailSender />}
          {activeView === 'management-ads' && <AdsManager />}
          {activeView === 'management-developer' && <DeveloperView />}
          {activeView === 'management-notes' && <InternalNotesView />}
          {activeView === 'management-portal' && <PortalManagementView />}
          {activeView === 'management-calls' && <CallsManagementView />}
          {activeView === 'management-guardian' && <GuardianControlsView />}
          {activeView === 'management-websites' && <WebsitesBuilderView />}
          {activeView === 'management-funnels' && <FunnelsBuilderView />}
          {activeView === 'management-ab-testing' && <ABTestingView />}
          {activeView === 'management-giveaways' && <GiveawaysView />}
          {activeView === 'management-partnerships' && <PartnershipsView />}
          {activeView === 'management-forms' && <FormsManagementView />}
          {activeView === 'management-workflows' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                <Zap className="w-8 h-8 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white">Workflows</h2>
              <p className="text-gray-400 max-w-md">Automate your business with custom workflows. This feature is coming soon.</p>
            </div>
          )}
        </ManagementLayout>
      );
    }

    if (activeView.startsWith('edit-product_')) {
      const productId = activeView.replace('edit-product_', '');
      return <WorkspaceProductBuilder initialProductId={productId} onClose={() => handleSetActiveView('management-products')} />;
    }

    if (activeView.startsWith('edit-community_')) {
      const communityId = activeView.replace('edit-community_', '');
      return <CommunityEditor communityId={communityId} onClose={() => handleSetActiveView('home')} />;
    }
    
    if (activeView.startsWith('community_')) {
      const communityId = activeView.replace('community_', '');
      return <CommunityView communityId={communityId} isOwner={true} onEdit={() => handleSetActiveView(`edit-community_${communityId}`)} />; 
    }

    if (activeView === 'communities') {
      return <CommunitiesListView onNavigate={handleSetActiveView} />;
    }

    if (activeView === 'joined-products') {
      return <JoinedProductsView onNavigate={handleSetActiveView} />;
    }

    if (activeView.startsWith('access_') || activeView.startsWith('product_')) {
      const listingId = activeView.replace('access_', '').replace('product_', '');
      return <AccessContent listingId={listingId} onClose={() => handleSetActiveView('home')} />;
    }

    if (activeView.startsWith('money-')) {
      return (
        <MoneyLayout activeView={activeView} onNavigate={handleSetActiveView} isStripeComplete={isStripeComplete} businessId={businessId}>
          {activeView === 'money-setup' ? (
            <MoneySetupView onNavigate={handleSetActiveView} />
          ) : activeView === 'money-methods' ? (
            <MoneyMethodsView />
          ) : activeView === 'money-balance' ? (
            <MoneyBalanceView />
          ) : activeView === 'money-points' ? (
            <MoneyPointsView />
          ) : activeView === 'money-links' ? (
            <MoneyPaymentLinksView />
          ) : activeView === 'money-splits' ? (
            <SplitsView />
          ) : activeView === 'money-crypto' ? (
            <MoneyCryptoView />
          ) : activeView === 'money-invoices' ? (
            <MoneyInvoicesView />
          ) : activeView === 'money-subscriptions' ? (
            <MoneySubscriptionsView />
          ) : activeView === 'money-payouts' ? (
            <MoneyPayoutsView />
          ) : activeView === 'money-insights' ? (
            <MoneyInsightsView />
          ) : activeView === 'money-coupons' ? (
            <MoneyCouponsView />
          ) : activeView === 'money-pos' ? (
            <MoneyPosView isStripeComplete={isStripeComplete} />
          ) : activeView === 'money-taxes' ? (
            <MoneyTaxesView />
          ) : activeView === 'money-afterpay' ? (
            <AfterpayApplyView />
          ) : activeView === 'money-proposals' ? (
            <ProposalsView />
          ) : activeView === 'money-contracts' ? (
            <MoneyContractsView />
          ) : activeView === 'money-invest' ? (
            <MoneyInvestView />
          ) : activeView === 'money-investments' ? (
            <MoneyInvestmentsView />
          ) : activeView === 'money-seller' ? (
            <SellFirstMarketplaceView />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold text-white capitalize">{activeView.replace('money-', '').replace('-', ' ')}</h2>
              <p className="text-gray-400 max-w-md">Manage your {activeView.replace('money-', '').replace('-', ' ')} here.</p>
            </div>
          )}
        </MoneyLayout>
      );
    }

    if (activeView === 'safety-legal' || activeView === 'safety-support' || activeView === 'management-legal' || activeView === 'help') {
      return <SafetyLegalView />;
    }

    if (activeView === 'release') {
      return <EarlyAccessView />;
    }

    if (activeView === 'profile') {
      return <AccountSettingsView />;
    }

    if (activeView === 'investments') {
      return <Investments isWorkspace={true} />;
    }

    if (activeView === 'portfolio') {
      return <Portfolio isWorkspace={true} />;
    }

    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>View not implemented yet: {activeView}</p>
      </div>
    );
  };

  const handleSetActiveView = async (view: string) => {
    setActiveView(view);
    onNavigate(view);
    
    // Save last active tab to Supabase
    if (user) {
      await supabase
        .from('profiles')
        .update({ last_active_tab: view })
        .eq('id', user.id);
    }
  };

  const getLayoutKey = (view: string) => {
    if (view.startsWith('money-')) return 'money';
    if (view.startsWith('management-') && view !== 'management-webshop' && view !== 'management-listings') return 'management';
    return view;
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={getLayoutKey(activeView)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex-1 flex flex-col min-h-0 h-full"
      >
        {renderContent()}
      </motion.div>
    </AnimatePresence>
  );
};

