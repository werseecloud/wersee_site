import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, Users, Rocket, Globe, 
  ArrowRight, CheckCircle2, Send, Mail, School, 
  Target, Zap, ShieldCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

import { appToast } from '@/lib/feedback';
export const CampusProgram: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<'lp' | 'form' | 'success'>('lp');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    institutionName: '',
    contactPerson: '',
    contactEmail: '',
    institutionType: 'University',
    studentCount: '',
    intendedUse: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('campus_program_applications').insert({
        user_id: user.id,
        institution_name: formData.institutionName,
        contact_person: formData.contactPerson,
        contact_email: formData.contactEmail,
        institution_type: formData.institutionType,
        student_count: parseInt(formData.studentCount) || 0,
        intended_use: formData.intendedUse,
      });

      if (error) throw error;
      setStep('success');
    } catch (err) {
      console.error('Error applying for campus program:', err);
      appToast('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-500/20">
          <CheckCircle2 className="w-12 h-12 text-indigo-400" />
        </div>
        <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Application Submitted!</h2>
        <p className="text-gray-400 max-w-md leading-relaxed text-lg">
          Thank you for reaching out. Our education partnership team will review your application and contact you within 5 business days.
        </p>
      </div>
    );
  }

  if (step === 'form') {
    return (
      <div className="max-w-3xl mx-auto py-16 px-6">
        <button onClick={() => setStep('lp')} className="text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest mb-10 flex items-center gap-2">
          <ArrowRight className="w-4 h-4 rotate-180" /> Back to info
        </button>
        
        <div className="mb-12">
          <h2 className="text-5xl font-black text-white tracking-tighter mb-4">Partner with Wersee</h2>
          <p className="text-xl text-gray-400 leading-relaxed">Tell us about your institution and how you plan to use Wersee for learning.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Institution Name</label>
              <div className="relative">
                <School className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  required
                  type="text"
                  value={formData.institutionName}
                  onChange={e => setFormData({...formData, institutionName: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="University of Technology"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Institution Type</label>
              <select 
                value={formData.institutionType}
                onChange={e => setFormData({...formData, institutionType: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
              >
                <option value="University">University</option>
                <option value="High School">High School</option>
                <option value="Bootcamp">Bootcamp / Academy</option>
                <option value="Non-Profit">Non-Profit / NGO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Contact Person</label>
              <div className="relative">
                <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  required
                  type="text"
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="Dr. Sarah Miller"
                />
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Contact Email</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  required
                  type="email"
                  value={formData.contactEmail}
                  onChange={e => setFormData({...formData, contactEmail: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  placeholder="sarah@university.edu"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Estimated Number of Students</label>
            <input 
              required
              type="number"
              value={formData.studentCount}
              onChange={e => setFormData({...formData, studentCount: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              placeholder="e.g. 500"
            />
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Intended Use & Goals</label>
            <textarea 
              required
              rows={5}
              value={formData.intendedUse}
              onChange={e => setFormData({...formData, intendedUse: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-[2.5rem] py-6 px-8 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
              placeholder="How will Wersee help your students learn? What are your key objectives?"
            />
          </div>

          <button 
            disabled={loading}
            type="submit"
            className="w-full bg-indigo-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-indigo-400 transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-2xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : (
              <>
                Submit Partnership Request <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-16 px-6">
      {/* Hero Section */}
      <div className="text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8">
            <Globe className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Campus Partnership Program</span>
          </div>
          <h1 className="text-7xl md:text-8xl font-black text-white leading-[0.85] tracking-tighter mb-10">
            Empower the <br />
            <span className="text-indigo-400">Next Generation.</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto mb-12">
            Bring Wersee's advanced workspace and AI tools to your institution. We work closely with schools to build the future of education.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => setStep('form')}
              className="px-12 py-6 bg-white text-black rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-3 shadow-2xl shadow-white/10"
            >
              Apply for Partnership <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-12 py-6 bg-white/5 text-white border border-white/10 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-white/10 transition-all active:scale-95">
              View Case Studies
            </button>
          </div>
        </motion.div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32">
        {[
          {
            icon: Target,
            title: 'Curriculum Integration',
            desc: 'Embed Wersee directly into your courses with custom templates and learning modules.',
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10'
          },
          {
            icon: Zap,
            title: 'AI-Powered Learning',
            desc: 'Give students and faculty access to cutting-edge AI assistants designed for education.',
            color: 'text-purple-400',
            bg: 'bg-purple-500/10'
          },
          {
            icon: Rocket,
            title: 'Growth & Support',
            desc: 'Dedicated account managers and priority support to ensure your campus succeeds.',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
          }
        ].map((feature, i) => (
          <div key={i} className="p-10 bg-[#141414] border border-white/10 rounded-[3rem] hover:border-white/20 transition-all group">
            <div className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
              <feature.icon className={`w-8 h-8 ${feature.color}`} />
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{feature.title}</h3>
            <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="relative p-12 md:p-20 rounded-[4rem] bg-gradient-to-br from-indigo-600 to-purple-600 overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-10">
          <Building2 className="w-64 h-64 text-white" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-black text-white mb-6 leading-tight tracking-tighter">Ready to transform your campus?</h2>
          <p className="text-xl text-indigo-100 mb-10 leading-relaxed">Join 500+ institutions worldwide using Wersee to redefine the educational experience.</p>
          <button 
            onClick={() => setStep('form')}
            className="px-12 py-6 bg-white text-indigo-600 rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-2xl"
          >
            Start Your Application
          </button>
        </div>
      </div>
    </div>
  );
};
