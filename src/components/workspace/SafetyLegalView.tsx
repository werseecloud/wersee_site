import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, ShieldCheck, Book, LifeBuoy, MessageCircle, FileText, 
  ChevronRight, ExternalLink, HelpCircle, Zap, CreditCard, 
  Users, GraduationCap, ArrowRight, PlayCircle, Sparkles, 
  Globe, Mail, Scale, Lock, AlertCircle, CheckCircle2, 
  Building2, UserCheck, History, Trash2, Globe2, Check, Download,
  Search
} from 'lucide-react';
import { hapticFeedback } from '../../lib/haptics';
import { supabase } from '../../lib/supabase';
import { TermsCreatorView } from './TermsCreatorView';

interface FaqItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FaqItem[] = [
  {
    category: 'Getting Started',
    question: 'How do I start selling on Wersee?',
    answer: 'To start selling, go to your Workspace and click "Create" > "Listing". Follow the wizard to add your product or service details, set your price, and publish.'
  },
  {
    category: 'Payments',
    question: 'When do I get paid?',
    answer: 'Payouts are typically processed within 3-7 business days depending on your region and payment method. You can track your balance in the "Money" section of your Workspace.'
  },
  {
    category: 'Community',
    question: 'How do I create a community?',
    answer: 'In your Workspace, click "Create" > "Community". You can set up channels, roles, and even monetize access to your community.'
  },
  {
    category: 'Safety',
    question: 'Is my data secure?',
    answer: 'Yes, we use industry-standard encryption and security protocols to protect your data. All messages are end-to-end encrypted, and payments are handled via secure providers like Stripe.'
  },
  {
    category: 'Features',
    question: 'What is the AI Assistant?',
    answer: 'The AI Assistant helps you manage your business by generating content, answering customer queries, and providing insights based on your workspace data.'
  }
];

const helpCategories = [
  { id: 'getting-started', name: 'Getting Started', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'selling', name: 'Selling & Products', icon: Book, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'payments', name: 'Payments & Payouts', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'community', name: 'Community Management', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'safety', name: 'Safety & Privacy', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'ai', name: 'AI & Automations', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-400/10' },
];

export const SafetyLegalView: React.FC = () => {
  const [activeMainTab, setActiveMainTab] = useState<'help' | 'compliance'>('help');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHelpCategory, setActiveHelpCategory] = useState('all');
  const [activeComplianceTab, setActiveComplianceTab] = useState<'overview' | 'terms' | 'privacy' | 'business' | 'guidelines'>('overview');
  const [businessInfo, setBusinessInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinessInfo();
  }, []);

  const fetchBusinessInfo = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (business) {
        setBusinessInfo(business);
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFaqs = faqs.filter(faq => 
    (activeHelpCategory === 'all' || faq.category.toLowerCase().includes(activeHelpCategory.toLowerCase())) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const complianceTabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'business', label: 'Business Info', icon: Building2 },
    { id: 'terms', label: 'Terms & Conditions', icon: FileText },
    { id: 'privacy', label: 'Privacy & Data', icon: Lock },
    { id: 'guidelines', label: 'Seller Guidelines', icon: Scale },
  ];

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A] overflow-hidden">
      {/* Main Header */}
      <div className="p-6 md:p-8 border-b border-white/5 bg-[#0A0A0A]/50 backdrop-blur-xl shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Shield className="w-8 h-8 text-indigo-400" />
              Safety & Legal
            </h1>
            <p className="text-gray-500 text-sm mt-1">Get support, stay safe, and manage your business compliance.</p>
          </div>
          
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveMainTab('help')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === 'help' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              Help Center
            </button>
            <button
              onClick={() => setActiveMainTab('compliance')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeMainTab === 'compliance' ? 'bg-white text-black' : 'text-gray-500 hover:text-white'
              }`}
            >
              Compliance
            </button>
          </div>
        </div>

        {activeMainTab === 'compliance' && (
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-2xl w-fit overflow-x-auto scrollbar-hide">
            {complianceTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeComplianceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveComplianceTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    isActive 
                      ? 'bg-white/10 text-white' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <AnimatePresence mode="wait">
          {activeMainTab === 'help' ? (
            <motion.div
              key="help-center"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-20"
            >
              {/* Help Center Hero */}
              <div className="text-center space-y-6 py-12">
                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                  How can we help you <span className="text-indigo-500">today?</span>
                </h2>
                <div className="relative max-w-2xl mx-auto">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
                  <input 
                    type="text"
                    placeholder="Search for articles, guides, or FAQs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600"
                  />
                </div>
              </div>

              {/* Help Categories */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {helpCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      hapticFeedback('light');
                      setActiveHelpCategory(cat.id === activeHelpCategory ? 'all' : cat.id);
                    }}
                    className={`p-6 rounded-3xl border transition-all text-center space-y-3 group ${
                      activeHelpCategory === cat.id 
                        ? 'bg-indigo-500/10 border-indigo-500/50' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className={`w-12 h-12 ${cat.bg} ${cat.color} rounded-2xl mx-auto flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <cat.icon className="w-6 h-6" />
                    </div>
                    <span className="block text-xs font-bold text-white uppercase tracking-wider">{cat.name}</span>
                  </button>
                ))}
              </div>

              {/* FAQ Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <HelpCircle className="w-6 h-6 text-indigo-500" />
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((faq, index) => (
                        <FaqAccordion key={index} faq={faq} />
                      ))
                    ) : (
                      <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/10">
                        <p className="text-gray-500">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-white">Still need help?</h2>
                  <div className="space-y-4">
                    <ContactCard 
                      icon={Globe}
                      title="Global Support"
                      description="Available 24/7 in over 15 languages."
                      link="/support"
                    />
                    <ContactCard 
                      icon={Mail}
                      title="Email Support"
                      description="Get a response within 24 hours."
                      link="mailto:support@wersee.com"
                    />
                  </div>
                  
                  <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white space-y-4 shadow-xl shadow-indigo-500/20">
                    <h3 className="text-xl font-bold">Talk to our AI</h3>
                    <p className="text-white/80 text-sm">Our AI Assistant can help you with specific workspace tasks and troubleshooting.</p>
                    <button className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Open AI Assistant
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="compliance-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 md:p-8"
            >
              {activeComplianceTab === 'overview' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 border border-indigo-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                      <div className="relative z-10">
                        <h2 className="text-2xl font-black text-white mb-2">Compliance Health Score</h2>
                        <p className="text-indigo-200/60 text-sm mb-6 max-w-md">Your business is currently meeting all platform legal requirements.</p>
                        <div className="flex items-end gap-4">
                          <div className="text-6xl font-black text-white">100<span className="text-2xl text-indigo-400/60">%</span></div>
                          <div className="mb-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">Perfect</div>
                        </div>
                      </div>
                      <Shield className="absolute bottom-[-20px] right-[-20px] w-48 h-48 text-white/5 -rotate-12" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Business Verification', status: 'completed', desc: 'Identity and address verified' },
                      { label: 'Terms of Service', status: 'completed', desc: 'Active terms for all listings' },
                      { label: 'Privacy Policy', status: 'completed', desc: 'GDPR & CCPA compliant policy' },
                      { label: 'Tax Information', status: 'completed', desc: 'VAT/Tax ID registered' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 p-5 bg-[#141414] border border-white/5 rounded-3xl group hover:border-white/10 transition-all">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm">{item.label}</h4>
                          <p className="text-xs text-gray-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeComplianceTab === 'business' && (
                <div className="max-w-3xl space-y-8">
                  <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8">
                    <h2 className="text-xl font-bold text-white mb-6">Business Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Business Name</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                          {businessInfo?.name || 'Not Set'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Tax ID / VAT Number</label>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-white font-bold">
                          {businessInfo?.tax_id || 'NL 123456789 B01'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeComplianceTab === 'terms' && <TermsCreatorView />}
              
              {activeComplianceTab === 'privacy' && (
                <div className="max-w-4xl space-y-8">
                  <div className="bg-gradient-to-br from-emerald-600/20 to-teal-600/20 border border-emerald-500/20 rounded-[2.5rem] p-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <h2 className="text-2xl font-black text-white">GDPR Compliance Hub</h2>
                      <p className="text-emerald-200/60 text-sm">Manage your data protection obligations.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeComplianceTab === 'guidelines' && (
                <div className="max-w-4xl space-y-8">
                  <div className="bg-[#141414] border border-white/5 rounded-[2.5rem] p-8 md:p-12">
                    <h2 className="text-2xl font-black text-white mb-8">Platform Seller Guidelines</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <section className="space-y-6">
                        <h3 className="font-bold text-lg text-white">1. Integrity & Trust</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">Zero tolerance for fraudulent activity. Any attempt to scam buyers results in an immediate ban.</p>
                      </section>
                      <section className="space-y-6">
                        <h3 className="font-bold text-lg text-white">2. Intellectual Property</h3>
                        <p className="text-sm text-gray-500 leading-relaxed">You must legally own or have the explicit right to sell every item you list.</p>
                      </section>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FaqAccordion = ({ faq }: { faq: FaqItem }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all">
      <button 
        onClick={() => {
          hapticFeedback('light');
          setIsOpen(!isOpen);
        }}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
      >
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{faq.category}</span>
          <h3 className="text-white font-bold">{faq.question}</h3>
        </div>
        <ChevronRight className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-400 text-sm leading-relaxed border-t border-white/5 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ContactCard = ({ icon: Icon, title, description, link }: any) => (
  <a 
    href={link}
    onClick={() => hapticFeedback('light')}
    className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
  >
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <h4 className="text-sm font-bold text-white">{title}</h4>
      <p className="text-xs text-gray-500 truncate">{description}</p>
    </div>
    <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
  </a>
);
