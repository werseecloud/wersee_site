import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Store, GraduationCap, Shield, FileText, Briefcase, 
  HelpCircle, Zap, Globe, Sparkles, Building2, Users, 
  MessageSquare, Layout, CreditCard
} from 'lucide-react';

export const AllPages = () => {
  const categories = [
    {
      title: "Core Platform",
      icon: Store,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      links: [
        { label: "Home", path: "/" },
        { label: "Search & Discover", path: "/search" },
        { label: "Dashboard", path: "/dashboard" },
        { label: "Profile", path: "/profile" },
        { label: "Checkout", path: "/checkout" }
      ]
    },
    {
      title: "Features & Tools",
      icon: Zap,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      links: [
        { label: "Wersee Treasure", path: "/treasure" },
        { label: "Wersee Invoices", path: "/invoices" },
        { label: "Wersee Sovereign", path: "/sovereign" },
        { label: "Flash Checkout", path: "/features/flash-checkout" },
        { label: "Command Center", path: "/features/command-center" },
        { label: "Omni Management", path: "/features/omni-management" }
      ]
    },
    {
      title: "Education & Youth",
      icon: GraduationCap,
      color: "text-indigo-400",
      bg: "bg-indigo-500/10",
      links: [
        { label: "Next Gen Creator", path: "/next-gen" },
        { label: "Student Discount", path: "/edu/student" },
        { label: "Campus Program", path: "/edu/campus" },
        { label: "Learning Paths", path: "/edu/paths" },
        { label: "Edu Resources", path: "/edu/resources" }
      ]
    },
    {
      title: "Business & Enterprise",
      icon: Building2,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      links: [
        { label: "Enterprise Solutions", path: "/enterprise" },
        { label: "Custom App Build", path: "/custom-app-build" },
        { label: "Business Portal", path: "/portal/demo" },
        { label: "Partner Network", path: "/features/partner-network" },
        { label: "Investments", path: "/investments" }
      ]
    },
    {
      title: "Community & Support",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      links: [
        { label: "Help Center", path: "/support" },
        { label: "Bot Guide", path: "/bot-guide" },
        { label: "Live Chat", path: "/live-chat" },
        { label: "Community", path: "/community" },
        { label: "Blog", path: "/blog" },
        { label: "Announcements", path: "/announcements" }
      ]
    },
    {
      title: "Legal & Trust",
      icon: Shield,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      links: [
        { label: "Terms of Service", path: "/terms" },
        { label: "Privacy Policy", path: "/privacy-policy" },
        { label: "Cookie Policy", path: "/cookie-policy" },
        { label: "Buyer Protection", path: "/buyer-protection" },
        { label: "Warranty Rules", path: "/warranty-rules" },
        { label: "Transparency", path: "/transparency" },
        { label: "Imprint", path: "/imprint" },
        { label: "Disclaimer", path: "/disclaimer" }
      ]
    },
    {
      title: "Company",
      icon: Globe,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      links: [
        { label: "About Us", path: "/about" },
        { label: "Roadmap", path: "/roadmap" },
        { label: "Jobs & Careers", path: "/jobs" },
        { label: "Ambassador Program", path: "/ambassador" },
        { label: "System Status", path: "/status" }
      ]
    },
    {
      title: "Payments & Finance",
      icon: CreditCard,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      links: [
        { label: "Fees & Plans", path: "/fees-plans" },
        { label: "Payout Info", path: "/payout-info" },
        { label: "Wersee Pay", path: "/features/wersee-pay" },
        { label: "Security Verification", path: "/verify" }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white pt-32 pb-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-white/5 border border-white/10 mb-8"
          >
            <Layout className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter">
            Platform <span className="text-gray-400">Directory</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Explore the complete Wersee ecosystem. Every page, feature, and resource in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-8 rounded-[2rem] bg-white/5 border border-white/10 hover:bg-white/10 transition-colors group"
            >
              <div className={`w-12 h-12 rounded-xl ${category.bg} flex items-center justify-center mb-6`}>
                <category.icon className={`w-6 h-6 ${category.color}`} />
              </div>
              <h2 className="text-xl font-bold mb-6">{category.title}</h2>
              <ul className="space-y-3">
                {category.links.map((link, j) => (
                  <li key={j}>
                    <Link 
                      to={link.path}
                      className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2 group/link"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover/link:bg-white/60 transition-colors" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
