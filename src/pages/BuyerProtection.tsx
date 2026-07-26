import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ShieldAlert, CheckCircle2, ArrowRight, Lock, Shield, HelpCircle, FileText } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { SEO } from '../components/SEO';

export const BuyerProtection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    orderId: '',
    reason: 'Not as described',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('buyer_protection_claims').insert({
        user_id: user.id,
        reason: formData.reason,
        description: formData.description,
        status: 'pending'
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Error submitting claim:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <SEO 
        title="Buyer Protection - Shop with Confidence"
        description="Learn about our buyer protection policies. We ensure secure payments, data privacy, and money-back guarantees for your purchases."
        url="/buyer-protection"
      />
      <div className="min-h-screen bg-[#FBFBFD] pt-[calc(4rem+max(env(safe-area-inset-top),0px))] pb-24">
        <div className="max-w-4xl mx-auto px-6">
          {/* Hero */}
          <div className="text-center space-y-6 mb-16">
            <div className="w-20 h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-emerald-200">
              <ShieldCheck className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1D1D1F] tracking-tight">Buyer Protection</h1>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Shop with confidence. We've got your back on every purchase you make on our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              { icon: Shield, title: 'Secure Payments', desc: 'Your payment information is encrypted and never shared.' },
              { icon: Lock, title: 'Data Privacy', desc: 'We protect your personal data with industry-leading security.' },
              { icon: CheckCircle2, title: 'Money Back', desc: 'If your item doesn\'t arrive or is not as described, we\'ll refund you.' }
            ].map((feature, i) => (
              <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-black/5 shadow-sm space-y-4">
                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="font-bold text-lg">{feature.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[3rem] border border-black/5 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-12 bg-black text-white space-y-8">
                <h2 className="text-3xl font-bold">Submit a Claim</h2>
                <p className="text-white/60">
                  Having trouble with an order? Fill out the form and our team will investigate within 24-48 hours.
                </p>
                
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <HelpCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Need help?</h4>
                      <p className="text-sm text-white/40">Check our FAQ for common solutions.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold">Policy Details</h4>
                      <p className="text-sm text-white/40">Read our full terms of protection.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-12">
                {!success ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID (Optional)</label>
                      <input 
                        type="text"
                        value={formData.orderId}
                        onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5"
                        placeholder="e.g. ord_123..."
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Reason</label>
                      <select 
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                      >
                        <option>Not as described</option>
                        <option>Never received</option>
                        <option>Technical issue</option>
                        <option>Unauthorized charge</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Description</label>
                      <textarea 
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-black/5 min-h-[120px]"
                        placeholder="Tell us what happened..."
                        required
                      />
                    </div>
                    <button 
                      type="submit"
                      disabled={loading || !user}
                      className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Claim'} <ArrowRight className="w-5 h-5" />
                    </button>
                    {!user && <p className="text-center text-xs text-red-500 font-medium">Please sign in to submit a claim.</p>}
                  </form>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Claim Received</h3>
                    <p className="text-gray-500">We've received your claim and will get back to you shortly.</p>
                    <button onClick={() => setSuccess(false)} className="text-sm font-bold text-blue-600">Submit another claim</button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
