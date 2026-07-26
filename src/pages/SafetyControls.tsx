import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';
import { Shield, Lock, Eye, Clock, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { motion } from 'motion/react';

export const SafetyControls = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    contentFilter: 'strict',
    spendingLimit: '50',
    requireApproval: true,
    timeLimit: '2',
    blockDMs: true,
    publicProfile: false
  });

  const handleSave = () => {
    setIsSaving(true);
    // Mock save
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      <Helmet>
        <title>Safety Controls | Wersee Kids</title>
      </Helmet>
      
      <NavBar />
      
      <main className="flex-1 pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-black">Safety Controls</h1>
              <p className="text-gray-400 mt-1">Manage boundaries and protections for your child's account.</p>
            </div>
          </div>

          <div className="space-y-6">
            
            {/* Content & Discovery */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Eye className="w-6 h-6 text-purple-400" />
                Content & Discovery
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Content Filter Level</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {['strict', 'moderate', 'off'].map((level) => (
                      <button
                        key={level}
                        onClick={() => setSettings({ ...settings, contentFilter: level })}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          settings.contentFilter === level 
                            ? 'bg-blue-600/20 border-blue-500 text-white' 
                            : 'bg-black/40 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="font-bold capitalize mb-1">{level}</div>
                        <div className="text-xs opacity-80">
                          {level === 'strict' && 'Blocks all mature content and unverified sellers.'}
                          {level === 'moderate' && 'Filters explicit content but allows general browsing.'}
                          {level === 'off' && 'No filtering applied. Not recommended for under 13.'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Public Profile</div>
                    <div className="text-sm text-gray-400">Allow the store to be discovered in public search.</div>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, publicProfile: !settings.publicProfile })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings.publicProfile ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.publicProfile ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Financial Controls */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Lock className="w-6 h-6 text-emerald-400" />
                Financial Controls
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Monthly Spending Limit ($)</label>
                  <input 
                    type="number" 
                    value={settings.spendingLimit}
                    onChange={(e) => setSettings({ ...settings, spendingLimit: e.target.value })}
                    className="w-full max-w-xs bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Require Approval for Payment Links</div>
                    <div className="text-sm text-gray-400">You must approve every payment link before it goes live.</div>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, requireApproval: !settings.requireApproval })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings.requireApproval ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.requireApproval ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Screen Time & Communication */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-yellow-400" />
                Time & Communication
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Daily Time Limit (Hours)</label>
                  <input 
                    type="number" 
                    value={settings.timeLimit}
                    onChange={(e) => setSettings({ ...settings, timeLimit: e.target.value })}
                    className="w-full max-w-xs bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                  <div>
                    <div className="font-bold text-white">Block Direct Messages</div>
                    <div className="text-sm text-gray-400">Prevent customers from sending direct messages to the creator.</div>
                  </div>
                  <button 
                    onClick={() => setSettings({ ...settings, blockDMs: !settings.blockDMs })}
                    className={`w-14 h-8 rounded-full transition-colors relative ${settings.blockDMs ? 'bg-emerald-500' : 'bg-gray-600'}`}
                  >
                    <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-transform ${settings.blockDMs ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-4 pt-4">
              {saved && (
                <motion.span 
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-emerald-400 flex items-center gap-2 font-bold"
                >
                  <CheckCircle className="w-5 h-5" /> Saved Successfully
                </motion.span>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-8 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Changes</>}
              </button>
            </div>

          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};