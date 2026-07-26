import React, { useState } from 'react';
import { 
  Search, MessageCircle, Mail, Phone, 
  ChevronRight, ShoppingBag, ShieldCheck, 
  User, CreditCard, LifeBuoy, ArrowLeft,
  MessageSquare, HelpCircle, Zap, HardDrive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { PageWrapper } from '../components/PageWrapper';
import { useTheme } from '../context/ThemeContext';
import { SEO } from '../components/SEO';

const SUPPORT_CATEGORIES = [
  {
    id: 'buying',
    title: 'Buying on Wersee',
    icon: ShoppingBag,
    color: 'blue',
    articles: [
      { title: 'How to purchase', slug: 'how-to-purchase' },
      { title: 'Payment methods', slug: 'payment-methods' },
      { title: 'Order tracking', slug: 'order-tracking' },
      { title: 'Refund policy', slug: 'refund-policy' }
    ]
  },
  {
    id: 'selling',
    title: 'Selling & Payouts',
    icon: Zap,
    color: 'emerald',
    articles: [
      { title: 'Setting up your shop', slug: 'setting-up-your-shop' },
      { title: 'Payout schedules', slug: 'payout-schedules' },
      { title: 'Fees & commissions', slug: 'fees-and-commissions' },
      { title: 'Shipping guides', slug: 'shipping-guides' }
    ]
  },
  {
    id: 'account',
    title: 'Account & Security',
    icon: User,
    color: 'purple',
    articles: [
      { title: 'Resetting password', slug: 'resetting-password' },
      { title: 'Two-factor auth', slug: 'two-factor-auth' },
      { title: 'Verifying identity', slug: 'verifying-identity' },
      { title: 'Closing account', slug: 'closing-account' }
    ]
  },
  {
    id: 'safety',
    title: 'Safety & Trust',
    icon: ShieldCheck,
    color: 'orange',
    articles: [
      { title: 'Buyer protection', slug: 'buyer-protection' },
      { title: 'Reporting a listing', slug: 'reporting-a-listing' },
      { title: 'Scam prevention', slug: 'scam-prevention' },
      { title: 'Warranty rules', slug: 'warranty-rules' }
    ]
  },
  {
    id: 'storage',
    title: 'Storage & Files',
    icon: HardDrive,
    color: 'blue',
    articles: [
      { title: 'Storage & File Uploads', slug: 'storage-and-uploads' }
    ]
  },
  {
    id: 'messages',
    title: 'Messages & Leads',
    icon: MessageSquare,
    color: 'purple',
    articles: [
      { title: 'Convert leads with one link', slug: 'convert-leads-with-one-link' }
    ]
  }
];

const FAQS = [
  {
    question: "How do I get my money back if an item doesn't arrive?",
    answer: "Our Buyer Protection covers you. If an item doesn't arrive or is significantly not as described, you can open a dispute within 14 days of the estimated delivery date."
  },
  {
    question: "When will I receive my payout as a seller?",
    answer: "Payouts are typically processed 7 days after the buyer confirms receipt of the item, or 14 days after the item is marked as delivered."
  },
  {
    question: "Can I sell digital products and physical goods?",
    answer: "Yes! Wersee supports physical goods, digital products, online courses, and even virtual items like game skins."
  }
];

export const Support = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PageWrapper>
      <SEO 
        title="Help Center - Wersee Support"
        description="Find answers to your questions about buying, selling, account security, and safety on Wersee. Contact our support team for assistance."
        url="/support"
      />
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-[#050505] text-white' : 'bg-[#FBFBFD] text-black'} pb-24 pt-[calc(4rem+max(env(safe-area-inset-top),0px))]`}>
        {/* Hero Section */}
        <div className={`relative overflow-hidden py-24 ${isDark ? 'bg-white/5' : 'bg-black text-white'}`}>
          <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">How can we help?</h1>
              <div className="max-w-2xl mx-auto relative">
                <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for articles, guides, or help..."
                  className={`w-full pl-16 pr-8 py-6 rounded-[2rem] text-lg outline-none transition-all border-none ${
                    isDark ? 'bg-white/10 text-white placeholder-gray-500 focus:bg-white/20' : 'bg-white text-black placeholder-gray-400 shadow-2xl'
                  }`}
                />
              </div>
            </motion.div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-500 blur-[120px]" />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
            {[
              { icon: MessageCircle, label: 'Live Chat', desc: 'Average wait: 2 mins', action: 'Start Chat', path: '/live-chat' },
              { icon: Mail, label: 'Email Support', desc: 'Response within 24h', action: 'Send Email', path: 'mailto:support@wersee.com' },
              { icon: MessageSquare, label: 'Community', desc: 'Ask fellow members', action: 'Visit Forum', path: '/community/general' }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-8 rounded-[2.5rem] border shadow-xl flex flex-col items-center text-center space-y-4 transition-transform hover:scale-[1.02] ${
                  isDark ? 'bg-[#141414] border-white/10' : 'bg-white border-black/5'
                }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-bold text-xl">{item.label}</h3>
                  <p className="text-sm text-gray-500">{item.desc}</p>
                </div>
                <button 
                  onClick={() => item.path.startsWith('http') || item.path.startsWith('mailto') ? window.location.href = item.path : navigate(item.path)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                  isDark ? 'bg-white text-black hover:bg-gray-200' : 'bg-black text-white hover:bg-gray-800'
                }`}>
                  {item.action}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Categories Grid */}
          <div className="space-y-12 mb-24">
            <h2 className="text-3xl font-bold">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {SUPPORT_CATEGORIES.map((cat, i) => (
                <div key={cat.id} className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      cat.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
                      cat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' :
                      cat.color === 'purple' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-orange-500/10 text-orange-500'
                    }`}>
                      <cat.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-lg">{cat.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {cat.articles.map((art, j) => (
                      <li key={j}>
                        <Link 
                          to={art.slug === 'buyer-protection' ? '/buyer-protection' : art.slug === 'warranty-rules' ? '/warranty-rules' : `/help/${art.slug}`}
                          className="text-gray-500 hover:text-blue-500 transition-colors flex items-center group text-sm font-medium"
                        >
                          {art.title}
                          <ChevronRight className="w-4 h-4 ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className={`p-12 rounded-[3rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-black/5'}`}>
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
                <p className="text-gray-500">Quick answers to common questions.</p>
              </div>
              
              <div className="space-y-6">
                {FAQS.map((faq, i) => (
                  <div key={i} className={`p-8 rounded-3xl border transition-all hover:shadow-lg ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-black/5'}`}>
                    <h4 className="font-bold text-lg mb-3 flex items-start gap-3">
                      <HelpCircle className="w-5 h-5 mt-1 text-blue-500 shrink-0" />
                      {faq.question}
                    </h4>
                    <p className="text-gray-500 leading-relaxed pl-8">{faq.answer}</p>
                  </div>
                ))}
              </div>

              <div className="text-center pt-8">
                <button className="text-sm font-bold text-blue-500 hover:underline">
                  View all FAQs →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
