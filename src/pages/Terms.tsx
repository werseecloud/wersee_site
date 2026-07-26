import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Globe, Lock, CreditCard, Users, Scale, FileText, ExternalLink, ArrowRight, X, Mail, MessageSquare, Clock, MapPin, Play, Pause, Download, Volume2, Database, AlertTriangle, XCircle } from 'lucide-react';
import { SEO } from '../components/SEO';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const sections = [
  { id: 'definitions', label: '1. Definitions & Tiers', icon: Users },
  { id: 'kyc', label: '2. KYC & AML', icon: ShieldCheck },
  { id: 'vault', label: '3. Wersee Vault', icon: Lock },
  { id: 'credits', label: '4. Wersee Credits', icon: CreditCard },
  { id: 'fees', label: '5. Fees & Splits', icon: FileText },
  { id: 'tax', label: '6. Localized Advice', icon: Globe },
  { id: 'guardian', label: '7. Guardian Role', icon: Users },
  { id: 'legal', label: '8. Governing Law', icon: Scale },
  { id: 'withdrawal', label: '9. Right of Withdrawal', icon: ShieldCheck },
  { id: 'acceptable-use', label: '10. Acceptable Use', icon: ShieldCheck },
  { id: 'intellectual-property', label: '11. Intellectual Property', icon: FileText },
  { id: 'ai-disclaimer', label: '12. AI Disclaimer', icon: Globe },
  { id: 'liability', label: '13. Limitation of Liability', icon: Scale },
  { id: 'indemnification', label: '14. Indemnification', icon: Users },
  { id: 'termination', label: '15. Termination', icon: Lock },
  { id: 'data-consent', label: '16. Data Processing Consent', icon: Database },
];

const externalLinks = [
  { title: 'Stripe Privacy Policy', url: 'https://stripe.com/privacy', desc: 'Payment processing privacy terms' },
  { title: 'Stripe Services Agreement', url: 'https://stripe.com/legal/ssa', desc: 'Terms for using Stripe services' },
  { title: 'Supabase Privacy Policy', url: 'https://supabase.com/privacy', desc: 'Database and authentication privacy' },
  { title: 'Supabase Terms of Service', url: 'https://supabase.com/terms', desc: 'Terms for using Supabase' },
];

export const Terms = () => {
  const [activeSection, setActiveSection] = useState<string>('');
  const [showContactLegal, setShowContactLegal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      audioRef.current?.play().catch(err => console.error("Audio playback failed:", err));
      setIsPlaying(true);
    }
  };

  const handleDownload = () => {
    // Redirect to the proxy download route
    window.location.href = '/download/terms-audio';
  };

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      <SEO
        title="Terms of Service"
        description="Read the Wersee Terms of Service. Learn about user tiers, KYC/AML policies, fees, intellectual property, and your rights as a creator or buyer on our platform."
        url="/terms"
        keywords="wersee terms of service, user agreement, creator terms, marketplace rules, digital products terms"
      />
      <div className="min-h-screen bg-[#0A0A0B] text-gray-300 pt-24 pb-24 px-4 sm:px-6 lg:px-8 selection:bg-blue-500/30 selection:text-blue-200 scrollbar-hide">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef}
          src="https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/audio_files/terms_audio.mp3"
          onEnded={() => setIsPlaying(false)}
        />

        {/* Header Area */}
        <div className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-sm font-semibold mb-6 border border-blue-500/20">
                <Scale className="w-4 h-4" />
                <span>Last Updated: March 2026</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
                Terms of <span className="text-blue-500">Service</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-400 leading-relaxed max-w-2xl">
                Welcome to the <span className="text-white font-bold">Wersee Treasury</span>, the financial engine that powers the Wersee ecosystem. These terms govern how you <strong className="text-white">earn, store, and withdraw funds</strong> on our platform safely and legally.
              </p>
            </motion.div>

            {/* Audio Controls */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-4 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center">
                <Volume2 className={cn("w-6 h-6 text-blue-400", isPlaying && "animate-pulse")} />
              </div>
              <div>
                <div className="text-xs font-black text-blue-500 uppercase tracking-widest mb-1">Audio Version</div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleAudio}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-all"
                  >
                    {isPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Listen</>}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Top Navigation Pills */}
        <div className="mb-16 pb-6 border-b border-white/5 overflow-x-auto scrollbar-hide sticky top-20 bg-[#0A0A0B]/80 backdrop-blur-xl z-30 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max py-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 scale-105' 
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 hover:text-blue-400'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {section.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* Main Content Area */}
          <div className="flex-1 space-y-24">
            
            <section id="definitions" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">1. Core Definitions & User Tiers</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-lg sm:text-xl text-gray-400 mb-8 leading-relaxed">To ensure complete legal clarity across international borders, Wersee categorizes its users and financial tools as follows:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-8">
                  <div className="bg-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-white/20 transition-colors group">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Independent Merchant</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">A user aged 18 or older with full legal capacity to enter into binding contracts. An Independent Merchant can operate as a private individual (without a KvK registration) up to the legal tax-free thresholds, or as a registered business entity.</p>
                  </div>
                  <div className="bg-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-white/20 transition-colors group">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Next-Gen Creator (Minor)</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">A user under the age of 18 (minimum age 13, compliant with US COPPA and EU GDPR). Under Dutch Civil Code (Article 1:234 BW) and international equivalents, minors require parental consent for significant financial transactions.</p>
                  </div>
                  <div className="bg-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-white/20 transition-colors group">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Co-Founder / Guardian</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">The legally recognized parent or legal guardian of a Next-Gen Creator. The Guardian acts as the authorized signatory for KYC compliance and fiat withdrawals, assuming legal responsibility for the minor's commercial activities.</p>
                  </div>
                  <div className="bg-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/10 hover:border-white/20 transition-colors group">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 group-hover:text-blue-400 transition-colors">Platform Provider (Not MoR)</h3>
                    <p className="text-sm sm:text-base text-gray-400 leading-relaxed">Wersee acts strictly as a <strong className="text-white">software platform provider</strong>. Wersee is <strong className="text-blue-500 underline">NOT</strong> your Merchant of Record (MoR). The MoR is the <strong className="text-white">legal entity</strong> (you or a designated partner) responsible for processing transactions. Wersee provides the <strong className="text-white">localized advice</strong> and infrastructure to help you manage this role in your country.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="kyc" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">2. Zero-Data KYC & AML Compliance</h2>
              </div>
              <div className="bg-white/5 p-6 sm:p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-lg sm:text-xl leading-relaxed">Wersee is strictly bound by European and International Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) directives, including the Dutch Wet ter voorkoming van witwassen en financieren van terrorisme (Wwft).</p>
                
                <div className="space-y-6">
                  {[
                    { num: '2.1', title: 'The "Zero-Data" Privacy Guarantee', text: 'To protect our users, Wersee employs a <strong className="text-white">"Zero-Data KYC" architecture</strong>. Wersee does not collect, store, or process highly sensitive government identification numbers (such as the Dutch BSN, US SSN, or Passport copies) on its own databases.' },
                    { num: '2.2', title: 'Third-Party Verification', text: 'All identity verification is routed via <strong className="text-white">end-to-end encrypted tunnels</strong> directly to our licensed MoR and payment processors (Stripe). Wersee only receives an automated cryptographic token confirming status: verified or status: unverified.' },
                    { num: '2.3', title: 'Pay-First, Verify-Later', text: 'Users may accumulate earnings in their Wersee Treasury without undergoing immediate KYC. However, <strong className="text-white">no fiat withdrawals</strong> to external bank accounts will be authorized until the user (or their Guardian) successfully passes the mandatory KYC verification.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg sm:text-xl mb-2">{item.title}</h4>
                        <p className="leading-relaxed text-sm sm:text-base text-gray-400">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="vault" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Lock className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">3. The Wersee Vault (Escrow)</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">To protect consumers and maintain platform integrity, the sale of physical merchandise is subject to the Wersee Vault Escrow System.</p>
                
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-8 mb-8">
                  <h3 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-3">
                    <Lock className="w-6 h-6" /> 3.1. The 16-Day Hold
                  </h3>
                  <p className="text-amber-200/80 leading-relaxed text-lg">
                    Funds from the sale of physical goods are immediately secured in the Wersee Vault. These funds remain <strong className="text-amber-400">locked for a standard period of sixteen (16) calendar days</strong> from the date of the transaction, or until the buyer officially confirms receipt of the goods, whichever occurs first.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-white text-xl mb-3">3.2. Dispute Freezing</h4>
                    <p className="text-gray-400 leading-relaxed">If a buyer initiates a formal dispute (e.g., item not received, damaged goods) within the 16-day window, the funds will remain frozen in the Wersee Vault until the dispute is resolved by Wersee Moderation.</p>
                  </div>
                  <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                    <h4 className="font-bold text-white text-xl mb-3">3.3. Digital Goods Exemption</h4>
                    <p className="text-gray-400 leading-relaxed">Sales of purely digital products, software access, or Wersee Hub memberships are exempt from the 16-day vault. These funds are credited to the Merchant's Available Balance subject only to standard payment gateway fraud holds.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="credits" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">4. Wersee Credits & Closed-Loop Economy</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">To facilitate frictionless commerce, especially for Next-Gen Creators who may not have immediate access to banking infrastructure, Wersee offers an internal digital balance.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div>
                    <h4 className="font-bold text-white text-xl mb-3">4.1. Nature of Wersee Credits</h4>
                    <p className="leading-relaxed">Earnings retained in the Wersee Treasury can be held as <strong className="text-white">"Wersee Credits"</strong>. Wersee Credits are a <strong className="text-white">closed-loop utility token</strong> strictly limited to use within the Wersee Platform.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl mb-3">4.2. Not E-Money</h4>
                    <p className="leading-relaxed">Wersee Credits do not constitute <strong className="text-white">"Electronic Money" (E-money)</strong> under the European E-Money Directive (EMD2), as they cannot be spent outside the Wersee ecosystem.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl mb-3">4.3. No KYC for Internal Use</h4>
                    <p className="leading-relaxed">Because Wersee Credits remain within the closed ecosystem, Next-Gen Creators may earn and spend these credits without triggering AML/KYC thresholds.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl mb-3">4.4. Gift Cards</h4>
                    <p className="leading-relaxed">Wersee Credits can be generated into alphanumeric Gift Card codes. The original creator of the code remains responsible for its distribution.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="fees" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">5. Fees, Splits & Fee Passing</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-xl text-gray-400 mb-8 leading-relaxed">Wersee provides the infrastructure, and in return, applies a transparent fee structure.</p>
                
                <div className="space-y-6">
                  {[
                    { title: '5.1. Tiered Platform Fees', text: 'Wersee deducts a percentage-based commission on all transactions. This fee varies based on the user\'s tier, the transaction volume, and the underlying MoR processing costs.' },
                    { title: '5.2. Fee Passing (Net-Zero Toggle)', text: 'Merchants possess the right to utilize the "Fee Passing" feature. By enabling this, the Merchant forces the platform and processing fees to be added on top of the base retail price, meaning the buyer bears the cost of the transaction fees.' },
                    { title: '5.3. Automated Revenue Splits', text: 'Merchants can assign percentage-based royalty splits to other Wersee users. Wersee executes these splits automatically at the point of sale. Each recipient is individually responsible for their own KYC and tax obligations.' }
                  ].map((item) => (
                    <div key={item.title} className="bg-white/5 p-8 rounded-3xl border border-white/10 hover:border-blue-500/30 transition-colors">
                      <h4 className="font-bold text-white text-xl mb-3">{item.title}</h4>
                      <p className="text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="tax" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Globe className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">6. Localized Advice & Compliance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-blue-600/10 p-10 rounded-[2.5rem] border border-blue-600/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-colors" />
                  <h3 className="text-2xl font-bold text-white mb-6 relative z-10">6.1. Localized Guidance Engine</h3>
                  <p className="text-blue-100/80 leading-relaxed text-lg relative z-10">Wersee is <strong className="text-white">not your Merchant of Record</strong>. Instead, we provide a <strong className="text-white">"Localized Advice" engine</strong> that offers specific guidance tailored to your country of residence. This helps you configure your Stripe integration to correctly handle consumer taxes (VAT, Sales Tax) according to your local regulations.</p>
                </div>
                <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10">
                  <h3 className="text-2xl font-bold text-white mb-6">6.2. Merchant Responsibility</h3>
                  <p className="text-gray-400 leading-relaxed text-lg">While Wersee provides the advice and tools for your country, the <strong className="text-white">Independent Merchant or Guardian remains the legal MoR</strong>. You are responsible for the final declaration of earnings and ensuring that the tax collection settings in your connected Stripe account match the guidance provided.</p>
                </div>
              </div>
            </section>

            <section id="guardian" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Users className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">7. Guardian Responsibilities</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400">
                <p className="text-xl mb-8">For our Next-Gen Creators operating in Co-Founder Mode:</p>
                <div className="space-y-8">
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="font-bold text-white text-xl mb-3">7.1. Legal Liability</h4>
                    <p className="leading-relaxed">By activating the "Co-Founder Mode", the Guardian explicitly consents to the Next-Gen Creator's use of the Wersee platform for commercial purposes.</p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                    <h4 className="font-bold text-white text-xl mb-3">7.2. Fiduciary Oversight</h4>
                    <p className="leading-relaxed">The Guardian holds the exclusive right to connect external bank accounts, perform KYC, and set withdrawal limits for the Next-Gen Creator. The Guardian assumes full legal and financial responsibility for the digital assets and liabilities generated by the minor on the platform.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="legal" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Scale className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">8. Governing Law & Dispute Resolution</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <h4 className="font-bold text-white text-xl mb-4">8.1. Jurisdiction</h4>
                  <p className="text-gray-400 leading-relaxed text-lg">These Terms shall be governed by and construed in accordance with the laws of The Netherlands, without regard to its conflict of law principles.</p>
                </div>
                <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                  <h4 className="font-bold text-white text-xl mb-4">8.2. Competent Court</h4>
                  <p className="text-gray-400 leading-relaxed text-lg">Any disputes arising out of or in connection with these Terms, the Wersee Treasury, or the Wersee Vault shall be submitted to the exclusive jurisdiction of the competent courts in The Netherlands.</p>
                </div>
              </div>
            </section>

            <section id="withdrawal" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">9. Right of Withdrawal</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">In accordance with the EU Consumer Rights Directive and the Dutch Civil Code (Burgerlijk Wetboek), consumers have specific rights regarding the purchase of goods and services.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                    <h4 className="font-bold text-white text-xl mb-4">9.1. Digital Content</h4>
                    <p className="leading-relaxed">By purchasing digital content (e.g., downloads, software access), you explicitly consent to immediate performance of the contract and acknowledge that you lose your right of withdrawal once the download or streaming has started.</p>
                  </div>
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                    <h4 className="font-bold text-white text-xl mb-4">9.2. Physical Goods</h4>
                    <p className="leading-relaxed">For physical goods, consumers have a period of 14 days to withdraw from the contract without giving any reason. This period starts from the day the goods are received. The cost of returning the goods is borne by the consumer unless otherwise stated by the Merchant.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="acceptable-use" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">10. Acceptable Use & Prohibited Activities</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">To maintain a secure and legally compliant ecosystem, you agree not to engage in any prohibited activities. Violation of this section constitutes a material breach of these Terms.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '10.1', title: 'Illegal & Harmful Content', text: 'You may not use Wersee to host, distribute, or promote illegal goods, hate speech, explicit adult content, malware, or any material that violates international law or the laws of your jurisdiction.' },
                    { num: '10.2', title: 'Platform Abuse', text: 'You are strictly prohibited from reverse-engineering, scraping, or attempting to bypass the security mechanisms of the Wersee Business OS. Automated bots (unless explicitly authorized via our API) are forbidden.' },
                    { num: '10.3', title: 'Fraud & Manipulation', text: 'Creating fake accounts, manipulating reviews, engaging in money laundering, or attempting to defraud other users or the platform will result in immediate termination and reporting to relevant authorities.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="intellectual-property" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">11. Intellectual Property Rights</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">Clarity regarding ownership of code, content, and the platform infrastructure.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '11.1', title: 'Wersee Ownership', text: 'Wersee retains all rights, title, and interest in and to the Wersee Business OS, including all software, design, logos, and proprietary AI models. You are granted a limited, non-exclusive, non-transferable license to use the platform.' },
                    { num: '11.2', title: 'User Content', text: 'You retain full ownership of the intellectual property rights to the content you create, upload, or sell on Wersee. By uploading content, you grant Wersee a worldwide, royalty-free license to host, display, and distribute your content solely for the purpose of operating the platform.' },
                    { num: '11.3', title: 'DMCA & Copyright Infringement', text: 'We respect intellectual property rights. If you believe your copyright has been infringed, you must submit a formal takedown notice to legal@wersee.com. We reserve the right to terminate accounts of repeat infringers.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="ai-disclaimer" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Globe className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">12. Artificial Intelligence (AI) Disclaimer</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">Wersee integrates advanced AI models to assist with business operations, code generation, and localized advice.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '12.1', title: 'No Professional Advice', text: 'AI-generated content, including tax, legal, and business advice, is provided for informational purposes only. It does <strong className="text-white">not</strong> constitute certified professional advice. You must independently verify all AI outputs.' },
                    { num: '12.2', title: 'AI Hallucinations & Errors', text: 'You acknowledge that AI models may produce inaccurate, incomplete, or "hallucinated" information. Wersee accepts <strong className="text-white">zero liability</strong> for any damages, financial losses, or legal consequences resulting from your reliance on AI-generated content.' },
                    { num: '12.3', title: 'AI Data Usage', text: 'By interacting with Wersee AI features, you consent to the processing of your inputs to generate responses. We do not use your private financial data to train foundational models without explicit consent.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="liability" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <AlertTriangle className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">13. Limitation of Liability</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">This section limits our financial exposure and is a fundamental element of our agreement.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '13.1', title: '"As Is" Basis', text: 'The Wersee platform is provided on an "AS IS" and "AS AVAILABLE" basis. We disclaim all warranties, express or implied, including merchantability, fitness for a particular purpose, and non-infringement.' },
                    { num: '13.2', title: 'No Indirect Damages', text: 'To the maximum extent permitted by law, Wersee shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising from your use of the platform.' },
                    { num: '13.3', title: 'Liability Cap', text: 'In no event shall Wersee\'s aggregate liability for all claims related to the platform exceed the greater of (a) €100 EUR, or (b) the total fees paid by you to Wersee in the 12 months preceding the claim.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="indemnification" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Scale className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">14. Indemnification</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">You agree to defend, indemnify, and hold harmless Wersee, its affiliates, and their respective directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising out of or in any way connected with:</p>
                <ul className="list-disc pl-6 space-y-4 text-sm sm:text-base">
                  <li>Your access to or use of the platform.</li>
                  <li>Your violation of these Terms of Service.</li>
                  <li>Your violation of any third-party right, including intellectual property or privacy rights.</li>
                  <li>Any claim that your User Content caused damage to a third party.</li>
                </ul>
              </div>
            </section>

            <section id="termination" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <XCircle className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">15. Termination & Account Freezing</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">We reserve the right to protect the platform and our users through decisive action.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '15.1', title: 'Right to Terminate', text: 'Wersee may suspend or terminate your account and access to the platform at any time, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.' },
                    { num: '15.2', title: 'Fund Freezing', text: 'In the event of suspected fraud, money laundering, or violation of the Acceptable Use Policy, Wersee (in coordination with our payment processors) reserves the right to freeze funds in your Wersee Vault pending legal investigation.' },
                    { num: '15.3', title: 'Survival', text: 'All provisions of the Terms which by their nature should survive termination shall survive termination, including ownership provisions, warranty disclaimers, indemnity, and limitations of liability.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="data-consent" className="scroll-mt-40">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
                  <Database className="w-7 h-7" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight">16. Data Processing Consent</h2>
              </div>
              <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 text-gray-400 space-y-8">
                <p className="text-xl leading-relaxed">By creating an account and using the Wersee platform, you explicitly consent to the collection, processing, and storage of your data as required to operate the service.</p>
                
                <div className="space-y-6">
                  {[
                    { num: '16.1', title: 'Comprehensive Data Collection', text: 'You acknowledge and agree that Wersee collects various forms of data, including but not limited to: Identity & Authentication data, Financial & Transactional records, Social & Community interactions, Uploaded Content & Workspaces, and Technical & AI Intelligence logs.' },
                    { num: '16.2', title: 'Privacy Policy Integration', text: 'Our data processing practices are governed by our <a href="/privacy" class="text-blue-500 hover:underline">Privacy Policy</a>. By accepting these Terms, you confirm that you have read, understood, and agreed to the Privacy Policy.' },
                    { num: '16.3', title: 'Cross-Border Transfers', text: 'You consent to the transfer and processing of your data across international borders, including to servers located in the United States and the European Union, in accordance with applicable data protection laws.' }
                  ].map((item) => (
                    <div key={item.num} className="flex flex-col sm:flex-row gap-4 sm:gap-6 group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-white/5 flex items-center justify-center font-black text-white border border-white/10 group-hover:border-blue-500/50 transition-colors">
                        {item.num}
                      </div>
                      <div>
                        <h4 className="text-white font-bold mb-2">{item.title}</h4>
                        <p className="text-sm sm:text-base leading-relaxed" dangerouslySetInnerHTML={{ __html: item.text }}></p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

          </div>

          {/* Right Sidebar - External Links */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="sticky top-40">
              <div className="bg-white/5 rounded-[2rem] border border-white/10 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl">
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em] mb-8 opacity-50">Related Policies</h3>
                
                <div className="space-y-4">
                  {externalLinks.map((link, idx) => (
                    <a 
                      key={idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-blue-400 text-sm mb-1 transition-colors">{link.title}</h4>
                          <p className="text-xs text-gray-500 leading-relaxed">{link.desc}</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-600 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                  <div className="bg-blue-600/10 rounded-2xl p-6 border border-blue-600/20">
                    <h4 className="font-bold text-white text-sm mb-2">Need Help?</h4>
                    <p className="text-xs text-gray-500 mb-6 leading-relaxed">If you have any questions about these terms, please contact our legal team.</p>
                    <button 
                      onClick={() => setShowContactLegal(true)}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20"
                    >
                      Contact Legal <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Contact Legal Screen (Modal) */}
      <AnimatePresence>
        {showContactLegal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-black/90 backdrop-blur-2xl"
          >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-4xl bg-[#0F0F11] rounded-2xl sm:rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto scrollbar-hide"
              >
                <button 
                  onClick={() => setShowContactLegal(false)}
                  className="absolute top-4 right-4 sm:top-8 sm:right-8 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all z-10"
                >
                  <X className="w-5 h-5 sm:w-6 h-6" />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {/* Left Side - Info */}
                  <div className="p-8 sm:p-10 lg:p-16 bg-blue-600 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-3xl rounded-full -mr-32 -mt-32" />
                    <div className="relative z-10">
                      <div className="w-12 h-12 sm:w-16 h-16 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center mb-6 sm:mb-8">
                        <Scale className="w-6 h-6 sm:w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-2xl sm:text-4xl font-black text-white mb-4 sm:mb-6 tracking-tight">Contact Our Legal Team</h2>
                      <p className="text-blue-100 text-base sm:text-lg leading-relaxed mb-8 sm:mb-12">
                        We're here to help clarify any questions you might have regarding our terms, privacy, or compliance.
                      </p>

                      <div className="space-y-4 sm:y-6">
                        <div className="flex items-center gap-4 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-blue-200 uppercase font-black tracking-widest">Response Time</p>
                            <p className="font-bold text-sm sm:text-base">Within 24-48 Business Hours</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-white">
                          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] sm:text-xs text-blue-200 uppercase font-black tracking-widest">Headquarters</p>
                            <p className="font-bold text-sm sm:text-base">Amsterdam, The Netherlands</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Options */}
                  <div className="p-8 sm:p-10 lg:p-16 space-y-6 sm:space-y-8">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-8">How can we help?</h3>
                    
                    <div className="space-y-4">
                      <a 
                        href="mailto:legal@wersee.com"
                        className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                      >
                        <div className="w-12 h-12 sm:w-14 h-14 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <Mail className="w-5 h-5 sm:w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base sm:text-lg">Email Support</h4>
                          <p className="text-xs sm:text-sm text-gray-500">legal@wersee.com</p>
                        </div>
                      </a>

                      <button className="w-full flex items-center gap-4 sm:gap-6 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group text-left">
                        <div className="w-12 h-12 sm:w-14 h-14 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                          <MessageSquare className="w-5 h-5 sm:w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-base sm:text-lg">Live Chat</h4>
                          <p className="text-xs sm:text-sm text-gray-500">Available for Enterprise users</p>
                        </div>
                      </button>
                    </div>

                    <div className="pt-6 sm:pt-8 border-t border-white/5">
                      <p className="text-[10px] sm:text-xs text-gray-600 leading-relaxed">
                        By contacting us, you agree to our processing of your personal data as described in our Privacy Policy. For urgent security matters, please use our dedicated security portal.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Branding */}
      <div className="max-w-[1400px] mx-auto mt-24 pt-12 border-t border-white/5 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2 text-white font-black text-2xl tracking-tighter">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-sm">W</div>
            WERSEE
          </div>
          <p className="text-sm text-gray-600">
            © 2026 Wersee Platform. All rights reserved. Wersee is a registered trademark.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};
