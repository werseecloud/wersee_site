import React, { useState, useEffect } from 'react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { Tag, Plus, Trash2, Copy, CheckCircle, AlertCircle } from 'lucide-react';

import { appToast } from '@/lib/feedback';
export const MoneyCouponsView = () => {
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [accountId, setAccountId] = useState<string | null>(null);

  // New Coupon State
  const [name, setName] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [percentOff, setPercentOff] = useState('');
  const [amountOff, setAmountOff] = useState('');
  const [duration, setDuration] = useState('once');
  const [durationInMonths, setDurationInMonths] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [promoCode, setPromoCode] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('stripe_account_id')
        .eq('id', user.id)
        .single();

      if (profile?.stripe_account_id) {
        setAccountId(profile.stripe_account_id);
        
        // Fetch coupons
        const couponsData = await invokeApiRunner('coupon-list', { accountId: profile.stripe_account_id });
        if (!couponsData.error) {
          setCoupons(couponsData);
        }

        // Fetch promo codes
        const promoData = await invokeApiRunner('promo-code-list', { accountId: profile.stripe_account_id });
        if (!promoData.error) {
          setPromoCodes(promoData);
        }
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    setIsCreating(true);
    try {
      // 1. Create Coupon
      const coupon = await invokeApiRunner('coupon-create', {
        accountId,
        name: name || undefined,
        percent_off: discountType === 'percent' ? parseFloat(percentOff) : undefined,
        amount_off: discountType === 'amount' ? parseFloat(amountOff) : undefined,
        currency: 'eur',
        duration,
        duration_in_months: duration === 'repeating' ? parseInt(durationInMonths) : undefined,
        max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
      });

      if (coupon.error) {
        throw new Error(coupon.error || 'Failed to create coupon');
      }

      // 2. Create Promotion Code (if specified)
      if (promoCode && coupon?.id) {
        const promoData = await invokeApiRunner('promo-code-create', {
          accountId,
          coupon_id: coupon.id,
          code: promoCode,
          max_redemptions: maxRedemptions ? parseInt(maxRedemptions) : undefined,
        });

        if (promoData.error) {
          throw new Error(promoData.error || 'Failed to create promo code');
        }
      }

      // Reset form and refresh
      setName('');
      setPercentOff('');
      setAmountOff('');
      setDuration('once');
      setDurationInMonths('');
      setMaxRedemptions('');
      setPromoCode('');
      fetchData();
    } catch (error) {
      console.error('Error creating coupon:', error);
      appToast('Failed to create coupon. Please check the inputs.');
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-3xl font-bold text-white mb-1 md:mb-2">Coupons & Discounts</h1>
        <p className="text-xs md:text-sm text-gray-400">Create and manage promotional codes for your customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Create Form */}
        <div className="lg:col-span-1">
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <Plus className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
              New Discount
            </h2>

            <form onSubmit={handleCreateCoupon} className="space-y-4">
              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Internal Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Sale 2024"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Type</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 md:px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                  >
                    <option value="percent">Percentage</option>
                    <option value="amount">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Value</label>
                  <div className="relative">
                    {discountType === 'amount' && <span className="absolute left-3 top-2 text-gray-500 text-xs md:text-sm">€</span>}
                    <input
                      type="number"
                      value={discountType === 'percent' ? percentOff : amountOff}
                      onChange={(e) => discountType === 'percent' ? setPercentOff(e.target.value) : setAmountOff(e.target.value)}
                      placeholder={discountType === 'percent' ? "20" : "10.00"}
                      className={`w-full bg-white/5 border border-white/10 rounded-xl py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all ${discountType === 'amount' ? 'pl-7 md:pl-8 pr-4' : 'px-4'}`}
                      required
                    />
                    {discountType === 'percent' && <span className="absolute right-3 top-2 text-gray-500 text-xs md:text-sm">%</span>}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Customer Facing Code (Optional)</label>
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUMMER20"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 font-mono uppercase transition-all"
                />
                <p className="text-[10px] text-gray-500 mt-1">If left blank, the discount applies automatically to specific links.</p>
              </div>

              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all appearance-none"
                >
                  <option value="once">Once</option>
                  <option value="repeating">Multiple Months</option>
                  <option value="forever">Forever</option>
                </select>
              </div>

              {duration === 'repeating' && (
                <div>
                  <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Number of Months</label>
                  <input
                    type="number"
                    value={durationInMonths}
                    onChange={(e) => setDurationInMonths(e.target.value)}
                    placeholder="e.g. 3"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] md:text-sm font-medium text-gray-400 mb-1 uppercase tracking-wider">Max Redemptions (Optional)</label>
                <input
                  type="number"
                  value={maxRedemptions}
                  onChange={(e) => setMaxRedemptions(e.target.value)}
                  placeholder="e.g. 100"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs md:text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating || !accountId}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 mt-4 text-sm"
              >
                {isCreating ? 'Creating...' : 'Create Discount'}
              </button>
            </form>
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#141414] border border-white/5 rounded-2xl md:rounded-3xl p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2">
              <Tag className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
              Active Promotion Codes
            </h2>

            {Array.isArray(promoCodes) && promoCodes.length === 0 ? (
              <div className="text-center py-8 md:py-12 border border-white/5 rounded-2xl bg-white/[0.02]">
                <Tag className="w-10 h-10 md:w-12 md:h-12 text-gray-600 mx-auto mb-3 md:mb-4" />
                <h3 className="text-base md:text-lg font-medium text-white mb-1">No promotion codes yet</h3>
                <p className="text-xs md:text-sm text-gray-500">Create your first discount code to share with customers.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Array.isArray(promoCodes) && promoCodes.map((promo) => (
                  <div key={promo.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all gap-3">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="p-2.5 md:p-3 bg-indigo-500/10 rounded-xl">
                        <Tag className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm md:text-base font-bold text-white font-mono">{promo.code}</h3>
                          {promo.active && <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Active</span>}
                        </div>
                        <p className="text-[10px] md:text-sm text-gray-400">
                          {promo.coupon?.percent_off ? `${promo.coupon.percent_off}% off` : promo.coupon?.amount_off ? `€${(promo.coupon.amount_off / 100).toFixed(2)} off` : 'Discount'}
                          {' • '}
                          {promo.coupon?.duration === 'once' ? 'Once' : promo.coupon?.duration === 'repeating' ? `${promo.coupon.duration_in_months} months` : 'Forever'}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right pl-12 sm:pl-0">
                      <p className="text-[10px] md:text-sm text-gray-400">
                        {promo.times_redeemed} {promo.max_redemptions ? `/ ${promo.max_redemptions}` : ''} redemptions
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
