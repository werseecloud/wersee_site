import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Link as LinkIcon, Pencil, ArrowRight, Loader2, Check, ShieldCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { COUNTRIES } from '../../lib/countries';
import { isEuCountry, requiresDsaSellerVerification, storeDsaCountryCode, upsertDsaSellerVerification } from '../../lib/dsaCompliance';

import { appToast } from '@/lib/feedback';
interface WizardProps {
  onClose: () => void; // Used to navigate back or close
}

export const WorkspaceCreateBusinessWizard: React.FC<WizardProps> = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [method, setMethod] = useState<'ai' | 'url' | 'scratch' | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [prompt, setPrompt] = useState('');
  const [url, setUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [countryCode, setCountryCode] = useState('NL');
  const [traderStatus, setTraderStatus] = useState<'consumer' | 'business'>('consumer');
  const [legalName, setLegalName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [vatOrTaxId, setVatOrTaxId] = useState('');

  const needsDsaVerification = requiresDsaSellerVerification({ countryCode, traderStatus });
  const dsaReady = !needsDsaVerification || Boolean(legalName && contactEmail && registeredAddress);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create business in Supabase
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: businessName,
          description: description.trim(),
          country_code: countryCode,
          trader_status: traderStatus,
          dsa_verification_status: needsDsaVerification ? 'pending' : 'not_required',
          // description: description, // Assuming column exists or will be added
          // category: category,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      storeDsaCountryCode(countryCode);

      await upsertDsaSellerVerification({
        seller_id: user.id,
        business_id: data.id,
        trader_status: traderStatus,
        legal_name: needsDsaVerification ? legalName : businessName,
        contact_email: needsDsaVerification ? contactEmail : user.email || '',
        country_code: countryCode,
        registered_address: needsDsaVerification ? registeredAddress : null,
        registration_number: registrationNumber || null,
        vat_or_tax_id: vatOrTaxId || null,
        status: needsDsaVerification ? 'pending' : 'not_required',
      });

      // Simulate AI processing if method is AI or URL
      if (method === 'ai' || method === 'url') {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Fake AI delay
      }

      window.dispatchEvent(new CustomEvent('workspace:business-created', { detail: data }));
      appToast('Business created and saved');
      onClose(); // Navigate back to dashboard
    } catch (error) {
      console.error('Error creating business:', error);
      appToast('Failed to create business');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-white mb-4 text-center">How would you like to start?</h1>
            <p className="text-gray-400 text-center mb-12">Choose the best way to launch your new business.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => { setMethod('ai'); setStep(2); }}
                className="group relative p-8 rounded-3xl bg-[#141414] border border-white/10 hover:border-indigo-500/50 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Bot className="w-7 h-7 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Use AI Assistant</h3>
                <p className="text-sm text-gray-400">Describe your idea and let AI generate your business structure, products, and community.</p>
              </button>

              <button 
                onClick={() => { setMethod('url'); setStep(2); }}
                className="group relative p-8 rounded-3xl bg-[#141414] border border-white/10 hover:border-emerald-500/50 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <LinkIcon className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Import from URL</h3>
                <p className="text-sm text-gray-400">Enter a website URL and we'll extract content to build your workspace automatically.</p>
              </button>

              <button 
                onClick={() => { setMethod('scratch'); setStep(3); }}
                className="group relative p-8 rounded-3xl bg-[#141414] border border-white/10 hover:border-amber-500/50 hover:bg-white/5 transition-all text-left"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Pencil className="w-7 h-7 text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Start from Scratch</h3>
                <p className="text-sm text-gray-400">Build everything manually step-by-step. Best for full control over every detail.</p>
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              {method === 'ai' ? 'Describe your vision' : 'Enter your website'}
            </h1>
            <p className="text-gray-400 mb-8">
              {method === 'ai' 
                ? 'Tell us about your business idea, target audience, and what you plan to sell.' 
                : 'Paste the URL of your existing website or social media profile.'}
            </p>

            <div className="space-y-6">
              {method === 'ai' ? (
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full h-48 bg-[#141414] border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
                  placeholder="I want to start a fitness coaching business for busy professionals..."
                />
              ) : (
                <input 
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                  placeholder="https://example.com"
                />
              )}

              <button 
                onClick={() => setStep(3)}
                disabled={method === 'ai' ? !prompt : !url}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(method === 'scratch' ? 1 : 2)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">What's your business name?</h1>
            <p className="text-gray-400 mb-8">Choose a name that reflects your brand.</p>

            <div className="space-y-6">
              <input 
                type="text" 
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors"
                placeholder="Acme Corp"
                autoFocus
              />

              <button 
                onClick={() => setStep(4)}
                disabled={!businessName}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">Describe your business</h1>
            <p className="text-gray-400 mb-8">Tell us what your business does in a few sentences.</p>

            <div className="space-y-6">
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors resize-none"
                placeholder="We help small businesses grow..."
                autoFocus
              />

              <button 
                onClick={() => setStep(5)}
                disabled={!description}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="max-w-2xl mx-auto">
            <button onClick={() => setStep(4)} className="text-sm text-gray-500 hover:text-white mb-8">← Back</button>
            
            <h1 className="text-3xl font-bold text-white mb-4">Select a category</h1>
            <p className="text-gray-400 mb-8">Help us categorize your business correctly.</p>

            <div className="space-y-6">
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-white/30 transition-colors appearance-none"
              >
                <option value="">Select a category</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
                <option value="community">Community</option>
                <option value="education">Education</option>
                <option value="service">Service</option>
                <option value="other">Other</option>
              </select>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="mt-1 rounded-xl bg-blue-500/10 p-2 text-blue-300">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white">EU marketplace verification</h2>
                    <p className="mt-1 text-sm text-gray-400">
                      EU business sellers must provide traceability details before selling products or services.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Country</span>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-white/30"
                    >
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>{country.name}</option>
                      ))}
                    </select>
                  </label>
                  <label className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Seller type</span>
                    <select
                      value={traderStatus}
                      onChange={(e) => setTraderStatus(e.target.value as 'consumer' | 'business')}
                      className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-white/30"
                    >
                      <option value="consumer">Private seller</option>
                      <option value="business">Business seller</option>
                    </select>
                  </label>
                </div>

                {isEuCountry(countryCode) && traderStatus === 'business' && (
                  <div className="mt-5 grid gap-4">
                    <input
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Legal business name"
                      className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-blue-400"
                    />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="Public contact email"
                      className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-blue-400"
                    />
                    <input
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                      placeholder="Registered business address"
                      className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-blue-400"
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <input
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        placeholder="Registration number"
                        className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-blue-400"
                      />
                      <input
                        value={vatOrTaxId}
                        onChange={(e) => setVatOrTaxId(e.target.value)}
                        placeholder="VAT / tax ID"
                        className="w-full rounded-xl border border-white/10 bg-[#141414] p-4 text-white outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleCreate}
                disabled={!category || loading || !dsaReady}
                className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                {loading ? 'Creating...' : 'Create Business'}
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {renderStep()}
      </motion.div>
    </div>
  );
};
