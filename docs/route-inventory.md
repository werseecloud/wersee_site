# Route inventory

This inventory reflects the React Router declarations in `src/App.tsx`. The application is a Vite SPA using `BrowserRouter`; the order below is grouped by domain rather than declaration order. Static routes are intentionally omitted unless they affect a dynamic-route collision.

## Identifier rules

- `accountHandle` is the complete URL value, including `@`. It is validated as `^@[A-Za-z0-9._-]+$`.
- `username` is the database/profile value without `@`. It is validated separately and never normalized by an account-handle parser.
- `productId` is passed unchanged to `listings.id`; `productSlug` is passed unchanged to `listings.slug`.
- Generic `id` and `slug` declarations below retain their existing URL shape, but the semantic type in this inventory is the type actually queried by the component.
- Legacy payment routes accept either an account-handle segment or a username segment. `parseUsernameRouteValue` performs that explicit boundary conversion before a `profiles.username` query.
- `/:slugOrUsername` is not a username profile route in the current application. Values without `@` resolve a `businessSlug`; profile URLs use `/@:username`.

## Profiles, products and chat

| Route pattern | Parameter classification | Value source and rendered component | Backend resolver | Internal link sources |
| --- | --- | --- | --- | --- |
| `/announcements/:id` | `announcementId` | announcement record → `AnnouncementDetail` | `announcements.id` | announcement cards/lists |
| `/@:username` | `username` (without `@`; `@` is route syntax) | `profiles.username` → `Profile` | `profiles.username` | `routes.userProfile`, search, storefront and seller links |
| `/:slugOrUsername/profile` | `profileLookup` (legacy username or accountHandle) | URL → `Profile` | explicit accountHandle→username boundary, then `profiles.username` | legacy profile links |
| `/profile/:id` | `userId` | profile record ID → `Profile` | `profiles.id` | navbar creator search, `routes.profileByUserId` |
| `/:username/chat` | `username` | legacy public chat path → `Chat` | route value currently not consumed; chat rows use authenticated user IDs | legacy chat links |
| `/:username/chats` | `username` | legacy public chat path → `Chat` | same as above | legacy chat links |
| `/:username/messages` | `username` | legacy public chat path → `Chat` | same as above | legacy message links |
| `/:username/chat/invite/:token` | `username`, `inviteToken` | invitation link → `ChatInvitePage` | chat invitation token/RPC; username is legacy context | invite shares |
| `/:accountHandle/:productId/:productSlug/editor` | `accountHandle`, `productId`, `productSlug` | listing editor URL → `ListingDetail` | explicit accountHandle→`profiles.username`, then `listings.seller_id` + `listings.id` | typed registry/editor links |
| `/:accountHandle/:productSlug` | `accountHandle`, `productSlug` | seller listing URL → `ListingDetail` | explicit accountHandle→`profiles.username`, then `listings.seller_id` + `listings.slug` | home, search, related products, activity banner |
| `/listing/:productId` | `productId` | listing record ID → `ListingDetail` | `listings.id` | product cards, recommendations, editor preview |
| `/p/:productSlug` | `productSlug` | canonical product slug → `ListingDetail` | `listings.slug` | storefront builder, affiliate links |
| `/add/:userId` | `userId` | profile/friend target → `AddFriendPage` | `profiles.id`, friend relationship writes | friend invite links |
| `/chat/invite/:token` | `inviteToken` | chat invitation → `ChatInvitePage` | invitation token/RPC | chat invite shares |
| `/pd/:username` | `username` | public DM settings → `PublicDmPage` | `profiles.username`, public-DM configuration | `routes.publicDm`, workspace DM settings |
| `/public-dm/:username` | `username` | legacy public DM alias → `PublicDmPage` | same as above | legacy public-DM links |
| `/:slugOrUsername` | `businessSlug` or `accountHandle` | root public entity → `ProfileOrBusiness` | `@...` routes to `profiles.username`; otherwise `businesses.slug` | business storefront links; final dynamic route before `*` |

Unknown or malformed account/profile values render `User not found`, `Business Not Found`, or the application `NotFound` component. Reserved static roots are rejected before the root entity resolver.

## Workspace and business administration

| Route pattern | Parameter classification | Value source and rendered component | Backend resolver | Internal link sources |
| --- | --- | --- | --- | --- |
| `/dashboard/:businessId` | `businessId` | legacy dashboard link → typed redirect | no query in redirect; destination is `/workspace/:pageName` | legacy dashboard links |
| `/workspace/businesses/:businessId/invest` | `businessId` | business record → `BusinessInvestPage` | `businesses.id`, investment campaign queries | workspace investment UI |
| `/workspace/businesses/:businessId/invest/new` | `businessId` | business record → `BusinessInvestPage(new)` | `businesses.id` | campaign creation |
| `/workspace/businesses/:businessId/invest/:campaignId` | `businessId`, `campaignId` | campaign record → `BusinessInvestPage` | `businesses.id`, investment campaign ID | campaign management |
| `/workspace/businesses/:businessId/invest/:campaignId/edit` | `businessId`, `campaignId` | campaign record → `BusinessInvestPage(edit)` | same as above | campaign edit links |
| `/workspace/admin/investments/:campaignId` | `campaignId` | admin campaign → `AdminInvestmentsPage` | investment campaign ID | admin investment table |
| `/workspace/:pageName` | `workspacePageName` or legacy `businessId` | workspace navigation → `Dashboard` | authenticated `profiles.id`; page registry or business lookup in layout | legacy/static workspace links |
| `/workspace/:pageName/*` | `workspacePageName`, `nestedWorkspacePath` | nested workspace navigation → `Dashboard` | same as above | settings, CRM and management links |
| `/:accountHandle/workspace` | `accountHandle` | account-scoped workspace → `Dashboard` | explicit accountHandle→`profiles.username`; authenticated profile ownership check | `routes.accountWorkspace` |
| `/:accountHandle/workspace/:pageName` | `accountHandle`, `workspacePageName` | account-scoped page → `Dashboard` | same ownership check; persists `profiles.last_workspace_page` | registry-backed workspace navigation |
| `/:accountHandle/workspace/:pageName/*` | `accountHandle`, `workspacePageName`, `nestedWorkspacePath` | nested account workspace → `Dashboard` | same as above | settings, site and CRM navigation |
| `/portal/:businessSlug` | `businessSlug` | business portal → `BusinessPortal` | `businesses.slug` | seller and portal-management views |
| `/book/:configId` | `bookingConfigId` | booking configuration → `CallBooking` | call configuration ID | booking dashboard |
| `/:username/book/:configSlug` | `username`, `bookingConfigSlug` | user booking URL → `CallBooking` | username + call config slug | `routes.userBooking`, call wizard |
| `/:businessSlug/book/:configSlug` | `businessSlug`, `bookingConfigSlug` | business booking URL → `CallBooking` | business slug + call config slug | business booking links |

The last two booking patterns have identical path shapes. This pre-existing ambiguity is documented rather than silently changing the URL; `CallBooking` resolves the supplied fields against its existing data rules.

## Commerce, payments and POS

| Route pattern | Parameter classification | Value source and rendered component | Backend resolver | Internal link sources |
| --- | --- | --- | --- | --- |
| `/checkout/:id` | `productId` | cart/listing → `Checkout` | `listings.id` | asset and cart checkout actions |
| `/ai-checkout/:planId` | `planId` | plan → `AiPlanCheckout` | plan configuration/API | plans UI |
| `/success/:id` | `orderId` | checkout result → `Success` | order/access lookup | checkout completion |
| `/access/:id` | `productId` | owned listing → `AccessContent` | `listings.id`, orders/access records | course/library links |
| `/free-confirm/:id` | `productId` | free product → `FreeConfirmation` | listing/access records | free checkout |
| `/sandbox/pay/invoice/:username/:invoiceId` | `username`, `invoiceId` | sandbox invoice → `InvoicePaymentPage` | explicit username route parser, then `profiles.username` + invoice ID | sandbox invoice shares |
| `/sandbox/:username/quick-pay/:slug` | `username`, `paymentSlug` | sandbox payment link → `QuickPayCheckout` | `quick_pay_links.username` + slug | workspace payment links |
| `/s/:username/quick-pay/:slug` | `username`, `paymentSlug` | short sandbox payment link → `QuickPayCheckout` | same as above | workspace payment links |
| `/pay/invoice/:username/:invoiceId` | `username`, `invoiceId` | invoice payment → `InvoicePaymentPage` | explicit username route parser + invoice ID/slug | `routes.invoicePaymentByUsername`, chat invoices |
| `/invoice/view/:invoiceId` | `invoiceId` | invoice PDF → `InvoicePdfViewer` | invoice ID | invoices workspace |
| `/quick-pay/invoice/:invoiceNumber` | `invoiceNumber` | legacy invoice payment → old `InvoicePaymentPage` | invoice number | legacy invoice links |
| `/quick-pay/:username/:slug` | `username`, `paymentSlug` | payment link → `QuickPayCheckout` | `quick_pay_links.username` + slug | `routes.quickPayByUsername`, chat pay links |
| `/:username/quick-pay/invoice/:slug` | `username`, `invoiceSlug` | account invoice link → old `InvoicePaymentPage` | explicit username route parser + invoice slug | `routes.userQuickPayInvoice` |
| `/:username/quick-pay/:slug` | `username`, `paymentSlug` | account payment link → `QuickPayCheckout` | explicit username route parser + payment slug | `routes.userQuickPay` |
| `/:username/invoice/:slug` | `username`, `invoiceSlug` | public invoice → `InvoicePublicView` | explicit username route parser + invoice slug | `routes.userInvoice` |
| `/proposal/:id` | `proposalId` | proposal record → `ProposalPublicView` | proposals ID | proposals workspace |
| `/contract/:id` | `contractId` | contract record → `ContractPublicView` | contracts ID | contracts workspace |
| `/:username/subscriptions/:slug` | `username`, `subscriptionSlug` | public subscription → `SubscriptionPublicView` | explicit username route parser + subscription slug | `routes.userSubscription` |
| `/:accountHandle/pos/:systemname/v1` | `accountHandle`, `posSystemName` | account POS → `PosTerminal` | explicit accountHandle→`profiles.username`, then POS/listing data | `routes.userPosTerminal` / `routes.accountPosTerminal` |
| `/:accountHandle/pos/:systemname/v1/nfc/mobile` | `accountHandle`, `posSystemName` | NFC handoff → `PosNfcMobile` | checkout/POS data | `routes.accountPosNfc` |
| `/:accountHandle/pos/:systemname/v1/:checkout_name/:checkout_id/checkout` | `accountHandle`, `posSystemName`, `checkoutName`, `checkoutId` | POS checkout → `PosCheckoutPage` | checkout ID | `routes.accountPosCheckout` |
| `/:accountHandle/:systemname/qr-pay/:id` | `accountHandle`, `posSystemName`, `checkoutId` | QR checkout → `PosCheckoutPage` | checkout ID | POS QR shares |
| `/auth/:systemname/:token` | `posSystemName`, `authToken` | POS authorization → `PosAuth` | POS auth token | POS device pairing |

## Creator and investment routes

| Route pattern | Parameter classification | Value source and rendered component | Backend resolver | Internal link sources |
| --- | --- | --- | --- | --- |
| `/r/:username` | `username` | creator referral → `CreatorReferralRedirect` | `creator_profiles.username`, affiliate attribution | creator referral registry |
| `/r/:username/:slug` | `username`, `referralSlug` | referral link → `CreatorReferralRedirect` | creator username + affiliate link slug | creator links |
| `/creators/invite/:username` | `username` | creator invite → `CreatorInvites` | creator/profile username | creator dashboard |
| `/creator/:username` | `username` | public creator → `PublicCreatorProfile` | explicit username parser, `creator_profiles.username` | creator dashboard/home |
| `/:accountHandle/invest/:sessionId` | `accountHandle`, `investmentSessionId` | scoped investment market → `InvestMarketplace` | validated account handle; investment/feed queries use session context | `routes.userInvest` / `routes.accountInvest` |
| `/:accountHandle/invest/:sessionId/stocks/:slug` | `accountHandle`, `investmentSessionId`, `assetSlug` | stock → `MarketAssetDetail` | market API by canonical slug | investment cards |
| `/:accountHandle/invest/:sessionId/etfs/:slug` | same, `assetSlug` | ETF → `MarketAssetDetail` | market API by canonical slug | investment cards |
| `/:accountHandle/invest/:sessionId/crypto/:slug` | same, `assetSlug` | crypto asset → `MarketAssetDetail` | market API by canonical slug | investment cards |
| `/:accountHandle/invest/:sessionId/wersee/:slug` | same, `investmentListingSlug` | Wersee listing → `WerseeListingDetail` | investment listing slug | investment cards |
| `/:accountHandle/invest/:sessionId/:campaignSlug` | `accountHandle`, `investmentSessionId`, `campaignSlug` | campaign → `InvestCampaignDetail` | investment campaign slug | campaign cards |
| `/:accountHandle/invest/:sessionId/:campaignSlug/checkout` | same | campaign checkout → `InvestCheckout` | campaign slug + payment APIs | invest call-to-action |
| `/invest/stocks/:slug` | `assetSlug` | unscoped stock → `MarketAssetDetail` | market API | public market |
| `/invest/etfs/:slug` | `assetSlug` | unscoped ETF → `MarketAssetDetail` | market API | public market |
| `/invest/crypto/:slug` | `assetSlug` | unscoped crypto → `MarketAssetDetail` | market API | public market |
| `/invest/wersee/:slug` | `investmentListingSlug` | unscoped Wersee listing → `WerseeListingDetail` | investment listing slug | public market |
| `/invest/:campaignSlug` | `campaignSlug` | public campaign → `InvestCampaignDetail` | campaign slug | campaign cards |
| `/invest/:campaignSlug/checkout` | `campaignSlug` | public campaign checkout → `InvestCheckout` | campaign slug + payment APIs | campaign CTA |
| `/investments/:id` | `investmentId` | legacy investment detail → `InvestmentDetails` | investment ID | portfolio/investments |

## Sharing, content and other entity IDs

| Route pattern | Parameter classification | Value source and rendered component | Backend resolver | Internal link sources |
| --- | --- | --- | --- | --- |
| `/share/:token` | `shareToken` | shared file → `SharedFileView` | file share token | file sharing |
| `/export/interactive/:sessionId` | `exportSessionId` | interactive export → `InteractiveExportView` | export session storage/API | export flow |
| `/community/:id` | `communityId` | community record → `CommunityView` | communities ID | community cards/invites |
| `/help/:slug` | `helpArticleSlug` | help content → `HelpArticle` | local help article registry | support links |
| `/upload-mobile/:sessionId` | `uploadSessionId` | mobile upload → `MobileUpload` | upload session | QR upload flow |
| `/next-gen-invite/:token` | `inviteToken` | next-gen invitation → `NextGenInvite` | invitation token | guardian flow |
| `/jobs/:id/apply` | `jobId` | job listing → `JobApplication` | listings/jobs ID | job detail |
| `/invite/:role/:token` | `inviteRole`, `inviteToken` | role invitation → `InvitePage` | invite token + role | team invites |
| `/invite/:token` | `inviteToken` | generic invitation → `InvitePage` | invite token | team invites |
| `/join/c/:communityId/:communityName` | `communityId`, `communityName` | community invite → `CommunityInvitePage` | community ID | community shares |
| `/join/i/:inviteCode` | `inviteCode` | community invite → `CommunityInvitePage` | invite code | community shares |
| `/c/:customUrl` | `communityCustomUrl` | community vanity URL → `CommunityInvitePage` | community custom URL | community shares |
| `/community/:communityId/m/:messageId` | `communityId`, `messageId` | shared message → `MessageSharePage` | message ID scoped to community ID | message sharing |
| `/app/:appId` | `appId` | custom app → `CustomAppLP` | app ID/slug | `routes.appById`, app builder |
| `/g/:id` | `giveawayId` | giveaway → `GiveawayLandingPage` | giveaway ID | giveaways workspace |
| `/f/:slug` | `formSlug` | public form → `FormPublicView` | form slug | forms workspace |
| `/builder/:type` | `builderType` | builder selector → `BuilderPage` | local builder registry | workspace create actions |
| `/builder/:type/:id` | `builderType`, entity-specific `id` | editor → `BuilderPage` | proposal/contract/invoice ID according to type | edit actions |
| `/welcome/:source` | `campaignSource` | social landing → `SocialLandingPage` | analytics source only | campaign links |

## Collision and fallback order

React Router ranks static segments above dynamic segments, and the catch-all `*` remains last. `reservedRootSegments` additionally protects known static roots such as `login`, `pricing`, `settings`, `api`, `workspace`, and `products` from the root entity resolver. Vercel handles only the server fallback; application-level unknown routes are rendered by `NotFound`.
