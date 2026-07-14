import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Eye, Database, Share2, UserCheck, ChevronDown, ChevronUp, Lock, Globe, Cpu, CreditCard, MessageSquare, HardDrive, Bell, Zap, AlertTriangle } from 'lucide-react';
import { SEO } from '../components/SEO';

const Section = ({ title, children, icon: Icon, id }: { title: string, children: React.ReactNode, icon: any, id: string }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden mb-8 backdrop-blur-xl transition-all hover:border-indigo-500/30"
      id={id}
    >
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-8 bg-white/[0.02] hover:bg-white/[0.05] transition-colors"
      >
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Icon className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-white text-left tracking-tight">{title}</h2>
        </div>
        <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevronDown className="w-6 h-6 text-gray-500" />
        </div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-8 pt-0 text-gray-400 leading-relaxed space-y-6 border-t border-white/5">
              <div className="pt-8">
                {children}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const PrivacyPolicy = () => {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="Wersee Privacy Policy. Learn how we collect, use, and protect your personal data. GDPR-compliant data practices for creators and buyers."
        url="/privacy"
        keywords="wersee privacy policy, data protection, GDPR, personal data, creator privacy"
      />
      <div className="min-h-screen bg-[#0A0A0B] text-gray-300 pt-32 pb-24 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="max-w-5xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-indigo-600 text-white mb-8 shadow-2xl shadow-indigo-600/40 relative"
          >
            <Shield className="w-10 h-10" />
            <div className="absolute inset-0 rounded-[2rem] bg-indigo-600 animate-ping opacity-20" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-8 tracking-tighter">
            Privacy <span className="text-indigo-500">Manifesto</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            At Wersee, privacy isn't a checkbox—it's the foundation of digital sovereignty. We build systems that protect your identity while empowering your business.
          </p>
        </div>

        {/* Privacy at a Glance */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {[
            { icon: Lock, title: "Zero-Data KYC", desc: "Sensitive ID docs are routed directly to Stripe. We never see them." },
            { icon: Eye, title: "Radical Transparency", desc: "Know exactly what we collect, why we collect it, and where it goes." },
            { icon: Zap, title: "Encrypted Flow", desc: "End-to-end encryption for your messages, files, and financial data." }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 hover:border-indigo-500/30 transition-all group"
            >
              <item.icon className="w-10 h-10 text-indigo-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="space-y-8">
          <Section id="data-collection" title="1. The Data We Architect" icon={Database}>
            <p className="text-lg mb-6">To power the Wersee Business OS, we process several categories of information:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="flex items-center gap-3 text-white font-bold mb-4">
                  <UserCheck className="w-5 h-5 text-indigo-400" /> Identity & Auth
                </h4>
                <ul className="text-sm space-y-2 list-disc pl-4">
                  <li>Email & Password (via Supabase Auth)</li>
                  <li>Usernames, Avatars, & Public Profiles</li>
                  <li>Cryptographic Auth Tokens & Session Data</li>
                </ul>
              </div>
              
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="flex items-center gap-3 text-white font-bold mb-4">
                  <CreditCard className="w-5 h-5 text-emerald-400" /> Financial & Business
                </h4>
                <ul className="text-sm space-y-2 list-disc pl-4">
                  <li>Business Names, Logos, & Contact Info</li>
                  <li>Stripe Account IDs & Payout Schedules</li>
                  <li>Invoice Details & Transaction History</li>
                  <li>Revenue Split & Affiliate Data</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="flex items-center gap-3 text-white font-bold mb-4">
                  <MessageSquare className="w-5 h-5 text-blue-400" /> Social & Community
                </h4>
                <ul className="text-sm space-y-2 list-disc pl-4">
                  <li>Chat Messages, Reactions, & Typing Status</li>
                  <li>Forum Posts, Comments, & Likes</li>
                  <li>Community Memberships & Role Assignments</li>
                </ul>
              </div>

              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <h4 className="flex items-center gap-3 text-white font-bold mb-4">
                  <HardDrive className="w-5 h-5 text-purple-400" /> Content & Workspace
                </h4>
                <ul className="text-sm space-y-2 list-disc pl-4">
                  <li>Uploaded Files (Storage Buckets)</li>
                  <li>Documents, Wiki Articles, & Projects</li>
                  <li>Custom App Configurations & Versions</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section id="technical-data" title="2. Technical & AI Intelligence" icon={Cpu}>
            <p className="mb-6">We collect technical data to ensure the spectacular performance of our platform and AI features:</p>
            <div className="space-y-6">
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Globe className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">Network & Device Data</h4>
                  <p className="text-sm">IP addresses, browser types, and device identifiers are processed to prevent fraud and optimize the UI for your specific hardware.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Zap className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">AI Interaction Logs</h4>
                  <p className="text-sm">Conversations with the Wersee AI Assistant are logged to improve response quality and manage token quotas. These logs are encrypted and never sold.</p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                  <Bell className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold mb-2">Live Activity Metrics</h4>
                  <p className="text-sm">We track real-time interactions (like new listings or purchases) to power the "Live Activity" feeds across the ecosystem.</p>
                </div>
              </div>
            </div>
          </Section>

          <Section id="data-usage" title="3. Purpose of Processing" icon={Eye}>
            <p className="mb-6">Your data is processed strictly for the following spectacular purposes:</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                "Maintaining the Wersee Business OS infrastructure",
                "Managing your spectacular user account & identity",
                "Executing financial contracts and automated splits",
                "Providing real-time community & chat features",
                "Delivering localized tax & compliance advice",
                "Protecting the ecosystem from fraud & fake reviews"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/5 text-sm">
                  <div className="w-2 h-2 rounded-full bg-indigo-500" />
                  {text}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="gdpr-rights" title="4. Your Sovereign Rights (GDPR/CCPA)" icon={UserCheck}>
            <p className="mb-8">Whether you are in the EU, US, or anywhere else, we respect your right to control your digital footprint:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Access", desc: "Request a full export of your data." },
                { title: "Erasure", desc: "The 'Right to be Forgotten'—delete your account permanently." },
                { title: "Rectification", desc: "Correct any inaccuracies in your profile." },
                { title: "Portability", desc: "Move your business data to another platform." },
                { title: "Objection", desc: "Opt-out of specific processing activities." },
                { title: "Restriction", desc: "Limit how we use your data temporarily." }
              ].map((right, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/5">
                  <h5 className="text-white font-bold mb-2">{right.title}</h5>
                  <p className="text-xs text-gray-500 leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="data-sharing" title="5. Trusted Partners" icon={Share2}>
            <p className="mb-6">We never sell your data. We only share it with essential partners to make the platform work:</p>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">Stripe</h4>
                  <p className="text-xs">Payment processing & KYC verification.</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest border border-emerald-500/20">Financial Partner</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">Supabase</h4>
                  <p className="text-xs">Database, Authentication, & File Storage.</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-widest border border-indigo-500/20">Infrastructure</div>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-white font-bold">Resend</h4>
                  <p className="text-xs">Transactional email delivery.</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-widest border border-blue-500/20">Communications</div>
              </div>
            </div>
          </Section>

          <Section id="security" title="6. Fortified Security" icon={Lock}>
            <p className="text-lg leading-relaxed">
              We employ military-grade encryption for data at rest and in transit. While no system is 100% impenetrable, our "Zero-Data" architecture means that even in the event of a breach, your most sensitive financial documents are never at risk because they aren't stored on our servers.
            </p>
          </Section>

          <Section id="cookies-tracking" title="7. Cookies & Tracking Technologies" icon={Globe}>
            <p className="mb-6">We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You have full control over these trackers.</p>
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <h4 className="text-white font-bold mb-2">Essential Cookies</h4>
                <p className="text-sm text-gray-400">Strictly necessary for the platform to function. These include authentication tokens, session management, and security cookies. They cannot be disabled.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <h4 className="text-white font-bold mb-2">Analytics & Performance</h4>
                <p className="text-sm text-gray-400">We use tools like Google Analytics and Mixpanel to understand how you interact with Wersee. This data is anonymized and helps us improve the user experience.</p>
              </div>
              <div className="p-6 rounded-2xl bg-white/5 border border-white/5">
                <h4 className="text-white font-bold mb-2">Third-Party Integrations</h4>
                <p className="text-sm text-gray-400">Some embedded content (like videos or external widgets) may set their own cookies. We do not control these third-party trackers.</p>
              </div>
            </div>
          </Section>

          <Section id="data-retention" title="8. Data Retention Periods" icon={Database}>
            <p className="mb-6">We do not hoard your data. We retain it only for as long as necessary to fulfill the purposes outlined in this policy or as required by law.</p>
            <ul className="text-sm space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div><strong className="text-white">Account Data:</strong> Retained for the lifetime of your account. Upon deletion, data is permanently wiped within 30 days.</div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div><strong className="text-white">Financial Records:</strong> Transaction logs, invoices, and payout data are retained for up to 7 years to comply with international tax and accounting laws (e.g., Dutch Belastingdienst).</div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                <div><strong className="text-white">System Logs:</strong> IP addresses and technical logs are kept for 90 days for security auditing and fraud prevention before being automatically purged.</div>
              </li>
            </ul>
          </Section>

          <Section id="childrens-privacy" title="9. Children's Privacy (COPPA & GDPR-K)" icon={Shield}>
            <p className="mb-6">Wersee supports "Next-Gen Creators" (minors), but we strictly enforce age-appropriate privacy protections.</p>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <p className="text-sm text-gray-400"><strong>Age Restrictions:</strong> The platform is not intended for children under 13. We do not knowingly collect data from anyone under 13.</p>
              <p className="text-sm text-gray-400"><strong>Parental Consent (Ages 13-17):</strong> Minors must have a legally recognized Guardian (Co-Founder) to operate a business on Wersee. The Guardian assumes responsibility for KYC compliance and financial transactions.</p>
              <p className="text-sm text-gray-400"><strong>Data Minimization:</strong> We limit the collection of personal data from minors to the absolute minimum required to operate their storefronts.</p>
            </div>
          </Section>

          <Section id="international-transfers" title="10. International Data Transfers" icon={Globe}>
            <p className="mb-6">Wersee operates globally. Your data may be transferred to, and maintained on, computers located outside of your state, province, or country.</p>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <p className="text-sm text-gray-400"><strong>EU-US Data Privacy Framework:</strong> For users in the European Economic Area (EEA), we ensure that data transferred to the US is protected under the EU-US Data Privacy Framework or via Standard Contractual Clauses (SCCs).</p>
              <p className="text-sm text-gray-400"><strong>Data Localization:</strong> Where legally required, we offer data localization options to ensure your business data remains within your specific jurisdiction.</p>
            </div>
          </Section>

          <Section id="automated-decision" title="11. Automated Decision Making & Profiling" icon={Cpu}>
            <p className="mb-6">We use automated systems to protect the platform and enhance your experience.</p>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <p className="text-sm text-gray-400"><strong>Fraud Detection:</strong> Automated algorithms analyze transaction patterns to flag suspicious activity. If your account is flagged, you have the right to request human intervention.</p>
              <p className="text-sm text-gray-400"><strong>Content Moderation:</strong> AI models scan public forums and listings for illegal or prohibited content to maintain a safe ecosystem.</p>
            </div>
          </Section>

          <Section id="breach-notification" title="12. Data Breach Procedures" icon={AlertTriangle}>
            <p className="mb-6">In the unlikely event of a data breach, we have strict protocols in place.</p>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <p className="text-sm text-gray-400"><strong>72-Hour Notification:</strong> We will notify relevant supervisory authorities within 72 hours of becoming aware of a breach that poses a risk to user rights.</p>
              <p className="text-sm text-gray-400"><strong>User Communication:</strong> If a breach poses a high risk to your personal data, we will communicate the incident to you directly via email, along with mitigation steps.</p>
            </div>
          </Section>
        </div>

        {/* Footer Branding */}
        <div className="mt-32 pt-12 border-t border-white/5 text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 text-white font-black text-3xl tracking-tighter">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-lg">W</div>
              WERSEE
            </div>
            <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
              © 2026 Wersee Platform. All rights reserved. Your privacy is our priority. For legal inquiries, contact legal@wersee.com.
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
