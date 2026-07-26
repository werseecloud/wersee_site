type Brand<Value, Name extends string> = Value & { readonly __brand: Name };

export type AccountHandle = Brand<string, 'AccountHandle'>;
export type Username = Brand<string, 'Username'>;
export type UserId = Brand<string, 'UserId'>;
export type ProductId = Brand<string, 'ProductId'>;
export type ProductSlug = Brand<string, 'ProductSlug'>;
export type WorkspaceId = Brand<string, 'WorkspaceId'>;
export type ChatId = Brand<string, 'ChatId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type ProjectId = Brand<string, 'ProjectId'>;
export type OrderId = Brand<string, 'OrderId'>;

const ACCOUNT_HANDLE_PATTERN = /^@[A-Za-z0-9._-]+$/;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;

const decodeRouteValue = (value: string) => {
  try {
    return decodeURIComponent(value.trim());
  } catch {
    return '';
  }
};

const requireSegment = (value: string, label: string) => {
  const decoded = decodeRouteValue(value);
  const hasControlCharacter = [...decoded].some((character) => character.charCodeAt(0) < 32);
  if (!decoded || hasControlCharacter || /[/\\?#]/.test(decoded)) {
    throw new Error(`Invalid ${label}.`);
  }
  return decoded;
};

const brandSegment = <Name extends string>(value: string, label: string) =>
  requireSegment(value, label) as Brand<string, Name>;

export const identifiers = {
  accountHandle(value: string): AccountHandle {
    const decoded = decodeRouteValue(value);
    if (!ACCOUNT_HANDLE_PATTERN.test(decoded)) {
      throw new Error('Invalid account handle.');
    }
    return decoded as AccountHandle;
  },
  username(value: string): Username {
    const decoded = decodeRouteValue(value);
    if (!USERNAME_PATTERN.test(decoded)) {
      throw new Error('Invalid username.');
    }
    return decoded as Username;
  },
  userId: (value: string) => brandSegment<'UserId'>(value, 'user ID'),
  productId: (value: string) => brandSegment<'ProductId'>(value, 'product ID'),
  productSlug: (value: string) => brandSegment<'ProductSlug'>(value, 'product slug'),
  workspaceId: (value: string) => brandSegment<'WorkspaceId'>(value, 'workspace ID'),
  chatId: (value: string) => brandSegment<'ChatId'>(value, 'chat ID'),
  messageId: (value: string) => brandSegment<'MessageId'>(value, 'message ID'),
  projectId: (value: string) => brandSegment<'ProjectId'>(value, 'project ID'),
  orderId: (value: string) => brandSegment<'OrderId'>(value, 'order ID'),
};

export const parseAccountHandle = (value?: string): AccountHandle | null => {
  if (!value) return null;
  try {
    return identifiers.accountHandle(value);
  } catch {
    return null;
  }
};

export const parseUsername = (value?: string): Username | null => {
  if (!value) return null;
  try {
    return identifiers.username(value);
  } catch {
    return null;
  }
};

/**
 * Explicit boundary conversion for the profiles table, whose `username`
 * column intentionally stores the value without the route's leading `@`.
 */
export const usernameFromAccountHandle = (accountHandle: AccountHandle): Username =>
  identifiers.username(accountHandle.slice(1));

export const parseUsernameRouteValue = (value?: string): Username | null => {
  if (!value) return null;
  const accountHandle = parseAccountHandle(value);
  return accountHandle ? usernameFromAccountHandle(accountHandle) : parseUsername(value);
};

const encodeSegment = (value: string) => encodeURIComponent(value);
const encodeAccountHandle = (value: AccountHandle) =>
  encodeURIComponent(value).replace(/^%40/i, '@');

const encodeRestPath = (restPath?: string) => {
  if (!restPath) return '';
  const segments = restPath.split('/').filter(Boolean);
  return segments.length ? `/${segments.map(encodeSegment).join('/')}` : '';
};

export const routePatterns = {
  userProfile: '/@:username',
  profileByUserId: '/profile/:id',
  accountProductEditor: '/:accountHandle/:productId/:productSlug/editor',
  accountProductBySlug: '/:accountHandle/:productSlug',
  productById: '/listing/:productId',
  productBySlug: '/p/:productSlug',
  accountWorkspace: '/:accountHandle/workspace',
  accountWorkspacePage: '/:accountHandle/workspace/:pageName',
  accountWorkspaceNestedPage: '/:accountHandle/workspace/:pageName/*',
  rootWorkspace: '/workspace',
  rootWorkspacePage: '/workspace/:pageName',
  rootWorkspaceNestedPage: '/workspace/:pageName/*',
  accountInvest: '/:accountHandle/invest/:sessionId',
  accountInvestStock: '/:accountHandle/invest/:sessionId/stocks/:slug',
  accountInvestEtf: '/:accountHandle/invest/:sessionId/etfs/:slug',
  accountInvestCrypto: '/:accountHandle/invest/:sessionId/crypto/:slug',
  accountInvestWersee: '/:accountHandle/invest/:sessionId/wersee/:slug',
  accountInvestCampaign: '/:accountHandle/invest/:sessionId/:campaignSlug',
  accountInvestCheckout: '/:accountHandle/invest/:sessionId/:campaignSlug/checkout',
  publicFundCampaign: '/fund/:campaignSlug',
  publicFundCheckout: '/fund/:campaignSlug/checkout',
  accountPosTerminal: '/:accountHandle/pos/:systemname/v1',
  accountPosNfc: '/:accountHandle/pos/:systemname/v1/nfc/mobile',
  accountPosCheckout: '/:accountHandle/pos/:systemname/v1/:checkout_name/:checkout_id/checkout',
  accountQrPay: '/:accountHandle/:systemname/qr-pay/:id',
  rootEntity: '/:slugOrUsername',
  notFound: '*',
} as const;

export const routes = {
  userProfile: ({ username }: { username: Username }) =>
    `/@${encodeSegment(username)}`,
  profileByUserId: ({ userId }: { userId: UserId }) =>
    `/profile/${encodeSegment(userId)}`,
  accountProductBySlug: ({
    accountHandle,
    productSlug,
  }: {
    accountHandle: AccountHandle;
    productSlug: ProductSlug;
  }) => `/${encodeAccountHandle(accountHandle)}/${encodeSegment(productSlug)}`,
  userProductBySlug: ({
    username,
    productSlug,
  }: {
    username: Username;
    productSlug: ProductSlug;
  }) => `/@${encodeSegment(username)}/${encodeSegment(productSlug)}`,
  accountProductEditor: ({
    accountHandle,
    productId,
    productSlug,
  }: {
    accountHandle: AccountHandle;
    productId: ProductId;
    productSlug: ProductSlug;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/${encodeSegment(productId)}/${encodeSegment(productSlug)}/editor`,
  productById: ({ productId }: { productId: ProductId }) =>
    `/listing/${encodeSegment(productId)}`,
  productBySlug: ({ productSlug }: { productSlug: ProductSlug }) =>
    `/p/${encodeSegment(productSlug)}`,
  checkoutByProductId: ({ productId }: { productId: ProductId }) =>
    `/checkout/${encodeSegment(productId)}`,
  accountWorkspace: ({ accountHandle }: { accountHandle: AccountHandle }) =>
    `/${encodeAccountHandle(accountHandle)}/workspace`,
  workspacePage: ({ pageName, restPath }: { pageName: string; restPath?: string }) =>
    `/workspace/${encodeSegment(requireSegment(pageName, 'workspace page'))}${encodeRestPath(restPath)}`,
  accountWorkspacePage: ({
    accountHandle,
    pageName,
    restPath,
  }: {
    accountHandle: AccountHandle;
    pageName: string;
    restPath?: string;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/workspace/${encodeSegment(
      requireSegment(pageName, 'workspace page'),
    )}${encodeRestPath(restPath)}`,
  accountWorkspaceChats: ({ accountHandle }: { accountHandle: AccountHandle }) =>
    `/${encodeAccountHandle(accountHandle)}/workspace/chats`,
  userWorkspacePage: ({
    username,
    pageName,
    restPath,
  }: {
    username: Username;
    pageName: string;
    restPath?: string;
  }) =>
    `/@${encodeSegment(username)}/workspace/${encodeSegment(
      requireSegment(pageName, 'workspace page'),
    )}${encodeRestPath(restPath)}`,
  userWorkspaceChats: ({ username }: { username: Username }) =>
    `/@${encodeSegment(username)}/workspace/chats`,
  publicDm: ({ username }: { username: Username }) =>
    `/pd/${encodeSegment(username)}`,
  creatorProfile: ({ username }: { username: Username }) =>
    `/creator/${encodeSegment(username)}`,
  communityById: ({ communityId }: { communityId: string }) =>
    `/community/${encodeSegment(requireSegment(communityId, 'community ID'))}`,
  messageShare: ({
    communityId,
    messageId,
  }: {
    communityId: string;
    messageId: MessageId;
  }) =>
    `/community/${encodeSegment(
      requireSegment(communityId, 'community ID'),
    )}/m/${encodeSegment(messageId)}`,
  proposalById: ({ proposalId }: { proposalId: string }) =>
    `/proposal/${encodeSegment(requireSegment(proposalId, 'proposal ID'))}`,
  businessPortal: ({ businessSlug }: { businessSlug: string }) =>
    `/portal/${encodeSegment(requireSegment(businessSlug, 'business slug'))}`,
  bookingByConfigId: ({ configId }: { configId: string }) =>
    `/book/${encodeSegment(requireSegment(configId, 'booking configuration ID'))}`,
  appById: ({ appId }: { appId: string }) =>
    `/app/${encodeSegment(requireSegment(appId, 'app ID'))}`,
  userBooking: ({
    username,
    configSlug,
  }: {
    username: Username;
    configSlug: string;
  }) =>
    `/@${encodeSegment(username)}/book/${encodeSegment(
      requireSegment(configSlug, 'booking configuration slug'),
    )}`,
  userInvoice: ({
    username,
    invoiceSlug,
  }: {
    username: Username;
    invoiceSlug: string;
  }) =>
    `/@${encodeSegment(username)}/invoice/${encodeSegment(
      requireSegment(invoiceSlug, 'invoice slug'),
    )}`,
  userQuickPay: ({
    username,
    paymentSlug,
  }: {
    username: Username;
    paymentSlug: string;
  }) =>
    `/@${encodeSegment(username)}/quick-pay/${encodeSegment(
      requireSegment(paymentSlug, 'payment slug'),
    )}`,
  quickPayByUsername: ({
    username,
    paymentSlug,
  }: {
    username: Username;
    paymentSlug: string;
  }) =>
    `/quick-pay/${encodeSegment(username)}/${encodeSegment(
      requireSegment(paymentSlug, 'payment slug'),
    )}`,
  invoicePaymentByUsername: ({
    username,
    invoiceId,
  }: {
    username: Username;
    invoiceId: string;
  }) =>
    `/pay/invoice/${encodeSegment(username)}/${encodeSegment(
      requireSegment(invoiceId, 'invoice ID'),
    )}`,
  userQuickPayInvoice: ({
    username,
    invoiceSlug,
  }: {
    username: Username;
    invoiceSlug: string;
  }) =>
    `/@${encodeSegment(username)}/quick-pay/invoice/${encodeSegment(
      requireSegment(invoiceSlug, 'invoice slug'),
    )}`,
  userSubscription: ({
    username,
    subscriptionSlug,
  }: {
    username: Username;
    subscriptionSlug: string;
  }) =>
    `/@${encodeSegment(username)}/subscriptions/${encodeSegment(
      requireSegment(subscriptionSlug, 'subscription slug'),
    )}`,
  userInvest: ({
    username,
    sessionId,
  }: {
    username: Username;
    sessionId: string;
  }) =>
    `/@${encodeSegment(username)}/invest/${encodeSegment(
      requireSegment(sessionId, 'investment session ID'),
    )}`,
  accountInvest: ({
    accountHandle,
    sessionId,
  }: {
    accountHandle: AccountHandle;
    sessionId: string;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/invest/${encodeSegment(
      requireSegment(sessionId, 'investment session ID'),
    )}`,
  accountPosTerminal: ({
    accountHandle,
    systemName,
  }: {
    accountHandle: AccountHandle;
    systemName: string;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/pos/${encodeSegment(
      requireSegment(systemName, 'POS system name'),
    )}/v1`,
  userPosTerminal: ({
    username,
    systemName,
  }: {
    username: Username;
    systemName: string;
  }) =>
    `/@${encodeSegment(username)}/pos/${encodeSegment(
      requireSegment(systemName, 'POS system name'),
    )}/v1`,
  accountPosNfc: ({
    accountHandle,
    systemName,
  }: {
    accountHandle: AccountHandle;
    systemName: string;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/pos/${encodeSegment(
      requireSegment(systemName, 'POS system name'),
    )}/v1/nfc/mobile`,
  accountPosCheckout: ({
    accountHandle,
    systemName,
    checkoutName,
    checkoutId,
  }: {
    accountHandle: AccountHandle;
    systemName: string;
    checkoutName: string;
    checkoutId: string;
  }) =>
    `/${encodeAccountHandle(accountHandle)}/pos/${encodeSegment(
      requireSegment(systemName, 'POS system name'),
    )}/v1/${encodeSegment(requireSegment(checkoutName, 'checkout name'))}/${encodeSegment(
      requireSegment(checkoutId, 'checkout ID'),
    )}/checkout`,
};

export const reservedRootSegments = new Set([
  'about',
  'access',
  'account',
  'admin',
  'affiliate',
  'ai-checkout',
  'ambassador',
  'ambassador-program',
  'announcements',
  'app',
  'api',
  'auth',
  'blog',
  'book',
  'bot-guide',
  'builder',
  'buyer-protection',
  'c',
  'chat',
  'checkout',
  'community',
  'confirm-email',
  'contract',
  'cookie-policy',
  'cookies',
  'creator',
  'creators',
  'custom-app-build',
  'dashboard',
  'demo',
  'disclaimer',
  'download',
  'earn',
  'edu',
  'edu-games',
  'enterprise',
  'eula',
  'export',
  'f',
  'features',
  'fees-plans',
  'forgot-password',
  'free-confirm',
  'fund',
  'g',
  'guardian-portal',
  'guidelines',
  'help',
  'imprint',
  'invest',
  'investments',
  'invite',
  'invoice',
  'jobs',
  'join',
  'learn',
  'listing',
  'live-chat',
  'log-in',
  'logged-out',
  'login',
  'management',
  'messages',
  'next-gen',
  'next-gen-invite',
  'next-gen-setup',
  'oauth',
  'p',
  'pages',
  'partners',
  'passkeys',
  'pay',
  'payment-success',
  'payout-info',
  'pd',
  'portfolio',
  'pricing',
  'privacy',
  'privacy-policy',
  'profile',
  'products',
  'proposal',
  'public-dm',
  'quick-pay',
  'r',
  'roadmap',
  's',
  'safety-controls',
  'sandbox',
  'search',
  'security',
  'selling-tips',
  'settings',
  'setup',
  'setup-account',
  'share',
  'sign-in',
  'signin',
  'sovereign',
  'status',
  'success',
  'support',
  'terms',
  'transparency',
  'treasure',
  'update-password',
  'upload-mobile',
  'verify',
  'warranty-rules',
  'welcome',
  'wersee-pay-security',
  'workspace',
]);

export const isReservedRootSegment = (value?: string) =>
  Boolean(value && reservedRootSegments.has(decodeRouteValue(value).toLowerCase()));

export const tryUserProfilePath = (value: unknown) => {
  try {
    return routes.userProfile({ username: identifiers.username(String(value || '')) });
  } catch {
    return null;
  }
};

export const tryUserProductPath = (username: unknown, productSlug: unknown) => {
  try {
    return routes.userProductBySlug({
      username: identifiers.username(String(username || '')),
      productSlug: identifiers.productSlug(String(productSlug || '')),
    });
  } catch {
    return null;
  }
};
