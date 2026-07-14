import { useEffect, useState } from 'react';
import { 
  Users, Link as LinkIcon, DollarSign, Settings, 
  Plus, Copy, CheckCircle, Loader2, Save, 
  ExternalLink, UserPlus, TrendingUp, ShieldCheck,
  Wand2
} from 'lucide-react';
import { supabase, supabaseUrl } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { AffiliateProgramBuilder } from './AffiliateProgramBuilder';
import { toast } from 'sonner';

const AffiliateCard = ({ name, earnings, status, code }: any) => (
  <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-white/10 transition-colors">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
      <div>
        <h3 className="font-medium text-white">{name}</h3>
        <p className="text-sm text-gray-500 font-mono">Code: {code}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-white font-bold">€{earnings.toFixed(2)}</p>
      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
        status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
        status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
        'bg-gray-500/10 text-gray-400 border border-gray-500/20'
      }`}>
        {status}
      </span>
    </div>
  </div>
);

const ReferralCard = ({ referral }: any) => (
  <div className="bg-[#141414] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-gray-400">
        <UserPlus className="w-4 h-4" />
      </div>
      <div>
        <p className="text-sm text-white font-medium">Visitor {referral.visitor_id?.substring(0, 8)}...</p>
        <p className="text-[10px] text-gray-500">{new Date(referral.created_at).toLocaleDateString()}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      {referral.converted ? (
        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-bold uppercase">Converted</span>
      ) : (
        <span className="text-[10px] px-2 py-0.5 bg-white/5 text-gray-500 rounded-md font-bold uppercase">Clicked</span>
      )}
    </div>
  </div>
);

export const AffiliatesView = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'partners' | 'programs' | 'referrals' | 'promo' | 'saved'>('partners');
  const [partners, setPartners] = useState<any[]>([]);
  const [myPrograms, setMyPrograms] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setInviteLink(`${window.location.origin}/affiliate/join?seller=${user.id}`);

      if (activeTab === 'partners') {
        // Fetch people who are affiliates for MY products
        const { data: myProgramsData } = await supabase
          .from('affiliate_programs')
          .select('id')
          .eq('seller_id', user.id);
        
        const programIds = myProgramsData?.map(p => p.id) || [];

        if (programIds.length > 0) {
          const { data, error } = await supabase
            .from('affiliates')
            .select('*, profile:profiles!user_id(*)')
            .in('program_id', programIds);
          
          if (!error) setPartners(data || []);
        } else {
          setPartners([]);
        }
      }

      if (activeTab === 'programs' || activeTab === 'saved' || activeTab === 'promo') {
        // Fetch programs I am part of
        const { data, error } = await supabase
          .from('affiliates')
          .select('*, program:affiliate_programs(*, product:listings(title, image_url, price))')
          .eq('user_id', user.id);
        
        if (!error) setMyPrograms(data || []);

        // Fetch my products to manage their affiliate status (for 'programs' tab)
        if (activeTab === 'programs') {
          const { data: products } = await supabase
            .from('listings')
            .select('*, affiliate_program:affiliate_programs(*)')
            .eq('seller_id', user.id);
          
          if (products) {
            const mappedProducts = products.map(p => ({
              ...p,
              affiliate_program: Array.isArray(p.affiliate_program) ? p.affiliate_program[0] : p.affiliate_program
            }));
            setMyProducts(mappedProducts);
          }
        }
      }

      if (activeTab === 'referrals') {
        // Fetch referrals generated by ME
        const { data: myAffRecords } = await supabase
          .from('affiliates')
          .select('id')
          .eq('user_id', user.id);
        
        const affIds = myAffRecords?.map(a => a.id) || [];

        if (affIds.length > 0) {
          const { data, error } = await supabase
            .from('affiliate_referrals')
            .select('*, affiliate:affiliates(*)')
            .in('affiliate_id', affIds)
            .order('created_at', { ascending: false });
          
          if (!error) setReferrals(data || []);
        } else {
          setReferrals([]);
        }
      }

    } catch (error) {
      console.error('Error fetching affiliate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleProgram = async (product: any) => {
    setSelectedProductId(product.id);
  };

  const updateCommission = async (programId: string, percentage: number) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('affiliate_programs')
        .update({ commission_percentage: percentage })
        .eq('id', programId);
      
      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error('Error updating commission:', error);
      toast.error('Failed to update commission.');
    } finally {
      setSaving(false);
    }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success('Link copied to clipboard!');
  };

  if (selectedProductId) {
    return (
      <AffiliateProgramBuilder 
        productId={selectedProductId} 
        onClose={() => {
          setSelectedProductId(null);
          fetchData();
        }} 
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Affiliates</h2>
          <p className="text-gray-400">Manage your affiliate program and partners.</p>
        </div>
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('partners')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'partners' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            My Partners
          </button>
          <button 
            onClick={() => setActiveTab('programs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'programs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Manage My Programs
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'saved' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Saved Programs
          </button>
          <button 
            onClick={() => setActiveTab('promo')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'promo' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Promo Material
          </button>
          <button 
            onClick={() => setActiveTab('referrals')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'referrals' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
          >
            Referrals
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'partners' && (
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Active Partners ({partners.length})</h3>
              <div className="space-y-4">
                {partners.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No partners yet. Share your invite link to recruit affiliates!
                  </div>
                ) : (
                  partners.map((p) => (
                    <AffiliateCard 
                      key={p.id}
                      name={p.profile?.name || p.profile?.full_name || 'Partner'} 
                      earnings={0} 
                      status={p.status} 
                      code={p.custom_code} 
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'programs' && (
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Programs I Promote ({myPrograms.length})</h3>
                <div className="space-y-4">
                  {myPrograms.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      You haven't joined any affiliate programs yet.
                    </div>
                  ) : (
                    myPrograms.map((p) => (
                      <div key={p.id} className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{p.program?.product?.title}</h4>
                            <p className="text-xs text-gray-500">{p.program?.commission_percentage}% Commission</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-indigo-300 bg-indigo-500/5 px-2 py-1 rounded border border-indigo-500/10 font-mono">
                            {p.custom_code}
                          </code>
                          <button 
                            onClick={() => copyLink(`${window.location.origin}/p/${p.program?.product_id}?ref=${p.custom_code}`)}
                            className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Manage My Product Programs</h3>
                <div className="space-y-4">
                  {myProducts.map((product) => (
                    <div key={product.id} className="bg-[#0A0A0A] p-5 rounded-2xl border border-white/5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-400">
                            <DollarSign className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{product.title}</h4>
                            <p className="text-xs text-gray-500">
                              {product.affiliate_program?.is_active ? 'Affiliates Enabled' : 'Affiliates Disabled'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleProgram(product)}
                          disabled={saving}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                            product.affiliate_program?.is_active 
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20' 
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {product.affiliate_program?.is_active ? (
                            <>
                              <Wand2 className="w-3.5 h-3.5" />
                              Edit Program
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              Enable Affiliates
                            </>
                          )}
                        </button>
                      </div>

                      {product.affiliate_program?.is_active && (
                        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Commission:</span>
                              <span className="text-sm font-bold text-white">
                                {product.affiliate_program.fixed_commission > 0 
                                  ? `€${product.affiliate_program.fixed_commission}` 
                                  : `${product.affiliate_program.commission_percentage}%`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-400">Budget:</span>
                              <span className="text-sm font-bold text-white">€{product.affiliate_program.budget || 'Unlimited'}</span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-emerald-500" /> Active
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'saved' && (
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Programs You've Joined</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPrograms.length === 0 ? (
                    <div className="col-span-2 text-center py-12 text-gray-500">
                      You haven't joined any affiliate programs yet.
                    </div>
                  ) : (
                    myPrograms.map((p) => (
                      <div key={p.id} className="bg-[#0A0A0A] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-white/5 overflow-hidden">
                            <img src={p.program?.product?.image_url} alt="" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{p.program?.product?.title}</h4>
                            <p className="text-xs text-gray-500">Code: {p.custom_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-emerald-400">
                            {p.program?.fixed_commission > 0 ? `€${p.program.fixed_commission}` : `${p.program?.commission_percentage}%`}
                          </p>
                          <p className="text-[10px] text-gray-500">Commission</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'promo' && (
            <div className="space-y-6">
              <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">Your Promo Material</h3>
                <div className="space-y-6">
                  {myPrograms.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      Join a program to see your promo materials.
                    </div>
                  ) : (
                    myPrograms.map((p) => (
                      <div key={p.id} className="bg-[#0A0A0A] p-6 rounded-3xl border border-white/5 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-lg">{p.program?.product?.title}</h4>
                          <button 
                            onClick={() => copyLink(`${window.location.origin}/product/${p.program?.product_id}?ref=${p.custom_code}`)}
                            className="flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" /> Copy Referral Link
                          </button>
                        </div>
                        
                        {p.program?.banner_url ? (
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Official Banner</p>
                            <div className="relative group rounded-2xl overflow-hidden border border-white/10">
                              <img src={p.program.banner_url} alt="Banner" className="w-full h-auto" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button 
                                  onClick={() => window.open(p.program.banner_url, '_blank')}
                                  className="px-4 py-2 bg-white text-black rounded-xl font-bold text-sm flex items-center gap-2"
                                >
                                  <ExternalLink className="w-4 h-4" /> Download Banner
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-sm text-gray-500 italic">No official banner provided for this program.</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'referrals' && (
            <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">Recent Referrals ({referrals.length})</h3>
              <div className="space-y-4">
                {referrals.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No referrals tracked yet. Start sharing your links!
                  </div>
                ) : (
                  referrals.map((r) => (
                    <ReferralCard key={r.id} referral={r} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-[#141414] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Recruitment</h3>
            </div>
            
            <p className="text-sm text-gray-400 mb-6">
              Share this link to invite people to become affiliates for your products.
            </p>

            <div className="space-y-4">
              <div className="bg-black/30 p-3 rounded-xl border border-white/10">
                <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Your Invite Link</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-indigo-300 flex-1 truncate font-mono">{inviteLink}</code>
                  <button 
                    onClick={() => copyLink(inviteLink)}
                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-bold">Auto-Approval</span>
                </div>
                <p className="text-xs text-emerald-500/70">
                  New affiliates are automatically approved and can start promoting immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-white/10 rounded-3xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Affiliate Tracker</h3>
            <p className="text-sm text-gray-400 mb-4">Our global Edge Function tracks every click and conversion.</p>
            <div className="bg-black/30 p-3 rounded-xl border border-white/10">
              <p className="text-[10px] text-gray-500 uppercase font-bold mb-2">Tracking Endpoint</p>
              <code className="text-[10px] text-indigo-300 font-mono break-all">
                {`${supabaseUrl}/functions/v1/api-runner?action=track_click`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

