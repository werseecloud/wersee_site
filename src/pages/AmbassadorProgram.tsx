import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle, Users, Loader2, Send } from 'lucide-react';
import { PageWrapper } from '../components/PageWrapper';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const AmbassadorProgram = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    socialLinks: '',
    motivation: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to apply.');
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('ambassador_applications')
        .insert([
          {
            user_id: user.id,
            full_name: formData.fullName,
            email: formData.email,
            social_media_links: formData.socialLinks,
            motivation: formData.motivation
          }
        ]);
      
      if (error) throw error;
      setMessage('Thank you for your application! We will be in touch as soon as possible.');
      setFormData({ fullName: '', email: '', socialLinks: '', motivation: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#F5F5F7] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Ambassador Program</h1>
            <p className="text-xl text-gray-500">Become the face of Wersee and help us grow.</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-12">
            <h2 className="text-2xl font-bold mb-6">The Rules</h2>
            <ul className="space-y-4 text-gray-600">
              <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" /> You are active on social media and have a passion for Wersee.</li>
              <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" /> You are willing to promote Wersee within your network.</li>
              <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" /> You are professional and represent our brand well.</li>
              <li className="flex gap-3"><CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" /> You follow our content creation guidelines.</li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6">Application Form</h2>
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6">{error}</div>}
            {message && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6">{message}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input type="text" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <input type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Social Media Links</label>
                <input type="text" required value={formData.socialLinks} onChange={e => setFormData({...formData, socialLinks: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Why do you want to become an ambassador?</label>
                <textarea required value={formData.motivation} onChange={e => setFormData({...formData, motivation: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-indigo-500 h-32" />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-5 h-5" /> Submit Application</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
