import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, DollarSign, Link as LinkIcon, Store, CheckCircle, XCircle, Clock, Eye, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const GuardianControlsView = () => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<any>(null);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real implementation, we would query the relationships table
      // and then fetch the child's profile and stats.
      // For this demo, we'll fetch the invites to get the child info.
      const { data: invites } = await supabase
        .from('next_gen_invites')
        .select('*')
        .eq('parent_id', user.id)
        .eq('status', 'completed');

      if (invites) {
        // Mock some financial and store data for the demo
        const enrichedChildren = invites.map(invite => ({
          ...invite,
          stats: {
            revenue: Math.floor(Math.random() * 500) + 50,
            payouts: Math.floor(Math.random() * 200),
            pending: Math.floor(Math.random() * 100),
            lastLogin: new Date(Date.now() - Math.random() * 86400000 * 2).toISOString(),
            kycStatus: 'verified',
            storeName: `${invite.kid_name}'s Awesome Store`,
            activeProducts: Math.floor(Math.random() * 5) + 1,
          },
          paymentLinks: [
            { id: 1, title: 'Custom Artwork', amount: 15, status: 'pending', date: new Date().toISOString() },
            { id: 2, title: 'Digital Guide', amount: 5, status: 'approved', date: new Date(Date.now() - 86400000).toISOString() },
          ]
        }));
        setChildren(enrichedChildren);
        if (enrichedChildren.length > 0) {
          setSelectedChild(enrichedChildren[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLink = (linkId: number) => {
    if (!selectedChild) return;
    const updatedLinks = selectedChild.paymentLinks.map((link: any) => 
      link.id === linkId ? { ...link, status: 'approved' } : link
    );
    setSelectedChild({ ...selectedChild, paymentLinks: updatedLinks });
    
    // Update the main array too
    setChildren(children.map(c => 
      c.id === selectedChild.id ? { ...c, paymentLinks: updatedLinks } : c
    ));
  };

  const handleRejectLink = (linkId: number) => {
    if (!selectedChild) return;
    const updatedLinks = selectedChild.paymentLinks.map((link: any) => 
      link.id === linkId ? { ...link, status: 'rejected' } : link
    );
    setSelectedChild({ ...selectedChild, paymentLinks: updatedLinks });
    
    // Update the main array too
    setChildren(children.map(c => 
      c.id === selectedChild.id ? { ...c, paymentLinks: updatedLinks } : c
    ));
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
        <Shield className="w-16 h-16 text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">No Managed Accounts</h2>
        <p className="text-gray-400">You haven't set up any Next Gen Creator accounts yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-blue-500" />
              Guardian Controls
            </h1>
            <p className="text-gray-400 mt-1">Manage and monitor your connected Next Gen accounts.</p>
          </div>

          {/* Child Selector */}
          {children.length > 1 && (
            <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
              {children.map(child => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChild(child)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                    selectedChild?.id === child.id 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {child.kid_name}
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedChild && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Stats & Info */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Profile Card */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-black shadow-lg">
                    {selectedChild.kid_name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedChild.kid_name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                        Age {selectedChild.kid_age}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> KYC Verified
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Store Name</span>
                    <span className="font-medium text-white">{selectedChild.stats.storeName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-gray-400">Active Products</span>
                    <span className="font-medium text-white">{selectedChild.stats.activeProducts}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-400">Last Login</span>
                    <span className="font-medium text-white">
                      {new Date(selectedChild.stats.lastLogin).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financial Overview */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Financial Overview
                </h3>
                
                <div className="space-y-4">
                  <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                    <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-2xl font-black text-white">${selectedChild.stats.revenue.toFixed(2)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Paid Out</div>
                      <div className="text-lg font-bold text-emerald-400">${selectedChild.stats.payouts.toFixed(2)}</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                      <div className="text-xs text-gray-400 mb-1">Pending</div>
                      <div className="text-lg font-bold text-yellow-400">${selectedChild.stats.pending.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex gap-2">
                  <Shield className="w-4 h-4 shrink-0" />
                  <p>All payouts are securely routed to your connected guardian bank account.</p>
                </div>
              </div>

            </div>

            {/* Right Column: Approvals & Activity */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Pending Approvals */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    Action Required
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">
                    {selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').length} Pending
                  </span>
                </div>

                <div className="space-y-4">
                  {selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>All caught up! No pending approvals.</p>
                    </div>
                  ) : (
                    selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').map((link: any) => (
                      <div key={link.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                            <LinkIcon className="w-5 h-5 text-blue-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{link.title}</h4>
                            <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                              <span className="text-emerald-400 font-bold">${link.amount.toFixed(2)}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(link.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleRejectLink(link.id)}
                            className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleApproveLink(link.id)}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Storefront Preview (Read Only) */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Store className="w-5 h-5 text-purple-400" />
                    Storefront Activity
                  </h3>
                  <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                    <Eye className="w-4 h-4" /> View Store
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Recently Approved Links</div>
                  {selectedChild.paymentLinks.filter((l: any) => l.status === 'approved').length === 0 ? (
                    <p className="text-sm text-gray-500">No approved links yet.</p>
                  ) : (
                    selectedChild.paymentLinks.filter((l: any) => l.status === 'approved').map((link: any) => (
                      <div key={link.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="font-medium text-white">{link.title}</span>
                        </div>
                        <span className="text-sm text-gray-400">{new Date(link.date).toLocaleDateString()}</span>
                      </div>
                    ))
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="mt-8 pt-6 border-t border-white/5">
                  <div className="flex items-start gap-3 text-sm text-gray-500">
                    <Shield className="w-5 h-5 shrink-0 opacity-50" />
                    <p>
                      <strong>Privacy Protected:</strong> To respect the creator's privacy, direct customer communications, private drafts, and login credentials are not visible in the Guardian dashboard.
                    </p>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};
