import React from 'react';
import { motion } from 'motion/react';
import { CreditCard, Shield, Zap, ArrowLeft, CheckCircle2, Globe, Sparkles } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { Link } from 'react-router-dom';

export const WerseePay = () => {
  return (
    <div className="bg-white text-[#1D1D1F] overflow-hidden">
      <SEO 
        title="Wersee Pay - Custom Payment System" 
        description="A flexible, powerful, and secure payment system built for modern commerce."
      />

      <div className="fixed top-6 left-6 z-[100]">
        <Link to="/" className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-sm font-bold hover:bg-white transition-all shadow-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <section className="relative pt-32 pb-20 px-6 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-8xl font-black tracking-tight mb-8"
          >
            Wersee <span className="text-blue-600">Pay.</span>
          </motion.h1>
          <p className="text-xl text-[#86868B] max-w-2xl mx-auto mb-12 font-medium">
            The ultimate custom payment system. From one-off invoices to complex subscriptions, Wersee Pay handles it all with elegance and security.
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/auth" className="px-10 py-5 bg-black text-white rounded-full font-bold text-lg hover:scale-105 transition-transform">Get Started</Link>
            <a href="mailto:support@wersee.com?subject=Wersee%20Pay%20sales" className="px-10 py-5 bg-white text-black border border-gray-200 rounded-full font-bold text-lg hover:bg-gray-50 transition-colors">Contact Sales</a>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Payments, reimagined.</h2>
            <p className="text-xl text-[#86868B] max-w-3xl mx-auto">
              Wersee Pay isn't just a payment processor; it's a financial operating system designed for the modern entrepreneur. Whether you're selling digital products, physical goods, or subscription services, Wersee Pay adapts to your business model.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Custom Invoices", desc: "Generate professional, branded invoices in seconds. Send them via email or link, and get paid instantly with integrated payment buttons.", icon: CreditCard },
              { title: "Global Reach", desc: "Accept payments in 135+ currencies. We automatically handle conversion and local payment methods like iDEAL, Bancontact, and Alipay.", icon: Globe },
              { title: "AI Fraud Protection", desc: "Advanced security layers powered by machine learning detect and block suspicious transactions in real-time, keeping your revenue safe.", icon: Shield },
              { title: "Smart Subscriptions", desc: "Built-in recurring billing engine. Handle trials, upgrades, downgrades, and prorations without writing a single line of code.", icon: Zap },
              { title: "Instant Payouts", desc: "Don't wait for your money. Eligible businesses can access their funds instantly, improving cash flow and operational agility.", icon: CheckCircle2 },
              { title: "Tax Automation", desc: "We calculate, collect, and remit sales tax and VAT automatically based on your customer's location. Compliance made simple.", icon: Sparkles }
            ].map((f, i) => (
              <div key={i} className="p-8 bg-[#F5F5F7] rounded-[2rem] hover:bg-blue-50 transition-colors duration-300 group">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <f.icon className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{f.title}</h3>
                <p className="text-[#86868B] font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-[#1D1D1F] text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <h2 className="text-4xl md:text-6xl font-black mb-8">Seamless Integration.</h2>
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Wersee Pay connects effortlessly with your favorite tools. Whether you're using our no-code builders or integrating via our robust API, you'll be up and running in minutes, not months.
            </p>
            <ul className="space-y-4">
              {[
                "Developer-friendly API documentation",
                "Pre-built UI components for React & Vue",
                "Webhooks for real-time event handling",
                "Sandbox environment for safe testing"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-[3rem] p-12 aspect-square flex items-center justify-center">
            <div className="text-center">
              <div className="text-9xl font-black mb-2">99.9%</div>
              <div className="text-2xl font-medium opacity-80">Uptime Reliability</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-blue-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8">Ready to upgrade your payments?</h2>
          <p className="text-xl text-[#86868B] mb-12">
            Join thousands of businesses that trust Wersee Pay to handle their transactions securely and efficiently.
          </p>
          <Link to="/auth" className="inline-flex items-center justify-center px-12 py-6 bg-blue-600 text-white rounded-full font-bold text-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};
