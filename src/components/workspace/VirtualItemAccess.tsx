import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Copy, CheckCircle, ExternalLink, Box } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../../lib/supabase';

interface VirtualItemAccessProps {
  listing: any;
  onClose: () => void;
}

export const VirtualItemAccess: React.FC<VirtualItemAccessProps> = ({ listing, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  useEffect(() => {
    // Generate or fetch a license key for the virtual item
    const fetchKey = async () => {
      // In a real app, this would fetch the specific key assigned to the user's purchase
      // For now, we simulate it or use metadata
      if (listing?.metadata?.licenseKey) {
        setLicenseKey(listing.metadata.licenseKey);
      } else {
        // Generate a mock key for demonstration
        const mockKey = `VI-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        setLicenseKey(mockKey);
      }
    };
    fetchKey();
  }, [listing]);

  const handleCopy = () => {
    if (licenseKey) {
      navigator.clipboard.writeText(licenseKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="h-full bg-[#F5F5F7] dark:bg-black overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 pt-12">
        <button 
          onClick={onClose}
          className="mb-8 text-sm font-medium text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors flex items-center gap-2"
        >
          &larr; Back to Workspace
        </button>

        <div className="bg-white dark:bg-[#1D1D1F] rounded-3xl p-8 shadow-sm border border-black/5 dark:border-white/10">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="w-full md:w-1/3 aspect-square bg-purple-50 dark:bg-purple-500/5 rounded-2xl overflow-hidden relative flex-shrink-0 flex items-center justify-center border border-purple-100 dark:border-purple-500/20">
              {listing?.image_url || listing?.image ? (
                <img src={listing.image_url || listing.image} alt={listing.title} className="w-full h-full object-cover" />
              ) : (
                <Box className="w-24 h-24 text-purple-400 dark:text-purple-500/50" />
              )}
              <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-black/50 backdrop-blur-md rounded-full text-xs font-bold text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-500/30 shadow-sm">
                Virtual Item
              </div>
            </div>

            <div className="flex-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-wider mb-4">
                <Key className="w-3 h-3" /> Access Credentials
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{listing?.title}</h1>
              <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                {listing?.description || 'Your virtual item is ready. Use the credentials below to access it.'}
              </p>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 border border-gray-100 dark:border-white/10">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> License Key
                  </h3>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 font-mono text-lg text-gray-800 dark:text-gray-200 tracking-wider">
                      {licenseKey || 'Generating...'}
                    </div>
                    <button
                      onClick={handleCopy}
                      className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors flex-shrink-0"
                      title="Copy to clipboard"
                    >
                      {copied ? <CheckCircle className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </button>
                  </div>
                  {copied && <p className="text-emerald-500 text-sm mt-2 font-medium">Copied to clipboard!</p>}
                </div>

                <div className="bg-blue-50 dark:bg-blue-500/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-500/20">
                  <h3 className="text-sm font-bold text-blue-900 dark:text-blue-400 uppercase tracking-wider mb-2">
                    Instructions
                  </h3>
                  <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-300 space-y-2">
                    <li>Copy your license key above.</li>
                    <li>Navigate to the redemption portal.</li>
                    <li>Enter the key to unlock your virtual item.</li>
                    <li>Keep this key secure; do not share it.</li>
                  </ul>
                  
                  {listing?.metadata?.redemptionUrl && (
                    <a 
                      href={listing.metadata.redemptionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-colors"
                    >
                      Go to Redemption Portal <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
