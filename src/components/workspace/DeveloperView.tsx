import React, { useState, useEffect } from "react";
import {
  Terminal,
  Shield,
  Key,
  Globe,
  Activity,
  Trash2,
  AlertCircle,
  CheckCircle,
  Copy,
  RefreshCw,
  Loader2,
  Save,
  Power,
  Zap,
  Eye,
  EyeOff,
  Bot,
  Users,
  CreditCard,
  ShoppingCart,
  Award
} from "lucide-react";
import { supabase, invokeApiRunner } from "../../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { DiscordBotView } from "./DiscordBotView";

export const DeveloperView = () => {
  const [activeTab, setActiveTab] = useState<"auth" | "pay" | "commerce" | "points">("auth");

  const tabs = [
    { id: "auth", label: "AUTH & USER SYSTEM", icon: Users },
    { id: "pay", label: "WERSEE PAY", icon: CreditCard },
    { id: "commerce", label: "COMMERCE / PRODUCTS", icon: ShoppingCart },
    { id: "points", label: "WERSEE POINTS SYSTEM", icon: Award },
  ];

  return (
    <div className="flex flex-col h-full bg-[#050505]">
      {/* Topbar for Devs */}
      <div className="flex items-center gap-2 p-4 border-b border-white/5 overflow-x-auto hide-scrollbar shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-indigo-400" : ""}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "auth" && <AuthSystemView />}
              {activeTab === "pay" && <WerseePayView />}
              {activeTab === "commerce" && <CommerceView />}
              {activeTab === "points" && <PointsSystemView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AuthSystemView = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Auth & User System</h2>
      <p className="text-gray-400">Manage authentication methods, user sessions, and access control.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: "OAuth 2.0", desc: "Login with Google, Discord, etc." },
        { title: "Email/Password Auth", desc: "Traditional credential login" },
        { title: "Magic Links", desc: "Passwordless login via email" },
        { title: "2FA / MFA", desc: "Multi-factor authentication" },
        { title: "Session Management", desc: "Active devices and tokens" },
        { title: "User Profiles API", desc: "Manage user data and avatars" },
        { title: "Role-based Access (RBAC)", desc: "Permissions and roles" },
        { title: "Organization Accounts", desc: "Team and enterprise management" },
      ].map((item, i) => (
        <div key={i} className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
          <h3 className="text-white font-medium mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const WerseePayView = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Wersee Pay</h2>
      <p className="text-gray-400">Manage payments, subscriptions, and financial infrastructure.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: "One-time Payments", desc: "Process single transactions" },
        { title: "Subscriptions", desc: "Monthly/yearly recurring billing" },
        { title: "Usage-based Billing", desc: "Metered billing infrastructure" },
        { title: "Checkout Links", desc: "Hosted & custom checkout pages" },
        { title: "Payment Intents API", desc: "Custom payment flows" },
        { title: "Refunds API", desc: "Process partial or full refunds" },
        { title: "Invoices API", desc: "Generate and manage invoices" },
        { title: "Tax Handling", desc: "EU VAT and global tax compliance" },
        { title: "Webhooks", desc: "Listen to payment events" },
      ].map((item, i) => (
        <div key={i} className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
          <h3 className="text-white font-medium mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const CommerceView = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Commerce / Products</h2>
      <p className="text-gray-400">Infrastructure for marketplace and creators.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: "Product Listing API", desc: "Manage physical and digital goods" },
        { title: "Digital Products", desc: "Files, courses, and access control" },
        { title: "Pricing Tiers", desc: "Multiple pricing options per product" },
        { title: "Coupons / Promo Codes", desc: "Discount management" },
        { title: "Upsells / Order Bumps", desc: "Increase average order value" },
        { title: "Inventory", desc: "Stock tracking and management" },
        { title: "Product Access Control", desc: "Unlock content after payment" },
      ].map((item, i) => (
        <div key={i} className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
          <h3 className="text-white font-medium mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const PointsSystemView = () => (
  <div className="space-y-8">
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Wersee Points System</h2>
      <p className="text-gray-400">Gamification, rewards, and loyalty infrastructure.</p>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { title: "Gamification & Rewards", desc: "Core points engine" },
        { title: "Points Balance API", desc: "Check user balances" },
        { title: "Award Points", desc: "Give points on purchase, review, etc." },
        { title: "Redeem Points", desc: "Exchange for discounts or unlocks" },
        { title: "Leaderboards API", desc: "Global and community rankings" },
      ].map((item, i) => (
        <div key={i} className="bg-[#141414] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-colors">
          <h3 className="text-white font-medium mb-1">{item.title}</h3>
          <p className="text-sm text-gray-500">{item.desc}</p>
        </div>
      ))}
    </div>
  </div>
);

