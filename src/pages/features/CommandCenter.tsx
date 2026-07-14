import React from 'react';
import { motion } from 'motion/react';
import { LayoutGrid, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const CommandCenter = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Command Center - Workspace" 
        description="The ultimate workspace for modern businesses. Manage everything from one place."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-indigo-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Command <span className="text-indigo-600">Center.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            The ultimate workspace for modern businesses. Manage your store, staff, inventory, and customers from one beautiful dashboard.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/workspace" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Enter Command Center</Link>
            <a href="#preview" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">Watch Demo</a>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Total Control. Zero Friction.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              The Command Center is your mission control. It aggregates data from every corner of your business—sales, marketing, inventory, and support—into a single, actionable dashboard that gives you the clarity you need to lead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Omni-Management", desc: "Manage all your sales channels from a single source of truth. Changes made here update everywhere instantly.", icon: LayoutGrid },
              { title: "Staff Roles & Permissions", desc: "Define granular permissions for your team. Give managers access to reports while restricting settings for temporary staff.", icon: Zap },
              { title: "AI Business Insights", desc: "Our AI analyzes your data to find trends, predict stock shortages, and suggest marketing opportunities.", icon: Sparkles },
              { title: "Unified CRM", desc: "See every interaction a customer has had with your brand. Order history, support tickets, and chat logs in one view.", icon: Globe },
              { title: "Inventory Intelligence", desc: "Real-time tracking across multiple warehouses. Set low-stock alerts and automate reordering.", icon: CheckCircle2 },
              { title: "Marketing Hub", desc: "Launch email campaigns, manage ad spend, and track ROI without leaving your dashboard.", icon: Shield }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-indigo-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="preview" className="py-24 px-6 bg-[#1D1D1F] text-white scroll-mt-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-8">Designed for Scale.</h2>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Whether you're a solopreneur or a Fortune 500 company, Command Center scales with you. Handle millions of SKUs, thousands of orders per minute, and unlimited team members without breaking a sweat.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-2">100%</div>
                  <div className="text-sm font-medium text-gray-400">Real-time Data</div>
                </div>
                <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                  <div className="text-4xl font-bold text-indigo-400 mb-2">Unlimited</div>
                  <div className="text-sm font-medium text-gray-400">Team Members</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500 blur-[100px] opacity-20"></div>
              <div className="relative bg-gray-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
                {/* Abstract UI representation */}
                <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <div className="ml-auto text-xs text-gray-500 font-mono">DASHBOARD_V2.0</div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-white/5 rounded-xl w-full animate-pulse"></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-24 bg-white/5 rounded-xl w-full"></div>
                    <div className="h-24 bg-white/5 rounded-xl w-full"></div>
                    <div className="h-24 bg-white/5 rounded-xl w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-indigo-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Take command of your business.</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Stop guessing and start leading with data-driven decisions.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-indigo-600 text-white rounded-full font-bold text-xl hover:bg-indigo-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Start Your Free Trial
          </Link>
        </div>
      </section>
    </div>
  );
};
