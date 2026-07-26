import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Clock, ChevronRight, Share2, Printer, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { PageWrapper } from '../components/PageWrapper';
import { useTheme } from '../context/ThemeContext';

interface ArticleContent {
  title: string;
  lastUpdated: string;
  content: React.ReactNode;
}

const HELP_ARTICLES: Record<string, ArticleContent> = {
  'how-to-purchase': {
    title: 'How to purchase on Wersee',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Buying on Wersee is designed to be simple, secure, and transparent. Follow these steps to make your first purchase:</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">1. Find your item</h3>
          <p>Use the search bar or browse categories to find what you're looking for. You can filter by price, condition, and category.</p>
          
          <h3 className="text-xl font-bold">2. Review the details</h3>
          <p>Check the product description, photos, and seller ratings. For used goods, pay close attention to the condition notes.</p>
          
          <h3 className="text-xl font-bold">3. Add to bag or Buy Now</h3>
          <p>Click "Add to Bag" to continue shopping, or "Buy Now" to go straight to checkout.</p>
          
          <h3 className="text-xl font-bold">4. Secure Checkout</h3>
          <p>Enter your shipping address and choose your preferred payment method. All payments are processed securely through our encrypted gateway.</p>
        </div>
      </div>
    )
  },
  'payment-methods': {
    title: 'Payment Methods',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>We support a variety of payment methods to make your shopping experience convenient:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li><strong>Credit/Debit Cards:</strong> Visa, Mastercard, American Express.</li>
          <li><strong>iDEAL:</strong> The most popular payment method in the Netherlands.</li>
          <li><strong>PayPal:</strong> Secure payments using your PayPal balance or linked accounts.</li>
          <li><strong>Apple Pay & Google Pay:</strong> Fast checkout using your mobile wallet.</li>
          <li><strong>Wersee Credits:</strong> Use balance from your own sales or gift cards.</li>
        </ul>
      </div>
    )
  },
  'order-tracking': {
    title: 'Order Tracking',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Once your order is shipped, you can track its progress directly through Wersee:</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Where to find tracking</h3>
          <p>Go to <strong>My Account {'>'} Orders</strong> and select the order you want to track. You'll see a tracking number and a link to the carrier's website.</p>
          
          <h3 className="text-xl font-bold">Status Updates</h3>
          <p>We'll send you email notifications when your order is:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li>Confirmed</li>
            <li>Shipped</li>
            <li>Out for delivery</li>
            <li>Delivered</li>
          </ul>
        </div>
      </div>
    )
  },
  'refund-policy': {
    title: 'Refund Policy',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Our refund policy is built on fairness for both buyers and sellers.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">14-Day Return Window</h3>
          <p>For most items bought from professional sellers, you have 14 days from delivery to request a return.</p>
          
          <h3 className="text-xl font-bold">Eligibility</h3>
          <p>Items must be returned in the same condition they were received. Digital products are generally non-refundable once accessed, unless there is a technical defect.</p>
          
          <h3 className="text-xl font-bold">The Refund Process</h3>
          <p>Once the seller receives and inspects the item, your refund will be processed back to your original payment method within 5-10 business days.</p>
        </div>
      </div>
    )
  },
  'setting-up-your-shop': {
    title: 'Setting up your shop',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Ready to start selling? Here's how to set up a professional shop on Wersee:</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">1. Complete your profile</h3>
          <p>Add a profile picture, cover photo, and a compelling bio. Trust is key in a marketplace.</p>
          
          <h3 className="text-xl font-bold">2. Identity Verification</h3>
          <p>To receive payouts, you must verify your identity. This keeps Wersee safe for everyone.</p>
          
          <h3 className="text-xl font-bold">3. Configure Payouts</h3>
          <p>Link your bank account or Stripe account to receive your earnings.</p>
          
          <h3 className="text-xl font-bold">4. Create your first listing</h3>
          <p>Use our Listing Wizard to add photos, descriptions, and pricing. Use the AI features to optimize your content!</p>
        </div>
      </div>
    )
  },
  'payout-schedules': {
    title: 'Payout Schedules',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>We know getting paid is important. Here is how our payout system works:</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Escrow Period</h3>
          <p>When a buyer pays, the funds are held securely by Wersee. This protects both parties.</p>
          
          <h3 className="text-xl font-bold">Release Timing</h3>
          <p>Funds are typically released to your Wersee balance:</p>
          <ul className="list-disc pl-6 space-y-1 text-sm">
            <li><strong>Digital Items:</strong> 24-48 hours after purchase.</li>
            <li><strong>Physical Items:</strong> 3 days after confirmed delivery, or 14 days after shipping if delivery isn't confirmed.</li>
          </ul>
          
          <h3 className="text-xl font-bold">Bank Transfer</h3>
          <p>Once funds are in your balance, you can withdraw them to your bank account. Transfers usually take 1-3 business days.</p>
        </div>
      </div>
    )
  },
  'fees-and-commissions': {
    title: 'Fees & Commissions',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Wersee is free to join and list. We only make money when you do.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Selling Fee</h3>
          <p>We charge a flat <strong>5% commission</strong> on the total sale price (including shipping).</p>
          
          <h3 className="text-xl font-bold">Payment Processing</h3>
          <p>Standard payment processing fees apply (typically 1.9% + €0.25), depending on the payment method used by the buyer.</p>
          
          <h3 className="text-xl font-bold">No Hidden Costs</h3>
          <p>There are no monthly subscriptions or listing fees for standard accounts.</p>
        </div>
      </div>
    )
  },
  'shipping-guides': {
    title: 'Shipping Guides',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Proper shipping ensures happy customers and fewer disputes.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Packaging Tips</h3>
          <p>Use sturdy boxes and plenty of cushioning. For fragile items, double-boxing is recommended.</p>
          
          <h3 className="text-xl font-bold">Choosing a Carrier</h3>
          <p>We recommend using tracked shipping for all orders. In the NL, PostNL and DHL are our preferred partners.</p>
          
          <h3 className="text-xl font-bold">International Shipping</h3>
          <p>If selling internationally, ensure you include the correct HS codes for customs to avoid delays.</p>
        </div>
      </div>
    )
  },
  'resetting-password': {
    title: 'Resetting your password',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>If you've forgotten your password, don't worry. It's easy to reset:</p>
        <ol className="list-decimal pl-6 space-y-3">
          <li>Go to the <strong>Login</strong> page.</li>
          <li>Click on <strong>"Forgot Password?"</strong>.</li>
          <li>Enter your registered email address.</li>
          <li>Check your inbox for a reset link (don't forget the spam folder!).</li>
          <li>Click the link and choose a new, strong password.</li>
        </ol>
      </div>
    )
  },
  'two-factor-auth': {
    title: 'Two-Factor Authentication (2FA)',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Protect your account with an extra layer of security.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Why use 2FA?</h3>
          <p>Even if someone gets your password, they won't be able to access your account without your secondary code.</p>
          
          <h3 className="text-xl font-bold">How to enable</h3>
          <p>Go to <strong>Settings {'>'} Security {'>'} Two-Factor Authentication</strong>. You can use an authenticator app (like Google Authenticator) or SMS codes.</p>
        </div>
      </div>
    )
  },
  'verifying-identity': {
    title: 'Verifying your identity',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Verification helps us maintain a trusted community and comply with financial regulations.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">What you'll need</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>A valid government-issued ID (Passport, ID card, or Driver's License).</li>
            <li>A clear selfie.</li>
            <li>Proof of address (in some cases).</li>
          </ul>
          
          <h3 className="text-xl font-bold">How it works</h3>
          <p>We use secure, encrypted partners to process your documents. Most verifications are completed within minutes.</p>
        </div>
      </div>
    )
  },
  'closing-account': {
    title: 'Closing your account',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>We're sorry to see you go. If you've decided to close your account, please keep the following in mind:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>All active listings will be removed.</li>
          <li>You must have a zero balance (withdraw all funds first).</li>
          <li>All pending orders must be completed or cancelled.</li>
          <li>This action is permanent and cannot be undone.</li>
        </ul>
        <p>To proceed, go to <strong>Settings {'>'} Account {'>'} Close Account</strong>.</p>
      </div>
    )
  },
  'reporting-a-listing': {
    title: 'Reporting a listing',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Help us keep Wersee clean by reporting suspicious or prohibited items.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">When to report</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Counterfeit goods.</li>
            <li>Prohibited items (weapons, drugs, etc.).</li>
            <li>Harassment or offensive content.</li>
            <li>Fraudulent or misleading descriptions.</li>
          </ul>
          
          <h3 className="text-xl font-bold">How to report</h3>
          <p>On any listing page, click the <strong>"Report"</strong> button (usually found near the share button). Our moderation team reviews all reports within 24 hours.</p>
        </div>
      </div>
    )
  },
  'scam-prevention': {
    title: 'Scam Prevention',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Stay safe by following these golden rules of online shopping:</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Stay on Wersee</h3>
          <p>Never agree to pay or communicate outside of the Wersee platform. Scammers often try to move you to WhatsApp or direct bank transfers.</p>
          
          <h3 className="text-xl font-bold">If it's too good to be true...</h3>
          <p>It probably is. Be wary of high-end items listed at suspiciously low prices.</p>
          
          <h3 className="text-xl font-bold">Check Seller History</h3>
          <p>Look for established sellers with positive reviews. Be more cautious with brand new accounts selling expensive items.</p>
        </div>
      </div>
    )
  },
  'buyer-protection': {
    title: 'Buyer Protection Policy',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Wersee's Buyer Protection ensures you get what you paid for, or your money back.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">What is covered?</h3>
          <ul className="list-disc pl-6 space-y-1">
            <li>Item never arrived.</li>
            <li>Item is significantly different from the description.</li>
            <li>Item arrived damaged.</li>
          </ul>
          
          <h3 className="text-xl font-bold">How to use it</h3>
          <p>If there's an issue, first try to resolve it with the seller. If that fails, you can open a claim through our Buyer Protection portal within 14 days of delivery.</p>
        </div>
      </div>
    )
  },
  'warranty-rules': {
    title: 'Warranty Rules for Used Goods',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Understanding warranty for pre-owned items is crucial for both buyers and sellers.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">Professional vs. Private Sellers</h3>
          <p>Professional sellers must provide a minimum 1-year legal guarantee on used goods in the EU. Private sellers are generally not required to provide a warranty unless specified.</p>
          
          <h3 className="text-xl font-bold">Condition is Key</h3>
          <p>Warranty claims for used goods are evaluated based on the described condition at the time of sale. Normal wear and tear is not covered.</p>
        </div>
      </div>
    )
  },
  'storage-and-uploads': {
    title: 'Storage & File Uploads',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Manage your files easily within your workspace.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">1. Uploading from your Computer</h3>
          <p>You can upload files directly from your Windows or Mac storage by using the drag-and-drop feature or clicking the "Upload" button in your Workspace.</p>
          
          <h3 className="text-xl font-bold">2. Uploading from Cloud Providers</h3>
          <p>If your files are stored in Google Drive, OneDrive, Dropbox, or other cloud services, follow these steps:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Open your cloud storage provider's application or website.</li>
            <li>Download the file you want to upload to your local computer.</li>
            <li>Once downloaded, use the "Upload" button in your Workspace to select the file from your computer.</li>
          </ol>
          <p>We are constantly working on direct integrations to make this even easier in the future!</p>
        </div>
      </div>
    )
  },
  'convert-leads-with-one-link': {
    title: 'Convert leads with one link',
    lastUpdated: 'March 2026',
    content: (
      <div className="space-y-6">
        <p>Turn leads from other platforms into conversations on Wersee with a single link.</p>
        <div className="space-y-4">
          <h3 className="text-xl font-bold">How it works</h3>
          <p>You can create a custom link that directs users straight to a chat with you on Wersee.</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Go to your Messages or Workspace settings to generate your custom chat link.</li>
            <li>Share this link on your social media, website, or other platforms.</li>
            <li>When a user clicks the link, they are automatically taken to a chat with you on Wersee, making it easy to start a conversation.</li>
          </ol>
        </div>
      </div>
    )
  }
};

export const HelpArticle = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  
  const article = slug ? HELP_ARTICLES[slug] : null;

  if (!article) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Article not found</h1>
          <button onClick={() => navigate('/support')} className="text-blue-500 font-bold">Back to Support</button>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#FBFBFD] text-black'} pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))]`}>
        <div className="max-w-4xl mx-auto px-6">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-12">
            <button 
              onClick={() => navigate('/support')} 
              className="flex items-center text-sm font-medium text-gray-500 hover:text-blue-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Help Center
            </button>
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors">
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
                {article.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Last updated: {article.lastUpdated}
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300" />
                <div>5 min read</div>
              </div>
            </div>

            <div className={`prose prose-lg ${isDark ? 'prose-invert' : 'prose-neutral'} max-w-none`}>
              {article.content}
            </div>

            {/* Feedback Section */}
            <div className={`mt-24 p-12 rounded-[2.5rem] border text-center space-y-6 ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
              <h3 className="text-xl font-bold">Was this article helpful?</h3>
              <div className="flex items-center justify-center gap-4">
                <button className={`px-8 py-3 rounded-2xl font-bold border transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 hover:bg-white/10' : 'border-black/5 bg-white hover:shadow-lg'}`}>
                  Yes
                </button>
                <button className={`px-8 py-3 rounded-2xl font-bold border transition-all hover:scale-105 active:scale-95 ${isDark ? 'border-white/10 hover:bg-white/10' : 'border-black/5 bg-white hover:shadow-lg'}`}>
                  No
                </button>
              </div>
            </div>

            {/* Related Articles */}
            <div className="pt-12 border-t border-black/5 dark:border-white/10 space-y-6">
              <h3 className="text-xl font-bold">Related Articles</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link to="/help/buying/payment-methods" className={`p-6 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-[#141414] border-white/5 hover:bg-white/5' : 'bg-white border-black/5 hover:shadow-lg'}`}>
                  <span className="font-bold">Payment Methods</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>
                <Link to="/help/safety/buyer-protection" className={`p-6 rounded-2xl border flex items-center justify-between group transition-all ${isDark ? 'bg-[#141414] border-white/5 hover:bg-white/5' : 'bg-white border-black/5 hover:shadow-lg'}`}>
                  <span className="font-bold">Buyer Protection</span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </Link>
              </div>
            </div>

            {/* Still need help? */}
            <div className="p-10 bg-blue-600 text-white rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold">Still need help?</h3>
                <p className="text-blue-100">Our support team is available 24/7 to assist you.</p>
              </div>
              <button className="px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold hover:bg-blue-50 transition-all flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Contact Support
              </button>
            </div>
          </motion.article>
        </div>
      </div>
    </PageWrapper>
  );
};
