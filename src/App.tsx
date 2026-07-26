import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LocaleProvider } from './context/LocaleContext';
import { NavBar } from './components/NavBar';
import { SetupBanner } from './components/SetupBanner';
import { CookieBanner } from './components/CookieBanner';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { LiveActivityBanner } from './components/LiveActivityBanner';
import { GlobalProtection } from './components/GlobalProtection';
import { ErrorBoundary } from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from './components/SEO';
import { parseUsernameRouteValue, routePatterns, routes } from './routing/routes';

const lazyNamed = <T extends React.ComponentType<any>>(
  loader: () => Promise<any>,
  exportName: string,
) => React.lazy(async () => {
  const module = await loader();
  return { default: module[exportName] as T };
});

const Auth = lazyNamed(() => import('./pages/Auth'), 'Auth');
const ForgotPassword = lazyNamed(() => import('./pages/ForgotPassword'), 'ForgotPassword');
const UpdatePassword = lazyNamed(() => import('./pages/UpdatePassword'), 'UpdatePassword');
const AuthCallback = lazyNamed(() => import('./pages/AuthCallback'), 'AuthCallback');
const ConfirmEmail = lazyNamed(() => import('./pages/ConfirmEmail'), 'ConfirmEmail');
const OAuthConsent = lazyNamed(() => import('./pages/OAuthConsent'), 'OAuthConsent');
const PrivacyPolicy = lazyNamed(() => import('./pages/PrivacyPolicy'), 'PrivacyPolicy');
const AmbassadorProgram = lazyNamed(() => import('./pages/AmbassadorProgram'), 'AmbassadorProgram');
const SearchPage = lazyNamed(() => import('./pages/Search'), 'Search');
const Profile = lazyNamed(() => import('./pages/Profile'), 'Profile');
const Announcements = lazyNamed(() => import('./pages/Announcements'), 'Announcements');
const AnnouncementDetail = lazyNamed(() => import('./pages/AnnouncementDetail'), 'AnnouncementDetail');
const ListingDetail = lazyNamed(() => import('./pages/ListingDetail'), 'ListingDetail');
const Dashboard = lazyNamed(() => import('./pages/Dashboard'), 'Dashboard');
const Chat = lazyNamed(() => import('./pages/Chat'), 'Chat');
const SellingTips = lazyNamed(() => import('./pages/SellingTips'), 'SellingTips');
const Blog = lazyNamed(() => import('./pages/Blog'), 'Blog');
const Checkout = lazyNamed(() => import('./pages/Checkout'), 'Checkout');
const AiPlanCheckout = lazyNamed(() => import('./pages/AiPlanCheckout'), 'AiPlanCheckout');
const Success = lazyNamed(() => import('./pages/Success'), 'Success');
const AccessContent = lazyNamed(() => import('./pages/AccessContent'), 'AccessContent');
const FreeConfirmation = lazyNamed(() => import('./pages/FreeConfirmation'), 'FreeConfirmation');
const CommunityView = lazyNamed(() => import('./pages/CommunityView'), 'CommunityView');
const DocumentationView = lazyNamed(() => import('./pages/DocumentationView'), 'DocumentationView');
const BuyerProtection = lazyNamed(() => import('./pages/BuyerProtection'), 'BuyerProtection');
const WarrantyRules = lazyNamed(() => import('./pages/WarrantyRules'), 'WarrantyRules');
const Support = lazyNamed(() => import('./pages/Support'), 'Support');
const HelpArticle = lazyNamed(() => import('./pages/HelpArticle'), 'HelpArticle');
const LiveChat = lazyNamed(() => import('./pages/LiveChat'), 'LiveChat');
const SetupAccount = lazyNamed(() => import('./pages/SetupAccount'), 'SetupAccount');
const MobileUpload = lazyNamed(() => import('./pages/MobileUpload'), 'MobileUpload');
const AffiliateJoinView = lazyNamed(() => import('./components/workspace/AffiliateJoinView'), 'AffiliateJoinView');
const Terms = lazyNamed(() => import('./pages/Terms'), 'Terms');
const Eula = lazyNamed(() => import('./pages/Eula'), 'Eula');
const QuickPayCheckout = lazyNamed(() => import('./components/public/QuickPayCheckout'), 'QuickPayCheckout');
const PayoutRecipientSetup = lazyNamed(() => import('./pages/PayoutRecipientSetup'), 'PayoutRecipientSetup');
const InvoicePublicView = lazyNamed(() => import('./components/public/InvoicePublicView'), 'InvoicePublicView');
const OldInvoicePaymentPage = lazyNamed(() => import('./components/public/InvoicePaymentPage'), 'InvoicePaymentPage');
const InvoicePaymentPage = React.lazy(() => import('./pages/pay/invoice/InvoicePaymentPage'));
const InvoicePdfViewer = React.lazy(() => import('./pages/InvoicePdfViewer'));
const SubscriptionPublicView = lazyNamed(() => import('./components/public/SubscriptionPublicView'), 'SubscriptionPublicView');
const PaymentSuccess = lazyNamed(() => import('./pages/PaymentSuccess'), 'PaymentSuccess');
const PosTerminal = lazyNamed(() => import('./pages/PosTerminal'), 'PosTerminal');
const PosCheckoutPage = lazyNamed(() => import('./pages/PosCheckoutPage'), 'PosCheckoutPage');
const PosAuth = lazyNamed(() => import('./pages/PosAuth'), 'PosAuth');
const PosNfcMobile = lazyNamed(() => import('./pages/PosNfcMobile'), 'PosNfcMobile');
const PayoutInfoPage = lazyNamed(() => import('./pages/PayoutInfo'), 'PayoutInfoPage');
const FeesAndPlansPage = lazyNamed(() => import('./pages/FeesAndPlans'), 'FeesAndPlansPage');
const StatusPage = lazyNamed(() => import('./pages/StatusPage'), 'StatusPage');
const NextGenPos = lazyNamed(() => import('./pages/features/NextGenPos'), 'NextGenPos');
const WerseePay = lazyNamed(() => import('./pages/features/WerseePay'), 'WerseePay');
const WerseePaySecurityPage = lazyNamed(() => import('./pages/public/WerseePaySecurityPage'), 'WerseePaySecurityPage');
const AccountSecurityPage = lazyNamed(() => import('./pages/public/AccountSecurityPage'), 'AccountSecurityPage');
const CommandCenter = lazyNamed(() => import('./pages/features/CommandCenter'), 'CommandCenter');
const OmniManagement = lazyNamed(() => import('./pages/features/OmniManagement'), 'OmniManagement');
const AcademyBuilder = lazyNamed(() => import('./pages/features/AcademyBuilder'), 'AcademyBuilder');
const PartnerNetwork = lazyNamed(() => import('./pages/features/PartnerNetwork'), 'PartnerNetwork');
const ZeroCostEntry = lazyNamed(() => import('./pages/features/ZeroCostEntry'), 'ZeroCostEntry');
const VentureLaunchpad = lazyNamed(() => import('./pages/features/VentureLaunchpad'), 'VentureLaunchpad');
const IntelligenceCore = lazyNamed(() => import('./pages/features/IntelligenceCore'), 'IntelligenceCore');
const FlashCheckout = lazyNamed(() => import('./pages/features/FlashCheckout'), 'FlashCheckout');
const DemoFlashCheckout = lazyNamed(() => import('./pages/demo/DemoFlashCheckout'), 'DemoFlashCheckout');
const CreatorMode = React.lazy(() => import('./pages/creators/CreatorMode'));
const PublicCreatorProfile = React.lazy(() => import('./pages/creators/PublicCreatorProfile'));
const CreatorOnboardingPage = React.lazy(() => import('./pages/creators/CreatorOnboardingPage'));
const CreatorOverview = React.lazy(() => import('./pages/creators/CreatorOverview'));
const CreatorProfile = React.lazy(() => import('./pages/creators/CreatorProfile'));
const CreatorAnalytics = React.lazy(() => import('./pages/creators/CreatorAnalytics'));
const CreatorLinks = React.lazy(() => import('./pages/creators/CreatorLinks'));
const CreatorCampaigns = React.lazy(() => import('./pages/creators/CreatorCampaigns'));
const CreatorAudience = React.lazy(() => import('./pages/creators/CreatorAudience'));
const CreatorRevenue = React.lazy(() => import('./pages/creators/CreatorRevenue'));
const CreatorEarnings = React.lazy(() => import('./pages/creators/CreatorEarnings'));
const CreatorPayouts = React.lazy(() => import('./pages/creators/CreatorPayouts'));
const CreatorInvites = React.lazy(() => import('./pages/creators/CreatorInvites'));
const CreatorPlatforms = React.lazy(() => import('./pages/creators/CreatorPlatforms'));
const CreatorShareKit = React.lazy(() => import('./pages/creators/CreatorShareKit'));
const CreatorDocs = React.lazy(() => import('./pages/creators/CreatorDocs'));
const CreatorSettings = React.lazy(() => import('./pages/creators/CreatorSettings'));
const CreatorReferralRedirect = React.lazy(() => import('./pages/creators/CreatorReferralRedirect'));
const WerseeTreasure = React.lazy(() => import('./pages/features/WerseeTreasure'));
const WerseeInvoices = React.lazy(() => import('./pages/features/WerseeInvoices'));
const WerseeSovereign = React.lazy(() => import('./pages/features/WerseeSovereign'));
const CustomAppLP = lazyNamed(() => import('./pages/CustomAppLP'), 'CustomAppLP');
const CustomAppBuild = lazyNamed(() => import('./pages/CustomAppBuild'), 'CustomAppBuild');
const EnterpriseSolutions = lazyNamed(() => import('./pages/EnterpriseSolutions'), 'EnterpriseSolutions');
const CallBooking = lazyNamed(() => import('./pages/CallBooking'), 'CallBooking');
const BookingDashboard = lazyNamed(() => import('./components/BookingDashboard'), 'BookingDashboard');
const CallConfigWizard = lazyNamed(() => import('./components/CallConfigWizard'), 'CallConfigWizard');
const SocialLandingPage = lazyNamed(() => import('./pages/SocialLandingPage'), 'SocialLandingPage');
const InvitePage = lazyNamed(() => import('./pages/InvitePage'), 'InvitePage');
const AddFriendPage = lazyNamed(() => import('./pages/AddFriendPage'), 'AddFriendPage');
const ChatInvitePage = lazyNamed(() => import('./pages/ChatInvitePage'), 'ChatInvitePage');
const PublicDmPage = lazyNamed(() => import('./pages/PublicDmPage'), 'PublicDmPage');
const CommunityInvitePage = lazyNamed(() => import('./pages/CommunityInvitePage'), 'CommunityInvitePage');
const MessageSharePage = lazyNamed(() => import('./pages/MessageSharePage'), 'MessageSharePage');
const AdsManager = lazyNamed(() => import('./components/workspace/AdsManager'), 'AdsManager');
const BuilderPage = lazyNamed(() => import('./pages/BuilderPage'), 'BuilderPage');
const LoggedOut = lazyNamed(() => import('./pages/LoggedOut'), 'LoggedOut');
const Learn = lazyNamed(() => import('./pages/Learn'), 'Learn');
const SharedFileView = lazyNamed(() => import('./pages/SharedFileView'), 'SharedFileView');
const Jobs = lazyNamed(() => import('./pages/Jobs'), 'Jobs');
const JobApplication = lazyNamed(() => import('./pages/JobApplication'), 'JobApplication');
const SecurityVerify = lazyNamed(() => import('./pages/SecurityVerify'), 'SecurityVerify');
const AboutUs = lazyNamed(() => import('./pages/AboutUs'), 'AboutUs');
const Roadmap = lazyNamed(() => import('./pages/Roadmap'), 'Roadmap');
const InteractiveExportView = lazyNamed(() => import('./pages/InteractiveExportView'), 'InteractiveExportView');
const FunnelShareView = lazyNamed(() => import('./pages/FunnelShareView'), 'FunnelShareView');
const ProposalPublicView = lazyNamed(() => import('./pages/ProposalPublicView'), 'ProposalPublicView');
const ContractPublicView = lazyNamed(() => import('./pages/ContractPublicView'), 'ContractPublicView');
const CookiePolicy = lazyNamed(() => import('./pages/CookiePolicy'), 'CookiePolicy');
const Imprint = lazyNamed(() => import('./pages/Imprint'), 'Imprint');
const Disclaimer = lazyNamed(() => import('./pages/Disclaimer'), 'Disclaimer');
const NotFound = lazyNamed(() => import('./pages/NotFound'), 'NotFound');
const InvestmentDetails = React.lazy(() => import('./pages/InvestmentDetails'));
const Portfolio = lazyNamed(() => import('./pages/Portfolio'), 'Portfolio');
const StudentDiscount = lazyNamed(() => import('./components/education/StudentDiscount'), 'StudentDiscount');
const CampusProgram = lazyNamed(() => import('./components/education/CampusProgram'), 'CampusProgram');
const LearningPaths = lazyNamed(() => import('./components/education/LearningPaths'), 'LearningPaths');
const EduResources = lazyNamed(() => import('./components/education/EduResources'), 'EduResources');
const GiveawayLandingPage = lazyNamed(() => import('./components/workspace/GiveawayLandingPage'), 'GiveawayLandingPage');
const FormPublicView = lazyNamed(() => import('./pages/FormPublicView'), 'FormPublicView');
const Pricing = lazyNamed(() => import('./components/Pricing'), 'Pricing');
const AdminPlans = lazyNamed(() => import('./components/AdminPlans'), 'AdminPlans');
const CityCampaign = lazyNamed(() => import('./pages/CityCampaign'), 'CityCampaign');
const NextGenSetup = lazyNamed(() => import('./pages/NextGenSetup'), 'NextGenSetup');
const NextGenInvite = lazyNamed(() => import('./pages/NextGenInvite'), 'NextGenInvite');
const NextGenLanding = lazyNamed(() => import('./pages/NextGenLanding'), 'NextGenLanding');
const AllPages = lazyNamed(() => import('./pages/AllPages'), 'AllPages');
const EduGames = lazyNamed(() => import('./pages/EduGames'), 'EduGames');
const GuardianPortal = lazyNamed(() => import('./pages/GuardianPortal'), 'GuardianPortal');
const SafetyControls = lazyNamed(() => import('./pages/SafetyControls'), 'SafetyControls');
const BotGuide = lazyNamed(() => import('./pages/BotGuide'), 'BotGuide');
const LinkAccount = lazyNamed(() => import('./pages/LinkAccount'), 'LinkAccount');

const PlaceholderPage = ({ title }: { title: string }) => (
  <>
    <SEO title={title} noIndex />
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <h1 className="text-2xl font-bold text-[#1D1D1F] mb-2">{title}</h1>
      <p className="text-[#86868B]">This page is still under development.</p>
    </div>
  </>
);

const DashboardBusinessRedirect = () => {
  const { businessId } = useParams();
  return (
    <Navigate
      to={businessId ? routes.workspacePage({ pageName: businessId }) : '/workspace'}
      replace
    />
  );
};

const LegacyMessagesRedirect = () => {
  const { username } = useParams();
  const { user } = useAuth();

  const normalizedUsername =
    parseUsernameRouteValue(username) ||
    parseUsernameRouteValue(user?.email?.split('@')[0] || '');

  if (!normalizedUsername) {
    return <Navigate to="/workspace/chats" replace />;
  }

  return <Navigate to={routes.userWorkspaceChats({ username: normalizedUsername })} replace />;
};

const ProfileOrBusiness = lazyNamed(() => import('./components/ProfileOrBusiness'), 'ProfileOrBusiness');
const BusinessPortal = lazyNamed(() => import('./pages/BusinessPortal'), 'BusinessPortal');
const Transparency = lazyNamed(() => import('./pages/Transparency'), 'Transparency');
const DownloadApp = lazyNamed(() => import('./pages/DownloadApp'), 'DownloadApp');

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

const RouteErrorBoundary = ({
  disabled,
  routeKey,
  children,
}: {
  disabled: boolean;
  routeKey: string;
  children: React.ReactNode;
}) => {
  if (disabled) return <>{children}</>;

  return <ErrorBoundary key={routeKey}>{children}</ErrorBoundary>;
};

const AnimatedRoutes = () => {
  const location = useLocation();
  const isLoginRoute =
    location.pathname === '/auth' ||
    location.pathname.startsWith('/auth/flow/') ||
    location.pathname === '/auth/callback' ||
    location.pathname === '/signin' ||
    location.pathname === '/login';
  const routeKey = location.pathname.includes('/workspace')
    ? '/workspace'
    : isLoginRoute
      ? '/auth'
      : location.pathname;
  const isDetail = location.pathname.startsWith('/listing/');
  const isAuth = location.pathname.startsWith('/auth');
  const isAuthCallback = location.pathname === '/auth/callback';
  const isOAuthConsent = location.pathname.startsWith('/oauth/consent');
  const isWorkspace = location.pathname.includes('/workspace') || location.pathname.startsWith('/dashboard');
  const isChat = location.pathname.startsWith('/chat');
  const isAddFriend = location.pathname.startsWith('/add/');
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
  const isCreators = location.pathname === '/creators' || location.pathname.startsWith('/creators/');
  const isCreatorPublic = location.pathname.startsWith('/creator/');
  const isCreatorReferral = location.pathname.startsWith('/r/');
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
  const isCreate = location.pathname === '/create' || location.pathname.startsWith('/create/');
  const isSocialLanding = location.pathname.startsWith('/welcome/');
  const isPublicDm =
    location.pathname.startsWith('/pd/') ||
    location.pathname.startsWith('/public-dm/');
  const isSovereign = location.pathname === '/sovereign';
  const isTransparency = location.pathname === '/transparency';
  const isInvest = location.pathname === '/invest' || location.pathname.startsWith('/invest/') || location.pathname.startsWith('/fund/') || /^\/[^/]+\/invest(\/|$)/.test(location.pathname);

  const isNextGenWizard = location.pathname.startsWith('/next-gen-setup') || location.pathname.startsWith('/next-gen-invite');

  const isEmbed = location.search.includes('embed=true');
  const hideNavAndFooter = isDetail || isAuth || isAuthCallback || isOAuthConsent || isWorkspace || isChat || isAddFriend || isMobileUpload || isCheckout || isSuccess || isAccess || isFree || isCommunity || isBuyerProtection || isWarrantyRules || isSupport || isHelp || isLiveChat || isAffiliateJoin || isQuickPay || isInvoice || isSubscription || isPos || isPaymentSuccess || isFeature || isFeesPlans || isPayoutInfo || isStatus || isCustomApp || isCustomAppBuild || isEnterprise || isPortal || isLearnPlayer || isCreators || isCreatorPublic || isCreatorReferral || isTreasure || isInvoices || isJobs || isWerseePaySecurity || isAccountSecurity || isSecurityVerify || isInteractiveExport || isProposal || isContract || isInvest || isGiveaway || isInvitePage || isCommunityInvitePage || isForm || isBuilder || isCreate || isSocialLanding || isPublicDm || isEmbed || isNextGenWizard;
  
  const hideNavBar = hideNavAndFooter || isSovereign;

  return (
    <div className="min-h-[100dvh] bg-black flex flex-col transition-colors duration-200">
      {!hideNavBar && <NavBar />}
      
      <main className={`flex-1 flex flex-col bg-black relative pt-safe pb-safe ${!hideNavAndFooter ? "pb-[calc(4rem+max(env(safe-area-inset-bottom),16px))] sm:pb-8" : ""}`}>
        <RouteErrorBoundary disabled={isLoginRoute} routeKey={routeKey}>
          <AnimatePresence mode="popLayout" initial={false}>
            <React.Suspense fallback={<div className="min-h-[50vh] bg-black pt-32 text-center text-gray-400" role="status">Loading page…</div>}>
            <Routes location={location} key={routeKey}>
              <Route path="/" element={<Home />} />
              <Route path="/announcements" element={<Announcements />} />
              <Route path="/announcements/:id" element={<AnnouncementDetail />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/learn" element={<Learn />} />
              <Route path="/messages" element={<LegacyMessagesRedirect />} />
              <Route path={routePatterns.userProfile} element={<Profile />} />
              <Route path="/:slugOrUsername/profile" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/:username/chat" element={<Chat />} />
              <Route path="/:username/chats" element={<Chat />} />
              <Route path="/:username/messages" element={<LegacyMessagesRedirect />} />
              <Route path="/:username/chat/invite/:token" element={<ChatInvitePage />} />
              <Route path={routePatterns.accountProductEditor} element={<ListingDetail />} />
              <Route path={routePatterns.accountProductBySlug} element={<ListingDetail />} />
              <Route path="/share/:token" element={<SharedFileView />} />
              <Route path="/export/interactive/:sessionId" element={<InteractiveExportView />} />
              <Route path="/funnel/:token" element={<FunnelShareView />} />
              <Route path="/auth/*" element={<Auth />} />
              <Route path="/signin" element={<Auth />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/sign-in" element={<Navigate to="/signin" replace />} />
              <Route path="/log-in" element={<Navigate to="/signin" replace />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/update-password" element={<UpdatePassword />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/eula" element={<Eula />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/imprint" element={<Imprint />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/ambassador-program" element={<AmbassadorProgram />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/confirm-email" element={<ConfirmEmail />} />
              <Route path="/logged-out" element={<LoggedOut />} />
              <Route path="/oauth/consent" element={<OAuthConsent />} />
              <Route path={routePatterns.productById} element={<ListingDetail />} />
              <Route path={routePatterns.productBySlug} element={<ListingDetail />} />
              <Route path="/dashboard" element={<Navigate to="/workspace" replace />} />
              <Route path="/dashboard/:businessId" element={<DashboardBusinessRedirect />} />
              <Route path={routePatterns.rootWorkspace} element={<Dashboard />} />
              <Route path="/workspace/money/investments" element={<Dashboard />} />
              <Route path="/workspace/finance/investments" element={<Dashboard />} />
              <Route path="/workspace/businesses/:businessId/invest" element={<LazyRoute><BusinessInvestPage /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/new" element={<LazyRoute><BusinessInvestPage mode="new" /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/:campaignId" element={<LazyRoute><BusinessInvestPage /></LazyRoute>} />
              <Route path="/workspace/businesses/:businessId/invest/:campaignId/edit" element={<LazyRoute><BusinessInvestPage mode="edit" /></LazyRoute>} />
              <Route path="/workspace/admin/investments" element={<LazyRoute><AdminInvestmentsPage /></LazyRoute>} />
              <Route path="/workspace/admin/investments/:campaignId" element={<LazyRoute><AdminInvestmentsPage /></LazyRoute>} />
              <Route path={routePatterns.rootWorkspacePage} element={<Dashboard />} />
              <Route path={routePatterns.rootWorkspaceNestedPage} element={<Dashboard />} />
              <Route path={routePatterns.accountWorkspace} element={<Dashboard />} />
              <Route path={routePatterns.accountWorkspacePage} element={<Dashboard />} />
              <Route path={routePatterns.accountWorkspaceNestedPage} element={<Dashboard />} />
              <Route path="/add/:userId" element={<AddFriendPage />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/invite/:token" element={<ChatInvitePage />} />
              <Route path="/pd/:username" element={<PublicDmPage />} />
              <Route path="/public-dm/:username" element={<PublicDmPage />} />
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
              <Route path="/r/:username" element={<CreatorReferralRedirect />} />
              <Route path="/r/:username/:slug" element={<CreatorReferralRedirect />} />
              
              {/* Custom Payment Routes */}
              <Route path="/sandbox/pay/invoice/:username/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/sandbox/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/s/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/payout/setup/:token" element={<PayoutRecipientSetup />} />
              <Route path="/pay/invoice/:username/:invoiceId" element={<InvoicePaymentPage />} />
              <Route path="/wersee-pay-security" element={<WerseePaySecurityPage />} />
              <Route path="/account-security" element={<AccountSecurityPage />} />
              <Route path="/invoice/view/:invoiceId" element={<InvoicePdfViewer />} />
              <Route path="/quick-pay/invoice/:invoiceNumber" element={<OldInvoicePaymentPage />} />
              <Route path="/quick-pay/:username/:slug" element={<QuickPayCheckout />} />
              <Route path="/:username/quick-pay/invoice/:slug" element={<OldInvoicePaymentPage />} />
              <Route path="/:username/quick-pay/:slug" element={<QuickPayCheckout />} />
              <Route path="/:username/invoice/:slug" element={<InvoicePublicView />} />
              <Route path="/:username/proposal/:id" element={<ProposalPublicView />} />
              <Route path="/proposal/:id" element={<ProposalPublicView />} />
              <Route path="/contract/:id" element={<ContractPublicView />} />
              <Route path="/:username/subscriptions/:slug" element={<SubscriptionPublicView />} />
              <Route path={routePatterns.accountPosTerminal} element={<PosTerminal />} />
              <Route path={routePatterns.accountPosNfc} element={<PosNfcMobile />} />
              <Route path={routePatterns.accountPosCheckout} element={<PosCheckoutPage />} />
              <Route path={routePatterns.accountQrPay} element={<PosCheckoutPage />} />
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
              <Route path="/creators" element={<CreatorMode />} />
              <Route path="/creators/onboarding" element={<CreatorOnboardingPage />} />
              <Route path="/creators/dashboard" element={<CreatorOverview />} />
              <Route path="/creators/profile" element={<CreatorProfile />} />
              <Route path="/creators/analytics" element={<CreatorAnalytics />} />
              <Route path="/creators/links" element={<CreatorLinks />} />
              <Route path="/creators/campaigns" element={<CreatorCampaigns />} />
              <Route path="/creators/audience" element={<CreatorAudience />} />
              <Route path="/creators/revenue" element={<CreatorRevenue />} />
              <Route path="/creators/earnings" element={<CreatorEarnings />} />
              <Route path="/creators/payouts" element={<CreatorPayouts />} />
              <Route path="/creators/invites" element={<CreatorInvites />} />
              <Route path="/creators/invite/:username" element={<CreatorInvites />} />
              <Route path="/creators/platforms" element={<CreatorPlatforms />} />
              <Route path="/creators/share-kit" element={<CreatorShareKit />} />
              <Route path="/creators/docs" element={<CreatorDocs />} />
              <Route path="/creators/settings" element={<CreatorSettings />} />
              <Route path="/creator/:username" element={<PublicCreatorProfile />} />
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
              <Route path="/passkeys" element={<Navigate to="/workspace/passkeys" replace />} />
              <Route path="/settings/passkeys" element={<Navigate to="/workspace/settings/passkeys" replace />} />
              <Route path="/account/passkeys" element={<Navigate to="/workspace/settings/passkeys" replace />} />
              <Route path="/security/passkeys" element={<Navigate to="/workspace/settings/passkeys" replace />} />
              <Route path="/jobs" element={<Jobs />} />
              <Route path="/jobs/:id/apply" element={<JobApplication />} />
              <Route path="/portal/:businessSlug" element={<BusinessPortal />} />
              <Route path={routePatterns.accountInvest} element={<LazyRoute><InvestMarketplace /></LazyRoute>} />
              <Route path={routePatterns.accountInvestStock} element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path={routePatterns.accountInvestEtf} element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path={routePatterns.accountInvestCrypto} element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path={routePatterns.accountInvestWersee} element={<LazyRoute><WerseeListingDetail /></LazyRoute>} />
              <Route path={routePatterns.accountInvestCampaign} element={<LazyRoute><InvestCampaignDetail /></LazyRoute>} />
              <Route path={routePatterns.accountInvestCheckout} element={<LazyRoute><InvestCheckout /></LazyRoute>} />
              <Route path={routePatterns.publicFundCampaign} element={<LazyRoute><InvestCampaignDetail /></LazyRoute>} />
              <Route path={routePatterns.publicFundCheckout} element={<LazyRoute><InvestCheckout /></LazyRoute>} />
              <Route path="/invest" element={<LazyRoute><InvestMarketplace /></LazyRoute>} />
              <Route path="/invest/stocks/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/etfs/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/crypto/:slug" element={<LazyRoute><MarketAssetDetail /></LazyRoute>} />
              <Route path="/invest/wersee/:slug" element={<LazyRoute><WerseeListingDetail /></LazyRoute>} />
              <Route path="/invest/:campaignSlug" element={<LazyRoute><InvestCampaignDetail /></LazyRoute>} />
              <Route path="/invest/:campaignSlug/checkout" element={<LazyRoute><InvestCheckout /></LazyRoute>} />
              <Route path="/investments" element={<Navigate to="/invest" replace />} />
              <Route path="/investments/:id" element={<InvestmentDetails />} />
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
              <Route path="/:username/book/:configSlug" element={<CallBooking />} />
              <Route path="/:businessSlug/book/:configSlug" element={<CallBooking />} />
              <Route path="/management/bookings" element={<BookingDashboard />} />
              <Route path="/management/create-call" element={<CallConfigWizard />} />
              <Route path="/earn" element={<CityCampaign />} />
              <Route path="/g/:id" element={<GiveawayLandingPage />} />
              <Route path="/f/:slug" element={<FormPublicView />} />
              <Route path="/builder/:type" element={<BuilderPage />} />
              <Route path="/builder/:type/:id" element={<BuilderPage />} />
              <Route path="/create" element={<div className="min-h-screen bg-black" />} />
              <Route path="/create/:type" element={<div className="min-h-screen bg-black" />} />
              <Route path="/create/:type/:id" element={<div className="min-h-screen bg-black" />} />
              <Route path="/welcome/:source" element={<SocialLandingPage />} />
              {/* Redirect aliases for broken/linked pages */}
              <Route path="/ambassador" element={<Navigate to="/ambassador-program" replace />} />
              <Route path="/privacy-policy" element={<Navigate to="/privacy" replace />} />
              <Route path="/cookie-policy" element={<Navigate to="/cookies" replace />} />
              <Route path="/help" element={<Navigate to="/support" replace />} />
              <Route path="/guidelines" element={<PlaceholderPage title="Community Guidelines" />} />
              <Route path="/partners" element={<PlaceholderPage title="Partner Program" />} />
              <Route path="/portal/demo" element={<Navigate to="/demo/flash-checkout" replace />} />

              <Route path={routePatterns.rootEntity} element={<ProfileOrBusiness />} />
              <Route path={routePatterns.notFound} element={<NotFound />} />
            </Routes>
            </React.Suspense>
          </AnimatePresence>
        </RouteErrorBoundary>
        {!hideNavAndFooter && <Footer />}
      </main>

      {!hideNavAndFooter && <SetupBanner />}
      <CookieBanner />
    </div>
  );
};

import { ListingWizardProvider, useListingWizard } from './context/ListingWizardContext';

import { VerificationBanner } from './components/VerificationBanner';
import { invokeApiRunner, waitForServer } from './lib/supabase';
import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { FeedbackProvider } from './lib/feedback';

import { SecurityAudit } from './components/SecurityAudit';
import { MobileOptimization } from './components/MobileOptimization';
import { MobileKeyboardPill } from './components/MobileKeyboardPill';
import { getLocaleFromPathname } from './lib/locales';
import { WerseeAiProvider } from './ai/context';

const ListingWizard = lazyNamed(() => import('./components/listings/ListingWizard'), 'ListingWizard');

const DeferredListingWizard = () => {
  const { isOpen } = useListingWizard();
  const location = useLocation();
  if (!isOpen && !location.pathname.startsWith('/create')) return null;
  return <React.Suspense fallback={null}><ListingWizard /></React.Suspense>;
};

export default function App() {
  useEffect(() => {
    const init = async () => {
      const isReady = await waitForServer();

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
        <WerseeAiProvider>
        <HelmetProvider>
          <ListingWizardProvider>
            <SecurityAudit />
            <MobileOptimization />
            <GlobalProtection />
            <BrowserRouter basename={getLocaleFromPathname(window.location.pathname) ? `/${getLocaleFromPathname(window.location.pathname)}` : undefined}>
              <LocaleProvider>
                <FeedbackProvider>
                <Toaster position="top-center" richColors />
                <MobileKeyboardPill />
                <LiveActivityBanner />
                <VerificationBanner />
                <AnimatedRoutes />
                <DeferredListingWizard />
                </FeedbackProvider>
              </LocaleProvider>
            </BrowserRouter>
          </ListingWizardProvider>
        </HelmetProvider>
        </WerseeAiProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
