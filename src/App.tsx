import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NavBar } from './components/NavBar';
import { BottomNav } from './components/BottomNav';
import { SetupBanner } from './components/SetupBanner';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';
import { Auth } from './pages/Auth';
import { ForgotPassword } from './pages/ForgotPassword';
import { UpdatePassword } from './pages/UpdatePassword';
import { AuthCallback } from './pages/AuthCallback';
import { ConfirmEmail } from './pages/ConfirmEmail';
import { OAuthConsent } from './pages/OAuthConsent';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { AmbassadorProgram } from './pages/AmbassadorProgram';
import { Search as SearchPage } from './pages/Search';
import { Profile } from './pages/Profile';
import { Home } from './pages/Home';
import { Announcements } from './pages/Announcements';
import { AnnouncementDetail } from './pages/AnnouncementDetail';
import { ListingDetail } from './pages/ListingDetail';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { SellingTips } from './pages/SellingTips';
import { Blog } from './pages/Blog';
import { Checkout } from './pages/Checkout';
import { AiPlanCheckout } from './pages/AiPlanCheckout';
import { Success } from './pages/Success';
import { AccessContent } from './pages/AccessContent';
import { FreeConfirmation } from './pages/FreeConfirmation';
import { CommunityView } from './pages/CommunityView';
import { DocumentationView } from './pages/DocumentationView';
import { BuyerProtection } from './pages/BuyerProtection';
import { WarrantyRules } from './pages/WarrantyRules';
import { Support } from './pages/Support';
import { HelpArticle } from './pages/HelpArticle';
import { LiveChat } from './pages/LiveChat';
import { SetupAccount } from './pages/SetupAccount';
import { LiveActivityBanner } from './components/LiveActivityBanner';
import { GlobalProtection } from './components/GlobalProtection';

import { MobileUpload } from './pages/MobileUpload';
import { AffiliateJoinView } from './components/workspace/AffiliateJoinView';
import { Terms } from './pages/Terms';
import { QuickPayCheckout } from './components/public/QuickPayCheckout';
import { InvoicePublicView } from './components/public/InvoicePublicView';
import { InvoicePaymentPage as OldInvoicePaymentPage } from './components/public/InvoicePaymentPage';
import InvoicePaymentPage from './pages/pay/invoice/InvoicePaymentPage';
import InvoicePdfViewer from './pages/InvoicePdfViewer';
import { SubscriptionPublicView } from './components/public/SubscriptionPublicView';
import { PaymentSuccess } from './pages/PaymentSuccess';
import { PosTerminal } from './pages/PosTerminal';
import { PosCheckoutPage } from './pages/PosCheckoutPage';
import { PosAuth } from './pages/PosAuth';
import { PosNfcMobile } from './pages/PosNfcMobile';
import { PayoutInfoPage } from './pages/PayoutInfo';
import { FeesAndPlansPage } from './pages/FeesAndPlans';
import { StatusPage } from './pages/StatusPage';
import { NextGenPos } from './pages/features/NextGenPos';
import { WerseePay } from './pages/features/WerseePay';
import { WerseePaySecurityPage } from './pages/public/WerseePaySecurityPage';
import { AccountSecurityPage } from './pages/public/AccountSecurityPage';
import { CommandCenter } from './pages/features/CommandCenter';
import { OmniManagement } from './pages/features/OmniManagement';
import { AcademyBuilder } from './pages/features/AcademyBuilder';
import { PartnerNetwork } from './pages/features/PartnerNetwork';
import { ZeroCostEntry } from './pages/features/ZeroCostEntry';
import { VentureLaunchpad } from './pages/features/VentureLaunchpad';
import { IntelligenceCore } from './pages/features/IntelligenceCore';
import { FlashCheckout } from './pages/features/FlashCheckout';
import { DemoFlashCheckout } from './pages/demo/DemoFlashCheckout';
import WerseeCreators from './pages/features/WerseeCreators';
import WerseeTreasure from './pages/features/WerseeTreasure';
import WerseeInvoices from './pages/features/WerseeInvoices';
import WerseeSovereign from './pages/features/WerseeSovereign';
import { CustomAppLP } from './pages/CustomAppLP';
import { CustomAppBuild } from './pages/CustomAppBuild';
import { EnterpriseSolutions } from './pages/EnterpriseSolutions';
import { CallBooking } from './pages/CallBooking';
import { BookingDashboard } from './components/BookingDashboard';
import { CallConfigWizard } from './components/CallConfigWizard';
import { SocialLandingPage } from './pages/SocialLandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { InvitePage } from './pages/InvitePage';
import { CommunityInvitePage } from './pages/CommunityInvitePage';
import { MessageSharePage } from './pages/MessageSharePage';
import { AdsManager } from './components/workspace/AdsManager';
import { HelmetProvider } from 'react-helmet-async';

import { BuilderPage } from './pages/BuilderPage';
import { LoggedOut } from './pages/LoggedOut';
import { Learn } from './pages/Learn';
import { SharedFileView } from './pages/SharedFileView';
import { Jobs } from './pages/Jobs';
import { JobApplication } from './pages/JobApplication';
import { SecurityVerify } from './pages/SecurityVerify';
import { AboutUs } from './pages/AboutUs';
import { Roadmap } from './pages/Roadmap';
import { InteractiveExportView } from './pages/InteractiveExportView';
import { ProposalPublicView } from './pages/ProposalPublicView';
import { ContractPublicView } from './pages/ContractPublicView';
import { CookiePolicy } from './pages/CookiePolicy';
import { Imprint } from './pages/Imprint';
import { Disclaimer } from './pages/Disclaimer';
import { NotFound } from './pages/NotFound';
import { Investments } from './pages/Investments';
import InvestmentDetails from './pages/InvestmentDetails';
import { Portfolio } from './pages/Portfolio';

import { StudentDiscount } from './components/education/StudentDiscount';
import { CampusProgram } from './components/education/CampusProgram';
import { LearningPaths } from './components/education/LearningPaths';
import { EduResources } from './components/education/EduResources';

import { GiveawayLandingPage } from './components/workspace/GiveawayLandingPage';
import { FormPublicView } from './pages/FormPublicView';
import { Pricing } from './components/Pricing';
import { AdminPlans } from './components/AdminPlans';
import { CityCampaign } from './pages/CityCampaign';
import { NextGenSetup } from './pages/NextGenSetup';
import { NextGenInvite } from './pages/NextGenInvite';
import { NextGenLanding } from './pages/NextGenLanding';
import { AllPages } from './pages/AllPages';
import { EduGames } from './pages/EduGames';
import { GuardianPortal } from './pages/GuardianPortal';
import { SafetyControls } from './pages/SafetyControls';
import { BotGuide } from './pages/BotGuide';
import { LinkAccount } from './pages/LinkAccount';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
    <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2">{title}</h1>
    <p className="text-[#86868B]">This page is still under development.</p>
  </div>
);

import { BusinessPublicView } from './pages/BusinessPublicView';
import { ProfileOrBusiness } from './components/ProfileOrBusiness';

import { BusinessPortal } from './pages/BusinessPortal';

import { Transparency } from './pages/Transparency';
import { DownloadApp } from './pages/DownloadApp';

const InvestMarketplace = React.lazy(() => import('./pages/invest/InvestMarketplace'));
const InvestCampaignDetail = React.lazy(() => import('./pages/invest/InvestCampaignDetail'));
const InvestCheckout = React.lazy(() => import('./pages/invest/InvestCheckout'));
const BusinessInvestPage = React.lazy(() => import('./pages/invest/BusinessInvestPage'));
const AdminInvestmentsPage = React.lazy(() => import('./pages/invest/AdminInvestmentsPage'));
const MarketAssetDetail = React.lazy(() => import('./pages/invest/MarketAssetDetail'));
const WerseeListingDetail = React.lazy(() => import('./pages/invest/WerseeListingDetail'));

const LazyRoute = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<div className="min-h-screen bg-black pt-32 text-center text-gray-500">Loading...</div>}>
    {children}
  </React.Suspense>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  const isDetail = location.pathname.startsWith('/listing/');
  const isAuth = location.pathname.startsWith('/auth');
  const isAuthCallback = location.pathname === '/auth/callback';
  const isOAuthConsent = location.pathname.startsWith('/oauth/consent');
  const isWorkspace = location.pathname.includes('/workspace') || location.pathname.startsWith('/dashboard');
  const isChat = location.pathname.startsWith('/chat');
  const isMobileUpload = location.pathname.startsWith('/upload-mobile');
  const isCheckout = location.pathname.startsWith('/checkout');
  const isSuccess = location.pathname.startsWith('/success');
  const isAccess = location.pathname.startsWith('/access');
  const isFree = location.pathname.startsWith('/free-confirm');
  const isCommunity = location.pathname.startsWith('/community/');
  const isBuyerProtection = location.pathname.startsWith('/buyer-protection');
  const isWarrantyRules = location.pathname.startsWith('/warranty-rules');
  const isSupport = location.pathname.startsWith('/support');
  const isHelp = location.pathname.startsWith('/help/');
  const isLiveChat = location.pathname.startsWith('/live-chat');
  const isAffiliateJoin = location.pathname.startsWith('/affiliate/join');
  const isQuickPay = location.pathname.includes('/quick-pay/');
  const isInvoice = location.pathname.includes('/invoice/');
  const isSubscription = location.pathname.includes('/subscriptions/');
  const isPos = location.pathname.includes('/pos/');
  const isPaymentSuccess = location.pathname === '/payment-success';
  const isFeature = location.pathname.startsWith('/features/');
  const isFeesPlans = location.pathname === '/fees-plans';
  const isPayoutInfo = location.pathname === '/payout-info';
  const isStatus = location.pathname === '/status';
  const isCustomApp = location.pathname.startsWith('/app/');
  const isCustomAppBuild = location.pathname === '/custom-app-build';
  const isEnterprise = location.pathname === '/enterprise';
  const isPortal = location.pathname.startsWith('/portal/');
  const isLearn = location.pathname.startsWith('/learn');
  const isLearnPlayer = location.pathname.split('/').length > 2 && location.pathname.startsWith('/learn');
  const isCreators = location.pathname === '/creators';
  const isTreasure = location.pathname === '/treasure';
  const isInvoices = location.pathname === '/invoices';
  const isJobs = location.pathname === '/jobs';
  const isWerseePaySecurity = location.pathname === '/wersee-pay-security';
  const isAccountSecurity = location.pathname === '/account-security';
  const isSecurityVerify = location.pathname === '/verify';
  const isInteractiveExport = location.pathname.startsWith('/export/interactive/');
  const isProposal = location.pathname.startsWith('/proposal/');
  const isContract = location.pathname.startsWith('/contract/');
  const isCookiePolicy = location.pathname === '/cookies';
  const isImprint = location.pathname === '/imprint';
  const isDisclaimer = location.pathname === '/disclaimer';
  const isInvitePage = location.pathname.startsWith('/invite/');
  const isCommunityInvitePage = location.pathname.startsWith('/join/') || location.pathname.startsWith('/c/');
  const isGiveaway = location.pathname.startsWith('/g/');
  const isForm = location.pathname.startsWith('/f/');
  const isBuilder = location.pathname.startsWith('/builder/');
  const isSocialLanding = location.pathname.startsWith('/welcome/');
  const isSovereign = location.pathname === '/sovereign';
  const isTransparency = location.pathname === '/transparency';
  const isInvest = location.pathname === '/invest' || location.pathname.startsWith('/invest/') || /^\/@[^/]+\/invest(\/|$)/.test(location.pathname);

  const isNextGenWizard = location.pathname.startsWith('/next-gen-setup') || location.pathname.startsWith('/next-gen-invite');

  const isEmbed = location.search.includes('embed=true');
  const hideNavAndFooter = isDetail || isAuth || isAuthCallback || isOAuthConsent || isWorkspace || isChat || isMobileUpload || isCheckout || isSuccess || isAccess || isFree || isCommunity || isBuyerProtection || isWarrantyRules || isSupport || isHelp || isLiveChat || isAffiliateJoin || isQuickPay || isInvoice || isSubscription || isPos || isPaymentSuccess || isFeature || isFeesPlans || isPayoutInfo || isStatus || isCustomApp || isCustomAppBuild || isEnterprise || isPortal || isLearnPlayer || isCreators || isTreasure || isInvoices || isJobs || isWerseePaySecurity || isAccountSecurity || isSecurityVerify || isInteractiveExport || isProposal || isContract || isInvest || isGiveaway || isInvitePage || isCommunityInvitePage || isForm || isBuilder || isSocialLanding || isEmbed || isNextGenWizard;
  
  const hideNavBar = hideNavAndFooter || isSovereign;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col transition-colors duration-200">
      {!hideNavBar && <NavBar />}
      
      <main className={`flex-1 flex flex-col bg-black relative pt-safe pb-safe ${!hideNavAndFooter ? "pb-[calc(4rem+max(env(safe-area-inset-bottom),16px))] sm:pb-8" : ""}`}>
        <ErrorBoundary>
          <AnimatePresence mode="popLayout" initial={false}>
            <Routes location={location} key={location.pathname.includes('/workspace') ? '/workspace' : location.pathname}>
              <Route path="/" element={<Home />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/announcements/:id" element={<AnnouncementDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/messages" element={<PlaceholderPage title="Messages" />} />
              <Route path="/:slugOrUsername/profile" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/@:username/:listingId/:listingSlug/editor" element={<ListingDetail />} />
              <Route path="/@:username/:listingSlug" element={<ListingDetail />} />
              <Route path="/:username/:slug" element={<ListingDetail />} />
              <Route path="/share/:token" element={<SharedFileView />} />
              <Route path="/export/interactive/:sessionId" element={<InteractiveExportView />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/signin" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
              <Route path="/log-in" element={<Navigate to="/signin" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/imprint" element={<Imprint />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/ambassador-program" element={<AmbassadorProgram />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/flow/:authStep/:authSessionId" element={<Auth />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/logged-out" element={<LoggedOut />} />
              <Route path="/oauth/consent" element={<OAuthConsent />} />
              <Route path="/listing/:id" element={<ListingDetail />} />
              <Route path="/p/:slug" element={<ListingDetail />} />
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/dashboard/:businessId" element={<Navigate to="/workspace/:businessId" replace />} />
              <Route path="/workspace" element={<Dashboard />} />
              <Route path="/workspace/money/investments" element={<Dashboard />} />
              <Route path="/workspace/finance/investments" element={<Dashboard />} />
              <Route path="/workspace/businesses/:businessId/invest" element={<LazyRoute><BusinessInvestPage /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/new" element={<LazyRoute><BusinessInvestPage mode="new" /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/:campaignId" element={<LazyRoute><BusinessInvestPage /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/:campaignId/edit" element={<LazyRoute><BusinessInvestPage mode="edit" /></LazyRoute>} />
              <Route path="/workspace/admin/investments" element={<LazyRoute><AdminInvestmentsPage /></LazyRoute>} />
              <Route path="/workspace/admin/investments/:campaignId" element={<LazyRoute><AdminInvestmentsPage /></LazyRoute>} />
              <Route path="/workspace/:pageName" element={<Dashboard />} />
              <Route path="/workspace/:pageName/*" element={<Dashboard />} />
              <Route path="/:username/workspace" element={<Dashboard />} />
              <Route path="/:username/workspace/:pageName" element={<Dashboard />} />
              <Route path="/:username/workspace/:pageName/*" element={<Dashboard />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/selling-tips" element={<SellingTips />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/ai-checkout/:planId" element={<AiPlanCheckout />} />
              <Route path="/success/:id" element={<Success />} />
              <Route path="/access/:id" element={<AccessContent />} />
              <Route path="/free-confirm/:id" element={<FreeConfirmation />} />
              <Route path="/community" element={<CommunityView />} />
              <Route path="/community/docs" element={<DocumentationView />} />
              <Route path="/community/:id" element={<CommunityView />} />
              <Route path="/buyer-protection" element={<BuyerProtection />} />
              <Route path="/warranty-rules" element={<WarrantyRules />} />
              <Route path="/support" element={<Support />} />
              <Route path="/live-chat" element={<LiveChat />} />
              <Route path="/help/:slug" element={<HelpArticle />} />
              <Route path="/setup" element={<SetupAccount />} />
              <Route path="/setup-account" element={<SetupAccount />} />
              <Route path="/upload-mobile/:sessionId" element={<MobileUpload />} />
              <Route path="/affiliate/join" element={<AffiliateJoinView />} />
              
              {/* Custom Payment Routes */}
              <Route path="/sandbox/pay/invoice/:username/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/sandbox/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/s/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/pay/invoice/:username/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/wersee-pay-security" element={<WerseePaySecurityPage />} />
              <Route path="/account-security" element={<AccountSecurityPage />} />
              <Route path="/invoice/view/:invoiceId" element={<InvoicePdfViewer />} />
              <Route path="/quick-pay/invoice/:invoiceNumber" element={<OldInvoicePaymentPage />} />
              <Route path="/:username/quick-pay/invoice/:slug" element={<OldInvoicePaymentPage />} />
              <Route path="/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/:username/invoice/:slug" element={<InvoicePublicView />} />
              <Route path="/proposal/:id" element={<ProposalPublicView />} />
              <Route path="/contract/:id" element={<ContractPublicView />} />
              <Route path="/:username/subscriptions/:slug" element={<SubscriptionPublicView />} />
              <Route path="/:username/pos/:systemname/v1" element={<PosTerminal />} />
              <Route path="/:username/pos/:systemname/v1/nfc/mobile" element={<PosNfcMobile />} />
              <Route path="/:username/pos/:systemname/v1/:checkout_name/:checkout_id/checkout" element={<PosCheckoutPage />} />
              <Route path="/:username/:systemname/qr-pay/:id" element={<PosCheckoutPage />} />
              <Route path="/auth/:systemname/:token" element={<PosAuth />} />
              
              <Route path="/features/next-gen-pos" element={<NextGenPos />} />
              <Route path="/features/wersee-pay" element={<WerseePay />} />
              <Route path="/features/command-center" element={<CommandCenter />} />
              <Route path="/features/omni-management" element={<OmniManagement />} />
              <Route path="/features/academy-builder" element={<AcademyBuilder />} />
              <Route path="/features/partner-network" element={<PartnerNetwork />} />
              <Route path="/features/zero-cost-entry" element={<ZeroCostEntry />} />
              <Route path="/features/venture-launchpad" element={<VentureLaunchpad />} />
              <Route path="/features/intelligence-core" element={<IntelligenceCore />} />
              <Route path="/creators" element={<WerseeCreators />} />
              <Route path="/treasure" element={<WerseeTreasure />} />
              <Route path="/invoices" element={<WerseeInvoices />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/next-gen" element={<NextGenLanding />} />
              <Route path="/next-gen-setup" element={<NextGenSetup />} />
              <Route path="/next-gen-invite/:token" element={<NextGenInvite />} />
              <Route path="/edu-games" element={<EduGames />} />
              <Route path="/guardian-portal" element={<GuardianPortal />} />
              <Route path="/safety-controls" element={<SafetyControls />} />
              <Route path="/pages" element={<AllPages />} />
              <Route path="/verify" element={<SecurityVerify />} />
              <Route path="/sovereign" element={<WerseeSovereign />} />
              <Route path="/transparency" element={<Transparency />} />
              <Route path="/download" element={<DownloadApp />} />
              <Route path="/bot-guide" element={<BotGuide />} />
              <Route path="/auth/link" element={<LinkAccount />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id/apply" element={<JobApplication />} />
              <Route path="/portal/:businessSlug" element={<BusinessPortal />} />
              <Route path="/@:username/invest/:sessionId" element={<LazyRoute><InvestMarketplace /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/stocks/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/etfs/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/crypto/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/wersee/:slug" element={<LazyRoute><WerseeListingDetail /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/:campaignSlug" element={<LazyRoute><InvestCampaignDetail /></LazyRoute>} />
              <Route path="/@:username/invest/:sessionId/:campaignSlug/checkout" element={<LazyRoute><InvestCheckout /></LazyRoute>} />
              <Route path="/invest" element={<LazyRoute><InvestMarketplace /></LazyRoute>} />
              <Route path="/invest/stocks/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/etfs/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/crypto/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/wersee/:slug" element={<LazyRoute><WerseeListingDetail /></LazyRoute>} />
              <Route path="/invest/:campaignSlug" element={<LazyRoute><InvestCampaignDetail /></LazyRoute>} />
              <Route path="/invest/:campaignSlug/checkout" element={<LazyRoute><InvestCheckout /></LazyRoute>} />
              <Route path="/investments" element={<Navigate to="/invest" replace />} />
              <Route path="/investments/:id" element={<Navigate to="/invest" replace />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/features/flash-checkout" element={<FlashCheckout />} />
              <Route path="/demo/flash-checkout" element={<DemoFlashCheckout />} />
              
              {/* Education Routes */}
              <Route path="/edu/student" element={<StudentDiscount />} />
              <Route path="/edu/campus" element={<CampusProgram />} />
              <Route path="/edu/paths" element={<LearningPaths />} />
              <Route path="/edu/resources" element={<EduResources />} />
              
              <Route path="/invite/:role/:token" element={<InvitePage />} />
              <Route path="/invite/:token" element={<InvitePage />} />
              <Route path="/join/c/:communityId/:communityName" element={<CommunityInvitePage />} />
              <Route path="/join/i/:inviteCode" element={<CommunityInvitePage />} />
              <Route path="/c/:customUrl" element={<CommunityInvitePage />} />
              <Route path="/community/:communityId/m/:messageId" element={<MessageSharePage />} />
              <Route path="/dashboard/ads" element={<AdsManager />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/payout-info" element={<PayoutInfoPage />} />
              <Route path="/fees-plans" element={<FeesAndPlansPage />} />
              <Route path="/status" element={<StatusPage />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/admin/plans" element={<AdminPlans />} />
              <Route path="/app/:appId" element={<CustomAppLP />} />
              <Route path="/custom-app-build" element={<CustomAppBuild />} />
              <Route path="/enterprise" element={<EnterpriseSolutions />} />
              <Route path="/book/:configId" element={<CallBooking />} />
              <Route path="/@:username/book/:configSlug" element={<CallBooking />} />
              <Route path="/:businessSlug/book/:configSlug" element={<CallBooking />} />
              <Route path="/management/bookings" element={<BookingDashboard />} />
              <Route path="/management/create-call" element={<CallConfigWizard />} />
              <Route path="/earn" element={<CityCampaign />} />
              <Route path="/g/:id" element={<GiveawayLandingPage />} />
              <Route path="/f/:slug" element={<FormPublicView />} />
              <Route path="/builder/:type" element={<BuilderPage />} />
              <Route path="/builder/:type/:id" element={<BuilderPage />} />
              <Route path="/welcome/:source" element={<SocialLandingPage />} />
              {/* Redirect aliases for broken/linked pages */}
              <Route path="/ambassador" element={<Navigate to="/ambassador-program" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />
              <Route path="/help" element={<Navigate to="/support" replace />} />
              <Route path="/guidelines" element={<PlaceholderPage title="Community Guidelines" />} />
              <Route path="/partners" element={<PlaceholderPage title="Partner Program" />} />
              <Route path="/portal/demo" element={<Navigate to="/demo/flash-checkout" replace />} />

              <Route path="/:slugOrUsername" element={<ProfileOrBusiness />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
        {!hideNavAndFooter && <Footer />}
      </main>

      {!hideNavAndFooter && <SetupBanner />}
      <CookieBanner />
    </div>
  );
};

import { ListingWizardProvider } from './context/ListingWizardContext';
import { ListingWizard } from './components/listings/ListingWizard';

import { VerificationBanner } from './components/VerificationBanner';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { supabase, invokeApiRunner, waitForServer } from './lib/supabase';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { FeedbackProvider } from './lib/feedback';

import { SecurityAudit } from './components/SecurityAudit';
import { MobileOptimization } from './components/MobileOptimization';

export default function App() {
  useEffect(() => {
    const init = async () => {
      const isReady = await waitForServer();

      // Check Supabase reachability
      try {
        const { error } = await supabase.from('profiles').select('id').limit(1);
        if (error && error.message.includes('Failed to fetch')) {
          throw new Error('Could not connect to Supabase. Please check your VITE_SUPABASE_URL.');
        }
      } catch (err: any) {
          console.error('Supabase connection error:', err.message);
      }

      if (import.meta.env.VITE_RUN_DATABASE_SETUP === 'true') {
        if (!isReady) {
          console.warn('Backend server failed to start in time or /api/health is unavailable. Skipping database setup.');
          return;
        }

        // Database setup is opt-in because it mutates schema and can fail against remote runners.
        invokeApiRunner('setup-database', {}, 5, 2000)
          .then(res => {
            if (res.error) throw new Error(res.error);
            return res;
          })
          .then(console.log)
          .catch(err => {
            if (err.message?.includes('tuple concurrently updated')) {
              console.warn('Database setup already in progress or completed by another instance.');
            } else {
              console.error('Database setup error:', err instanceof Error ? err.message : err);
            }
          });
      }
    };

    init();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <HelmetProvider>
          <ListingWizardProvider>
            <SecurityAudit />
            <MobileOptimization />
            <GlobalProtection />
            <BrowserRouter>
              <FeedbackProvider>
                <Toaster position="top-center" richColors />
                <LiveActivityBanner />
                <VerificationBanner />
                <AnimatedRoutes />
                <ListingWizard />
                <PwaInstallBanner />
              </FeedbackProvider>
            </BrowserRouter>
          </ListingWizardProvider>
        </HelmetProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
