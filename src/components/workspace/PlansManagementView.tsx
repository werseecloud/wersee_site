import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, CreditCard, Check, X, Loader2, Link2 } from 'lucide-react';

import { appToast, destructiveAction } from '@/lib/feedback';
export const PlansManagementView: React.FC<{ businessId?: string }> = ({ businessId }) => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [businessId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get business first
      let bId = businessId;
      if (!bId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: bData, error: businessError } = await supabase.from('businesses').select('id, slug').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
          if (businessError) throw businessError;
          if (bData) bId = bData.id;
          if (bData) setBusiness(bData);
        }
      } else {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(businessId || '');
        let query = supabase.from('businesses').select('id, slug');
        if (isUUID) {
          query = query.or(`slug.eq.${businessId},id.eq.${businessId}`);
        } else {
          query = query.eq('slug', businessId);
        }
        const { data: bData } = await query.maybeSingle();
        if (bData) {
          bId = bData.id;
          setBusiness(bData);
        }
      }

      if (bId) {
        if (!business) {
          const { data: resolvedBusiness, error: resolvedError } = await supabase.from('businesses').select('id, slug').eq('id', bId).maybeSingle();
          if (resolvedError) throw resolvedError;
          if (resolvedBusiness) setBusiness(resolvedBusiness);
        }
        const { data: plansData, error } = await supabase
          .from('plans')
          .select('*')
          .eq('business_id', bId)
          .order('created_at', { ascending: false });
          
        if (error && error.code !== '42P01') throw error; // Ignore table not found if it hasn't been created yet
        setPlans(plansData || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;

    try {
      setLoading(true);
      const { id: currentPlanId, created_at: _createdAt, updated_at: _updatedAt, ...editablePlan } = currentPlan;
      const planData = {
        ...editablePlan,
        features: typeof editablePlan.features === 'string' ? JSON.parse(editablePlan.features) : editablePlan.features,
        business_id: business.id,
      };

      if (currentPlanId) {
        const { error } = await supabase.from('plans').update(planData).eq('id', currentPlanId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('plans').insert([planData]);
        if (error) throw error;
      }
      
      setIsEditing(false);
      await fetchData();
      appToast(currentPlanId ? 'Plan updated.' : 'Plan created.', 'success');
    } catch (err) {
      console.error('Error saving plan:', err);
      appToast(err instanceof SyntaxError ? 'Features must be a valid JSON array.' : 'The plan could not be saved.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this plan?' }))) return;
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      await fetchData();
      appToast('Plan deleted.', 'success');
    } catch (err) {
      console.error('Error deleting plan:', err);
      appToast('The plan could not be deleted.', 'error');
    }
  };

  if (isEditing) {
    return (
      <div className="max-w-2xl mx-auto bg-[#111] p-8 rounded-3xl border border-white/5">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">{currentPlan?.id ? 'Edit Plan' : 'Create New Plan'}</h2>
          <button onClick={() => setIsEditing(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Plan Name</label>
            <input 
              type="text" 
              required
              value={currentPlan?.name || ''} 
              onChange={e => setCurrentPlan({...currentPlan, name: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Pro Plan"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Description</label>
            <textarea 
              value={currentPlan?.description || ''} 
              onChange={e => setCurrentPlan({...currentPlan, description: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 min-h-[100px]"
              placeholder="Describe what's included..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Price</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={currentPlan?.price || ''} 
                  onChange={e => setCurrentPlan({...currentPlan, price: parseFloat(e.target.value)})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Billing Interval</label>
              <select 
                value={currentPlan?.interval || 'month'} 
                onChange={e => setCurrentPlan({...currentPlan, interval: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="day">Daily</option>
                <option value="week">Weekly</option>
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Features (JSON array of strings)</label>
            <textarea 
              value={typeof currentPlan?.features === 'string' ? currentPlan.features : JSON.stringify(currentPlan?.features || [])} 
              onChange={e => {
                try {
                  setCurrentPlan({...currentPlan, features: JSON.parse(e.target.value)});
                } catch {
                  setCurrentPlan({...currentPlan, features: e.target.value});
                }
              }}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 font-mono text-sm"
              placeholder='["Feature 1", "Feature 2"]'
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="is_active"
              checked={currentPlan?.is_active ?? true}
              onChange={e => setCurrentPlan({...currentPlan, is_active: e.target.checked})}
              className="w-5 h-5 rounded border-white/10 bg-white/5 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-gray-900"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-white">Active (visible to customers)</label>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-3 rounded-xl font-bold text-white bg-white/5 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl font-bold text-black bg-white hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Save Plan
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Subscription Plans</h2>
          <p className="text-gray-400">Create and manage recurring subscription plans for your customers.</p>
        </div>
        <button 
          onClick={() => {
            setCurrentPlan({ name: '', price: 0, interval: 'month', features: [], is_active: true });
            setIsEditing(true);
          }}
          className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Create Plan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-[#111] rounded-3xl border border-white/5 p-12 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-10 h-10 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3">No plans yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mb-8">Create your first subscription plan to start generating recurring revenue.</p>
          <button 
            onClick={() => {
              setCurrentPlan({ name: '', price: 0, interval: 'month', features: [], is_active: true });
              setIsEditing(true);
            }}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Create Your First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-[#111] rounded-3xl border border-white/5 p-6 flex flex-col relative overflow-hidden group">
              {!plan.is_active && (
                <div className="absolute top-4 right-4 px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-lg">
                  Inactive
                </div>
              )}
              <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-black text-white">€{plan.price}</span>
                <span className="text-gray-500 font-medium">/{plan.interval}</span>
              </div>
              <p className="text-gray-400 text-sm mb-6 flex-1">{plan.description}</p>
              
              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                {business?.slug && (
                  <button
                    type="button"
                    onClick={() => {
                      const url = `${window.location.origin}/${encodeURIComponent(business.slug)}?plan=${encodeURIComponent(plan.id)}#plan-${encodeURIComponent(plan.id)}`;
                      void navigator.clipboard.writeText(url).then(() => appToast('Plan link copied.', 'success'));
                    }}
                    className="p-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 rounded-xl transition-colors"
                    aria-label={`Copy link for ${plan.name}`}
                    title="Copy public plan link"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => {
                    setCurrentPlan(plan);
                    setIsEditing(true);
                  }}
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(plan.id)}
                  className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
