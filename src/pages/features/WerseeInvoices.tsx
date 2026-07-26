import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, CreditCard, Clock, CheckCircle2, ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export default function WerseeInvoices() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white font-sans selection:bg-blue-500/30">
      <SEO 
        title="Wersee Invoices - Get Paid Faster" 
        description="Create professional invoices in seconds, accept global payments, and manage your cash flow effortlessly with Wersee Invoices."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-sm font-bold hover:bg-white/20 transition-all shadow-sm text-white">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium text-sm mb-8"
          >
            <FileText className="w-4 h-4" />
            Professional Invoicing, Simplified
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
          >
            Send Invoices. <br />
            <span className="text-blue-400">
              Get Paid Instantly.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto mb-10"
          >
            Create stunning, branded invoices in seconds. Accept credit cards, Apple Pay, and crypto globally. Stop chasing payments and start growing your business.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/auth" className="w-full sm:w-auto px-8 py-4 bg-blue-500 text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2">
              Create an Invoice <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/features/wersee-pay" className="w-full sm:w-auto px-8 py-4 bg-white/5 text-white border border-white/10 rounded-full font-bold text-lg hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
              Explore Wersee Pay
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-black relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast Creation",
                desc: "Generate professional invoices in under 30 seconds. Save client details, line items, and tax rates for one-click invoicing."
              },
              {
                icon: CreditCard,
                title: "Global Payments",
                desc: "Accept payments from anywhere in the world. Support for 135+ currencies, major credit cards, Apple Pay, and Google Pay."
              },
              {
                icon: Clock,
                title: "Automated Reminders",
                desc: "Never chase a late payment again. Set up automated email and SMS reminders to get paid on time, every time."
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-blue-500/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
                  <feature.icon className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-[#0A0A0A]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "3x", label: "Faster Payments" },
              { value: "135+", label: "Currencies Supported" },
              { value: "0", label: "Monthly Fees" },
              { value: "100%", label: "Secure Transactions" }
            ].map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8"
              >
                <div className="text-4xl md:text-5xl font-black text-white mb-2">{stat.value}</div>
                <div className="text-blue-400 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-black mb-8">Ready to get paid faster?</h2>
          <p className="text-xl text-gray-400 mb-10">Join thousands of freelancers and businesses who trust Wersee Invoices to manage their cash flow.</p>
          <Link to="/auth" className="inline-flex items-center justify-center px-8 py-4 bg-blue-500 text-white rounded-full font-bold text-lg hover:bg-blue-600 transition-colors gap-2">
            Start Invoicing Free <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
