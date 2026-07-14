import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, CheckCircle2, Upload, Send, 
  ArrowRight, Sparkles, ShieldCheck, Mail, School
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { appToast } from '@/lib/feedback';
export const StudentDiscount: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'lp' | 'form' | 'success'>('lp');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    schoolName: '',
    studentNumber: '',
    schoolEmail: '',
  });
  const [proofFile, setProofFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      let proofUrl = '';
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${user.id}-${Math.random()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-proofs')
          .upload(fileName, proofFile);
        
        if (uploadError) throw uploadError;
        proofUrl = uploadData.path;
      }

      const { error } = await supabase.from('student_discount_applications').insert({
        user_id: user.id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        school_name: formData.schoolName,
        student_number: formData.studentNumber,
        school_email: formData.schoolEmail,
        proof_url: proofUrl,
      });

      if (error) throw error;
      setStep('success');
    } catch (err) {
      console.error('Error applying for student discount:', err);
      appToast('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Application Received!</h2>
        <p className="text-gray-400 max-w-md leading-relaxed">
          We've received your student discount application. Our team will review your proof and get back to you via email within 2-3 business days.
        </p>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="max-w-2xl mx-auto py-12 px-6">
        <button onClick={() => setStep('lp')} className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to info
        </button>
        
        <div className="mb-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-2">Verify Status</h2>
          <p className="text-gray-400">Complete the form below to unlock your 50% student discount.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">First Name</label>
              <input 
                required
                type="text"
                value={formData.firstName}
                onChange={e => setFormData({...formData, firstName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Last Name</label>
              <input 
                required
                type="text"
                value={formData.lastName}
                onChange={e => setFormData({...formData, lastName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">School / University Name</label>
            <div className="relative">
              <School className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input 
                required
                type="text"
                value={formData.schoolName}
                onChange={e => setFormData({...formData, schoolName: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Harvard University"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Student ID Number</label>
              <input 
                required
                type="text"
                value={formData.studentNumber}
                onChange={e => setFormData({...formData, studentNumber: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="ID-123456"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">School Email (Optional)</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="email"
                  value={formData.schoolEmail}
                  onChange={e => setFormData({...formData, schoolEmail: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="john@harvard.edu"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Proof of Enrollment (Screenshot/Photo)</label>
            <div className="relative group">
              <input 
                required
                type="file"
                accept="image/*"
                onChange={e => setProofFile(e.target.files?.[0] || null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full bg-white/5 border-2 border-dashed border-white/10 rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 group-hover:border-indigo-500/50 transition-all">
                <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-white">
                    {proofFile ? proofFile.name : 'Click or drag to upload proof'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Student ID card, transcript, or portal screenshot</p>
                </div>
              </div>
            </div>
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-white text-black py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-white/5 disabled:opacity-50"
          >
            {loading ? 'Processing...' : (
              <>
                Submit Application <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-24">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="px-4 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Education Program</span>
            </div>
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-white leading-[0.9] tracking-tighter mb-8">
            Learn more, <br />
            <span className="text-indigo-400">pay 50% less.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
            Wersee is committed to supporting the next generation of builders. Get full access to all pro features at half the price.
          </p>
          <button 
            onClick={() => setStep('form')}
            className="group px-10 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3"
          >
            Apply for Discount <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-3xl rounded-[3rem]" />
          <div className="relative bg-[#141414] border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Student Pro</h3>
                <p className="text-xs text-gray-500">Verified Enrollment Required</p>
              </div>
            </div>
            
            <div className="space-y-4">
              {[
                'Unlimited Workspace Access',
                'Advanced AI Assistant Tools',
                'Priority Support & Resources',
                'Exclusive Learning Paths',
                'Campus Networking Access'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span className="text-sm font-bold text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-16 border-y border-white/5">
        <div className="flex flex-col items-center text-center p-8">
          <Sparkles className="w-10 h-10 text-indigo-400 mb-4" />
          <h4 className="font-black text-white uppercase tracking-widest text-xs mb-2">Instant Access</h4>
          <p className="text-sm text-gray-500">Get verified and start building in minutes.</p>
        </div>
        <div className="flex flex-col items-center text-center p-8 border-x border-white/5">
          <GraduationCap className="w-10 h-10 text-purple-400 mb-4" />
          <h4 className="font-black text-white uppercase tracking-widest text-xs mb-2">Global Support</h4>
          <p className="text-sm text-gray-500">Available for students worldwide.</p>
        </div>
        <div className="flex flex-col items-center text-center p-8">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mb-4" />
          <h4 className="font-black text-white uppercase tracking-widest text-xs mb-2">Secure Verification</h4>
          <p className="text-sm text-gray-500">Your data is encrypted and protected.</p>
        </div>
      </div>
    </div>
  );
};
