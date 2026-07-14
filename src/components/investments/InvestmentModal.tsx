import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface InvestmentModalProps {
  campaign: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InvestmentModal({ campaign, onClose, onSuccess }: InvestmentModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [amount, setAmount] = useState<number>(campaign.min_investment);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valuation = (campaign.funding_goal / campaign.equity_offered) * 100;
  const equityPercentage = (amount / valuation) * 100;

  const handleInvest = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      navigate(`/invest/${campaign.slug || campaign.id}/checkout`, {
        state: { amount },
      });
    } catch (err: any) {
      console.error('Investment error:', err);
      setError(err.message || 'Failed to process investment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-md overflow-hidden relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-8">
          {step === 1 && (
            <>
              <h2 className="text-2xl font-bold mb-2">Invest in {campaign.businesses?.name}</h2>
              <p className="text-gray-400 mb-8">Choose your investment amount.</p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Investment Amount (€)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">€</span>
                    <input
                      type="number"
                      min={campaign.min_investment}
                      step="100"
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full bg-black border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                    />
                  </div>
                  {amount < campaign.min_investment && (
                    <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Minimum investment is €{campaign.min_investment}
                    </p>
                  )}
                </div>

                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Valuation</span>
                    <span className="font-medium">€{valuation.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Equity you receive</span>
                    <span className="font-bold text-emerald-400">{equityPercentage.toFixed(4)}%</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={amount < campaign.min_investment}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold transition-colors"
                >
                  Continue to Contract
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl font-bold mb-2">Review & Sign</h2>
              <p className="text-gray-400 mb-6">Simulated SAFE Agreement</p>

              <div className="bg-black border border-white/10 rounded-xl p-4 h-48 overflow-y-auto mb-6 text-sm text-gray-300 space-y-4">
                <p className="font-bold text-white">SIMULATED INVESTMENT AGREEMENT</p>
                <p>This is a simulated agreement for demonstration purposes on the Wersee platform.</p>
                <p>By clicking "Accept & Invest", you agree to simulate an investment of <strong>€{amount.toLocaleString()}</strong> in exchange for <strong>{equityPercentage.toFixed(4)}%</strong> simulated equity in {campaign.businesses?.name}.</p>
                <p>No real funds will be transferred. This does not constitute a legally binding financial contract.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm mb-6">
                  {error}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleInvest}
                  disabled={loading}
                  className="flex-[2] py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 flex items-center justify-center gap-2 text-white rounded-xl font-bold transition-colors"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5" />
                      Accept & Invest
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Investment Successful!</h2>
              <p className="text-gray-400 mb-8">
                You are now a simulated shareholder in {campaign.businesses?.name}.
              </p>
              <button
                onClick={onSuccess}
                className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors"
              >
                View Portfolio
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
