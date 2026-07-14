import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, CheckCircle, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { kycService } from '../services/kycService';

interface KycStepProps {
  userId: string;
  onComplete: () => void;
}

export const KycStep: React.FC<KycStepProps> = ({ userId, onComplete }) => {
  const [status, setStatus] = useState<'not_started' | 'pending' | 'verified' | 'requires_input'>('not_started');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
    // Poll status if pending
    const interval = setInterval(() => {
      if (status === 'pending') {
        checkStatus();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [status]);

  const checkStatus = async () => {
    try {
      const res = await kycService.getStatus(userId);
      setStatus(res.status);
      if (res.status === 'verified') {
        onComplete();
      }
    } catch (err) {
      console.error('Error checking KYC status:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartKyc = async () => {
    setActionLoading(true);
    setError(null);
    try {
      const { url } = await kycService.createSession(userId);
      
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        window.location.href = url;
      } else {
        window.open(url, '_blank');
        setStatus('pending');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 animate-spin text-white mb-4" />
        <p className="text-white/50">Checking verification status...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${
          status === 'verified' ? 'bg-emerald-500/10 border-emerald-500/20' : 
          status === 'pending' ? 'bg-blue-500/10 border-blue-500/20' : 
          status === 'requires_input' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-white/5 border-white/10'
        }`}>
          {status === 'verified' ? (
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          ) : status === 'pending' ? (
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          ) : status === 'requires_input' ? (
            <AlertCircle className="w-10 h-10 text-amber-400" />
          ) : (
            <Shield className="w-10 h-10 text-white/40" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          {status === 'verified' ? 'Identity Verified' : 
           status === 'pending' ? 'Verification Pending' : 
           status === 'requires_input' ? 'Action Required' : 'Verify Your Identity'}
        </h2>
        <p className="text-white/50 mt-3 text-lg">
          {status === 'verified' ? 'Your identity has been successfully verified.' : 
           status === 'pending' ? 'Stripe is currently reviewing your documents. This usually takes a few minutes.' : 
           status === 'requires_input' ? 'There was an issue with your documents. Please try again.' : 
           'To ensure a safe community, we use Stripe to verify your identity.'}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {status !== 'verified' && (
        <div className="space-y-4">
          <button
            onClick={handleStartKyc}
            disabled={actionLoading}
            className="w-full py-4 bg-white text-black rounded-2xl font-bold text-lg hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {status === 'not_started' ? 'Start Verification' : 'Retry Verification'}
                <ExternalLink className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            onClick={handleStartKyc}
            className="w-full text-center text-sm text-white/40 hover:text-white underline transition-colors"
          >
            Or open verification directly in Stripe
          </button>
          
          {status === 'pending' && (
            <button
              onClick={checkStatus}
              className="w-full py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all"
            >
              Check Status Now
            </button>
          )}

          <p className="text-xs text-center text-white/30">
            Verification is handled securely by Stripe. We never see your sensitive documents.
          </p>
        </div>
      )}
    </div>
  );
};
