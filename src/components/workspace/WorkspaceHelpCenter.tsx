import React, { useState } from 'react';
import { 
  Search, Book, LifeBuoy, MessageCircle, FileText, 
  ChevronRight, ExternalLink, HelpCircle, Zap, 
  Shield, CreditCard, Users, GraduationCap, ArrowRight,
  PlayCircle, Sparkles, Globe, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { hapticFeedback } from '../../lib/haptics';

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

const categories = [
  { id: 'getting-started', name: 'Getting Started', icon: Zap, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'selling', name: 'Selling & Products', icon: Book, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'payments', name: 'Payments & Payouts', icon: CreditCard, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'community', name: 'Community Management', icon: Users, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { id: 'safety', name: 'Safety & Privacy', icon: Shield, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'ai', name: 'AI & Automations', icon: Sparkles, color: 'text-pink-400', bg: 'bg-pink-400/10' },
];

export const WorkspaceHelpCenter: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredFaqs = faqs.filter(faq => 
    (activeCategory === 'all' || faq.category.toLowerCase().includes(activeCategory.toLowerCase())) &&
    (faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
     faq.answer.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-400 rounded-full text-sm font-bold uppercase tracking-widest"
        >
          <LifeBuoy className="w-4 h-4" />
          Help Center
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-6xl font-black text-white tracking-tight"
        >
          How can we help you <span className="text-indigo-500">today?</span>
        </motion.h1>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative max-w-2xl mx-auto"
        >
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-500" />
          <input 
            type="text"
            placeholder="Search for articles, guides, or FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-14 pr-6 text-white text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-gray-600"
          />
        </motion.div>
      </div>

      {/* Quick Links Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickLinkCard 
          icon={FileText}
          title="Documentation"
          description="Detailed guides and API references for developers and power users."
          link="/community/docs"
          cta="Read Docs"
        />
        <QuickLinkCard 
          icon={GraduationCap}
          title="Wersee Academy"
          description="Learn how to grow your business with our video courses and tutorials."
          link="/features/academy-builder"
          cta="Start Learning"
        />
        <QuickLinkCard 
          icon={MessageCircle}
          title="Community Forum"
          description="Connect with other sellers, share tips, and get help from the community."
          link="/community"
          cta="Join Discussion"
        />
      </div>

      {/* Categories */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <ChevronRight className="w-6 h-6 text-indigo-500" />
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                hapticFeedback('light');
                setActiveCategory(cat.id === activeCategory ? 'all' : cat.id);
              }}
              className={`p-6 rounded-3xl border transition-all text-center space-y-3 group ${
                activeCategory === cat.id 
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
              icon={PlayCircle}
              title="Watch Tutorials"
              description="Visual guides to help you master the workspace."
              link="#"
            />
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
            <button 
              onClick={() => hapticFeedback('medium')}
              className="w-full py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Open AI Assistant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickLinkCard = ({ icon: Icon, title, description, link, cta }: any) => (
  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 space-y-6 hover:bg-white/10 transition-all group">
    <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
      <Icon className="w-7 h-7" />
    </div>
    <div className="space-y-2">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
    </div>
    <a 
      href={link}
      onClick={() => hapticFeedback('light')}
      className="inline-flex items-center gap-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
    >
      {cta}
      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </a>
  </div>
);

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
