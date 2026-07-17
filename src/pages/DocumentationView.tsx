import React, { useState } from 'react';
import { 
  Search, Book, ChevronRight, 
  ExternalLink, MessageSquare, 
  Zap, Shield, Globe, Layout,
  Code, Terminal, Cpu, Database,
  ArrowLeft, Home, BookOpen,
  Sun, Moon, DollarSign, Sparkles,
  Gift, CreditCard, Wallet
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTheme } from '../context/ThemeContext';
import { PageWrapper } from '../components/PageWrapper';
import { useNavigate } from 'react-router-dom';

const DOCS_STRUCTURE = [
  {
    title: 'Getting Started',
    items: [
      { id: 'intro', title: 'Introduction', icon: Book },
      { id: 'quickstart', title: 'Quick Start Guide', icon: Zap },
      { id: 'installation', title: 'Installation', icon: Terminal }
    ]
  },
  {
    title: 'Core Concepts',
    items: [
      { id: 'architecture', title: 'Architecture', icon: Cpu },
      { id: 'database', title: 'Database Schema', icon: Database },
      { id: 'security', title: 'Security & Auth', icon: Shield },
      { id: 'oauth', title: 'OAuth 2.1', icon: Shield },
      { id: 'points', title: 'Wersee Points', icon: DollarSign }
    ]
  },
  {
    title: 'Finance & Monetization',
    items: [
      { id: 'finance', title: 'Finance Features', icon: Wallet }
    ]
  },
  {
    title: 'Community Features',
    items: [
      { id: 'channels', title: 'Channels & Spaces', icon: Layout },
      { id: 'gamification', title: 'XP & Levels', icon: Globe },
      { id: 'moderation', title: 'Moderation Tools', icon: Shield }
    ]
  }
];

export const DocumentationView = () => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('intro');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <PageWrapper>
      <div className={`flex flex-col md:flex-row min-h-[100dvh] overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#050505]' : 'bg-[#F5F5F7]'}`}>
        
        {/* Mobile Header */}
        <header className={`md:hidden flex items-center justify-between px-6 py-4 border-b shrink-0 z-50 ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-black/5'}`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`p-2 rounded-xl ${isDark ? 'bg-white/5 text-white' : 'bg-gray-100 text-black'}`}
            >
              <Layout className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-black tracking-tighter">DOCS</h1>
          </div>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-500'}`}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </header>

        {/* Sidebar Navigation */}
        <aside className={`
          fixed inset-0 z-[60] md:relative md:inset-auto md:flex md:w-80 border-r flex-col overflow-hidden transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${isDark ? 'bg-[#0A0A0A] border-white/5' : 'bg-white border-black/5'}
        `}>
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => navigate('/community')}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-blue-500 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back to Forum
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleTheme}
                  className={`hidden md:block p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}
                  title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className={`md:hidden p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-500'}`}
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              </div>
            </div>

            <h1 className="hidden md:block text-2xl font-black tracking-tighter">DOCS</h1>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text"
                placeholder="Search documentation..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all ${
                  isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-gray-100 border border-black/5 text-black'
                }`}
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 space-y-8 pb-8">
            {DOCS_STRUCTURE.map((section) => (
              <div key={section.title} className="space-y-2">
                <h3 className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {section.title}
                </h3>
                <div className="space-y-0.5">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        activeTab === item.id
                          ? (isDark ? 'bg-white text-black' : 'bg-black text-white shadow-lg')
                          : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-500 hover:bg-gray-100')
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-4 h-4 opacity-60" />
                        {item.title}
                      </div>
                      {activeTab === item.id && <ChevronRight className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[55] md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 md:px-12 py-12 md:py-24 space-y-8 md:space-y-12">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="prose prose-invert max-w-none"
            >
              <div className="flex items-center gap-3 text-blue-500 font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4">
                <BookOpen className="w-4 h-4" />
                Documentation / {activeTab}
              </div>
              <h1 className={`text-3xl md:text-5xl font-black tracking-tight mb-6 md:mb-8 ${isDark ? 'text-white' : 'text-black'}`}>
                {activeTab === 'intro' ? 'Introduction to Wersee' : 
                 activeTab === 'quickstart' ? 'Quick Start Guide' :
                 activeTab === 'architecture' ? 'System Architecture' : 
                 activeTab === 'points' ? 'Wersee Points & Payouts' : 
                 activeTab === 'finance' ? 'Finance Features' : 'Documentation Page'}
              </h1>
              
              <div className={`space-y-6 text-base md:text-lg leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTab === 'finance' ? (
                  <>
                    <p>
                      Wersee provides a comprehensive suite of financial tools designed to help creators monetize their communities, manage earnings, and offer flexible payment options to their members.
                    </p>

                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${isDark ? 'bg-emerald-500/5 border-emerald-500/10' : 'bg-emerald-50 border-emerald-100'}`}>
                      <h3 className="text-emerald-500 font-bold mb-4 flex items-center gap-2">
                        <Wallet className="w-5 h-5" /> The Finance Ecosystem
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">
                        Our finance ecosystem is built on top of Stripe and our internal Wersee Points system, ensuring secure, compliant, and flexible transactions globally.
                      </p>
                    </div>

                    <h3 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>Core Capabilities</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                          <CreditCard className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Fiat Payments</h4>
                        <p className="text-sm text-gray-500">
                          Accept credit cards, debit cards, and local payment methods globally via Stripe integration. Support for subscriptions and one-time purchases.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                          <Sparkles className="w-5 h-5 text-purple-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Crypto Onramp</h4>
                        <p className="text-sm text-gray-500">
                          Allow users to purchase cryptocurrencies (like USDC) directly with fiat currency using the embedded Stripe Crypto Onramp, bridging Web2 and Web3.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4">
                          <DollarSign className="w-5 h-5 text-yellow-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Wersee Points</h4>
                        <p className="text-sm text-gray-500">
                          An internal ledger system (100 Points = €1.00) that tracks earnings safely before KYC verification, allowing creators to spend within the ecosystem or cash out later.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                          <Shield className="w-5 h-5 text-green-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>KYC & Compliance</h4>
                        <p className="text-sm text-gray-500">
                          Built-in identity verification flows to comply with international regulations before allowing fiat payouts, protecting the platform and its users.
                        </p>
                      </div>
                    </div>

                    <h3 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>Managing Your Finances</h3>
                    <ul className="list-disc list-inside space-y-4 ml-2 md:ml-4 text-sm md:text-base mt-4">
                      <li><strong>Workspace Dashboard:</strong> View your total balance, recent transactions, and pending payouts in the Money section of your workspace.</li>
                      <li><strong>Payouts:</strong> Request withdrawals to your linked bank account once you have completed KYC verification and reached the minimum payout threshold.</li>
                      <li><strong>Invoices:</strong> Automatically generate and download invoices for all your sales and purchases for tax purposes.</li>
                    </ul>
                  </>
                ) : activeTab === 'points' ? (
                  <>
                    <p>
                      Wersee Points are the internal currency used to manage earnings and rewards within the ecosystem. 
                      They provide a secure way to track your sales value before you are fully verified.
                    </p>

                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${isDark ? 'bg-yellow-500/5 border-yellow-500/10' : 'bg-yellow-50 border-yellow-100'}`}>
                      <h3 className="text-yellow-600 font-bold mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5" /> The 100:1 Exchange Rate
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">
                        The exchange rate is fixed to ensure simplicity and transparency.
                      </p>
                      <div className="flex items-center justify-center gap-8 py-4">
                        <div className="text-center">
                          <div className="text-2xl font-black text-yellow-500">100</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Points</div>
                        </div>
                        <div className="text-2xl font-light opacity-30">=</div>
                        <div className="text-center">
                          <div className="text-2xl font-black text-blue-500">€1.00</div>
                          <div className="text-[10px] font-bold uppercase tracking-widest opacity-50">Euro</div>
                        </div>
                      </div>
                    </div>

                    <h3 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>How it Works</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                          <CreditCard className="w-5 h-5 text-green-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>1. Selling</h4>
                        <p className="text-sm text-gray-500">
                          When you sell a product for €10.00, you immediately receive 1,000 points in your workspace. 
                          These points represent the full value of your sale.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                          <Shield className="w-5 h-5 text-blue-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>2. Verification</h4>
                        <p className="text-sm text-gray-500">
                          To protect the marketplace, points are held until you complete your KYC (Know Your Customer) verification.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                          <Wallet className="w-5 h-5 text-purple-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>3. Payout</h4>
                        <p className="text-sm text-gray-500">
                          Once verified, you can convert your points back to EUR and withdraw them directly to your linked bank account.
                        </p>
                      </div>
                      <div className={`p-6 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-black/5 shadow-sm'}`}>
                        <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                          <Gift className="w-5 h-5 text-orange-500" />
                        </div>
                        <h4 className={`font-bold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>4. Spending</h4>
                        <p className="text-sm text-gray-500">
                          You don't have to wait for a payout! You can use your points anytime to buy products from other creators in the Wersee Store.
                        </p>
                      </div>
                    </div>

                    <div className={`mt-8 p-6 rounded-3xl border ${isDark ? 'bg-red-500/5 border-red-500/10' : 'bg-red-50 border-red-100'}`}>
                      <h4 className="text-red-500 font-bold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> Important Note
                      </h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Points are not a "discount" or "extra bonus" - they are the digital representation of your actual earnings. 
                        We use this system to ensure that all transactions are secure and that creators are verified before large sums of money are moved.
                      </p>
                    </div>
                  </>
                ) : activeTab === 'oauth' ? (
                  <>
                    <p>
                      Wersee supports OAuth 2.1, allowing you to integrate "Sign in with Wersee" into your own applications.
                      This enables you to authenticate users using their Wersee accounts and access their profile information securely.
                    </p>

                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                      <h3 className="text-blue-500 font-bold mb-4 flex items-center gap-2">
                        <Shield className="w-5 h-5" /> OAuth 2.1 Server
                      </h3>
                      <p className="text-sm leading-relaxed mb-4">
                        Our implementation supports the Authorization Code flow with PKCE, ensuring the highest level of security for your users.
                      </p>
                      <div className="grid grid-cols-1 gap-4 mt-6">
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-50">Authorization Endpoint</div>
                          <code className="text-[10px] md:text-xs font-mono break-all select-all">https://pkgwzusngqwnmdfpifnd.supabase.co/auth/v1/oauth/authorize</code>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-50">Token Endpoint</div>
                          <code className="text-[10px] md:text-xs font-mono break-all select-all">https://pkgwzusngqwnmdfpifnd.supabase.co/auth/v1/oauth/token</code>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-50">OIDC Discovery</div>
                          <code className="text-[10px] md:text-xs font-mono break-all select-all">https://pkgwzusngqwnmdfpifnd.supabase.co/auth/v1/.well-known/openid-configuration</code>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-50">JWKS Endpoint</div>
                          <code className="text-[10px] md:text-xs font-mono break-all select-all">https://pkgwzusngqwnmdfpifnd.supabase.co/auth/v1/.well-known/jwks.json</code>
                        </div>
                        <div className={`p-4 rounded-2xl ${isDark ? 'bg-black/20' : 'bg-white/50'}`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-1 opacity-50">Dynamic Registration</div>
                          <code className="text-[10px] md:text-xs font-mono break-all select-all">https://pkgwzusngqwnmdfpifnd.supabase.co/auth/v1/oauth/clients/register</code>
                        </div>
                      </div>
                    </div>

                    <h3 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>Integration Steps</h3>
                    <ol className="list-decimal list-inside space-y-4 ml-2 md:ml-4 text-sm md:text-base">
                      <li>Register your application as a Wersee OAuth app or use dynamic client registration.</li>
                      <li>Obtain your <strong>Client ID</strong> and <strong>Client Secret</strong>.</li>
                      <li>Implement the OAuth 2.1 flow in your application using a standard library or custom implementation.</li>
                      <li>Redirect users to the Authorization URL with your Client ID and required scopes.</li>
                    </ol>

                    <h3 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>Supported Scopes</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                      {[
                        { title: 'openid', desc: 'Required for OpenID Connect.' },
                        { title: 'email', desc: 'Access to user\'s email address.' },
                        { title: 'profile', desc: 'Access to basic profile information.' },
                        { title: 'phone', desc: 'Access to the user\'s phone number.' }
                      ].map((scope, i) => (
                        <li key={i} className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border ${isDark ? 'bg-white/2 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                          <h4 className={`font-bold mb-1 font-mono text-sm md:text-base ${isDark ? 'text-white' : 'text-black'}`}>{scope.title}</h4>
                          <p className="text-[10px] md:text-xs text-gray-500">{scope.desc}</p>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p>
                      Welcome to the official Wersee documentation. This guide will help you understand how to build, manage, and grow your community using our advanced hybrid platform.
                    </p>
                    
                    <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border ${isDark ? 'bg-blue-500/5 border-blue-500/10' : 'bg-blue-50 border-blue-100'}`}>
                      <h3 className="text-blue-500 font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5" /> What is Wersee?
                      </h3>
                      <p className="text-sm leading-relaxed">
                        Wersee is a next-generation community platform that combines the real-time interaction of Discord, the structured discussion of forums, and the educational power of online courses into a single, seamless experience.
                      </p>
                    </div>

                    <h2 className={`text-xl md:text-2xl font-bold pt-6 md:pt-8 ${isDark ? 'text-white' : 'text-black'}`}>Key Features</h2>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 list-none p-0">
                      {[
                        { title: 'Custom Namespaces', desc: 'Total freedom in channel naming.' },
                        { title: 'Polar.sh Sync', desc: 'Real-time tier-based gating.' },
                        { title: 'Gamification', desc: 'XP, Levels, and unlockable rewards.' },
                        { title: 'Hybrid Content', desc: 'Connect courses directly to forums.' }
                      ].map((feature, i) => (
                        <li key={i} className={`p-5 md:p-6 rounded-2xl md:rounded-3xl border ${isDark ? 'bg-white/2 border-white/5' : 'bg-white border-black/5 shadow-sm'}`}>
                          <h4 className={`font-bold mb-1 text-sm md:text-base ${isDark ? 'text-white' : 'text-black'}`}>{feature.title}</h4>
                          <p className="text-[10px] md:text-xs text-gray-500">{feature.desc}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-8 md:pt-12 flex flex-col sm:flex-row items-center gap-4 border-t border-white/5">
                      <button className={`w-full sm:w-auto p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all hover:scale-105 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-black shadow-sm'
                      }`}>
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        Ask the Community
                      </button>
                      <button className={`w-full sm:w-auto p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all hover:scale-105 ${
                        isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-black/5 text-black shadow-sm'
                      }`}>
                        <ExternalLink className="w-5 h-5 text-purple-500" />
                        API Reference
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </main>

        {/* Table of Contents / On this page */}
        <aside className="w-64 border-l hidden xl:block p-8 space-y-6">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">On this page</h4>
          <nav className="space-y-3">
            {['Overview', 'Key Features', 'Next Steps'].map((item) => (
              <button key={item} className="block text-xs font-medium text-gray-500 hover:text-blue-500 transition-colors">
                {item}
              </button>
            ))}
          </nav>
        </aside>
      </div>
    </PageWrapper>
  );
};
