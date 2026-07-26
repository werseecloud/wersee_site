import React from 'react';
import { ShieldCheck, Lock, CreditCard, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';

export const WerseePaySecurityPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F2F2F7] lg:bg-white font-sans">
      <SEO 
        title="Wersee Pay Security"
        description="Learn how Wersee Pay and Stripe keep your transactions secure."
      />

      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-4 bg-white sticky top-0 z-10 border-b border-black/5">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center text-gray-600 hover:bg-black/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900">Security Information</h1>
      </div>

      <div className="max-w-3xl mx-auto p-6 lg:p-12">
        <div className="bg-white lg:bg-[#F2F2F7] rounded-[2rem] p-8 lg:p-12 shadow-sm text-center mb-12">
          <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-gray-900 mb-4">
            Secured by Wersee Pay & Stripe
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Your payments are protected by industry-leading security standards. We partner with Stripe to ensure your financial data is encrypted and safe.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
              <Lock className="w-6 h-6 text-blue-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Bank-Level Encryption</h3>
            <p className="text-gray-500">
              All transactions are encrypted using AES-256 encryption. Your payment details are never stored directly on our servers.
            </p>
          </div>

          <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-6">
              <CreditCard className="w-6 h-6 text-purple-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">PCI Compliant</h3>
            <p className="text-gray-500">
              Stripe is a certified PCI Service Provider Level 1. This is the most stringent level of certification available in the payments industry.
            </p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-[2rem] p-8 lg:p-12 text-white">
          <h3 className="text-2xl font-bold mb-6">What does "Wersee Pay Setup Complete" mean?</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-gray-300">The business has completed a rigorous identity verification process.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-gray-300">Their bank accounts and business details have been verified by Stripe.</p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-gray-300">They are authorized to securely accept payments through the Wersee platform.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
