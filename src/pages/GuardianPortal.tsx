import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Shield, DollarSign, Link as LinkIcon, Store, CheckCircle, XCircle, Clock, Eye, AlertTriangle, LogOut } from 'lucide-react';
import { supabase, invokeApiRunner } from '../lib/supabase';
import { NavBar } from '../components/NavBar';
import { Footer } from '../components/Footer';

import { appToast } from '@/lib/feedback';
export const GuardianPortal = () => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [logoutRequests, setLogoutRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: invites } = await supabase
        .from('next_gen_invites')
        .select('*, profiles:kid_id(full_name, avatar_url, username)')
        .eq('parent_id', user.id)
        .eq('status', 'completed');

      if (invites && invites.length > 0) {
        const kidIds = invites.map(i => i.kid_id);
        
        // Fetch listings for all kids
        const { data: listings } = await supabase
          .from('listings')
          .select('*')
          .in('seller_id', kidIds);

        // Fetch businesses for all kids
        const { data: businesses } = await supabase
          .from('businesses')
          .select('*')
          .in('user_id', kidIds);

        // Fetch ALL orders for all kids
        const { data: orders } = await supabase
          .from('orders')
          .select('*')
          .in('seller_id', kidIds);

        const enrichedChildren = invites.map(invite => {
          const kidListings = listings?.filter(l => l.seller_id === invite.kid_id) || [];
          const kidOrders = orders?.filter((o: any) => o.seller_id === invite.kid_id) || [];
          const kidBusiness = businesses?.find(b => b.user_id === invite.kid_id);
          
          const completedRevenue = kidOrders
            .filter(o => o.status === 'completed')
            .reduce((sum, order) => sum + Number(order.amount), 0);
            
          const pendingRevenue = kidOrders
            .filter(o => o.status === 'pending')
            .reduce((sum, order) => sum + Number(order.amount), 0);
          
          return {
            ...invite,
            stats: {
              revenue: completedRevenue,
              payouts: completedRevenue * 0.8, // 80% to creator/parent
              pending: pendingRevenue,
              lastLogin: invite.profiles?.last_seen || new Date().toISOString(),
              kycStatus: invite.profiles?.kyc_status || 'verified',
              storeName: kidBusiness?.name || `${invite.kid_name}'s Store`,
              activeProducts: kidListings.filter(l => l.status === 'active' || l.status === 'published').length,
            },
            paymentLinks: kidListings.map(l => ({
              id: l.id,
              title: l.title,
              amount: l.price,
              status: l.approval_status || 'pending',
              date: l.created_at
            }))
          };
        });
        
        setChildren(enrichedChildren);
        if (enrichedChildren.length > 0) {
          setSelectedChild(enrichedChildren[0]);
        }
      }

      // Fetch logout requests
      const { data: requests } = await supabase
        .from('next_gen_logout_requests')
        .select('*, profiles:kid_id(full_name)')
        .eq('parent_id', user.id)
        .eq('status', 'pending');
        
      if (requests) {
        setLogoutRequests(requests.map(req => ({
          id: req.id,
          kidName: req.profiles?.full_name || 'Your child',
          timestamp: req.created_at,
          status: req.status
        })));
      }

    } catch (error) {
      console.error('Error fetching children:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLink = async (linkId: string) => {
    if (!selectedChild) return;
    
    try {
      const response = await invokeApiRunner('next-gen/approve-listing', {
        id: linkId,
        status: 'approved'
      });

      if (!response.success) throw new Error(response.error);
        
      const updatedLinks = selectedChild.paymentLinks.map((link: any) => 
        link.id === linkId ? { ...link, status: 'approved' } : link
      );
      setSelectedChild({ ...selectedChild, paymentLinks: updatedLinks });
      setChildren(children.map(c => c.id === selectedChild.id ? { ...c, paymentLinks: updatedLinks } : c));
    } catch (error) {
      console.error('Error approving link:', error);
    }
  };

  const handleRejectLink = async (linkId: string) => {
    if (!selectedChild) return;
    
    try {
      const response = await invokeApiRunner('next-gen/approve-listing', {
        id: linkId,
        status: 'rejected'
      });

      if (!response.success) throw new Error(response.error);
        
      const updatedLinks = selectedChild.paymentLinks.map((link: any) => 
        link.id === linkId ? { ...link, status: 'rejected' } : link
      );
      setSelectedChild({ ...selectedChild, paymentLinks: updatedLinks });
      setChildren(children.map(c => c.id === selectedChild.id ? { ...c, paymentLinks: updatedLinks } : c));
    } catch (error) {
      console.error('Error rejecting link:', error);
    }
  };

  const handleApproveLogout = async (requestId: string) => {
    try {
      const response = await invokeApiRunner('next-gen/approve-logout', {
        id: requestId,
        status: 'approved'
      });

      if (!response.success) throw new Error(response.error);
        
      setLogoutRequests(logoutRequests.filter(req => req.id !== requestId));
      appToast('Logout request approved. The child can now log out.');
    } catch (error) {
      console.error('Error approving logout:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col">
      <NavBar />
      
      <main className="flex-1 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-white flex items-center gap-3">
                <Shield className="w-10 h-10 text-blue-500" />
                Guardian Portal
              </h1>
              <p className="text-gray-400 mt-2 text-lg">Manage and monitor your connected Next Gen accounts.</p>
            </div>

            {/* Child Selector */}
            {children.length > 0 && (
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedChild(child)}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
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

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            </div>
          ) : children.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-12 flex flex-col items-center justify-center text-center">
              <Shield className="w-20 h-20 text-gray-600 mb-6" />
              <h2 className="text-3xl font-bold text-white mb-4">No Managed Accounts</h2>
              <p className="text-gray-400 text-lg max-w-md">You haven't set up any Next Gen Creator accounts yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: Stats & Info */}
              <div className="lg:col-span-1 space-y-8">
                
                {/* Profile Card */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-black shadow-lg">
                      {selectedChild.kid_name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedChild.kid_name}</h2>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className="px-3 py-1 rounded-md bg-blue-500/20 text-blue-400 text-xs font-bold uppercase">
                          Age {selectedChild.kid_age}
                        </span>
                        <span className="px-3 py-1 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> KYC Verified
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-5 text-sm">
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-gray-400">Store Name</span>
                      <span className="font-medium text-white">{selectedChild.stats.storeName}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-white/5">
                      <span className="text-gray-400">Active Products</span>
                      <span className="font-medium text-white">{selectedChild.stats.activeProducts}</span>
                    </div>
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-400">Last Login</span>
                      <span className="font-medium text-white">
                        {new Date(selectedChild.stats.lastLogin).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Overview */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                    Financial Overview
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <div className="text-sm text-gray-400 mb-1">Total Revenue</div>
                      <div className="text-3xl font-black text-white">${selectedChild.stats.revenue.toFixed(2)}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                        <div className="text-xs text-gray-400 mb-1">Paid Out</div>
                        <div className="text-xl font-bold text-emerald-400">${selectedChild.stats.payouts.toFixed(2)}</div>
                      </div>
                      <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                        <div className="text-xs text-gray-400 mb-1">Pending</div>
                        <div className="text-xl font-bold text-yellow-400">${selectedChild.stats.pending.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-300 flex gap-3">
                    <Shield className="w-5 h-5 shrink-0" />
                    <p>All payouts are securely routed to your connected guardian bank account.</p>
                  </div>
                </div>

              </div>

              {/* Right Column: Approvals & Activity */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Logout Requests */}
                {logoutRequests.length > 0 && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                        <LogOut className="w-6 h-6" />
                        Logout Requests
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {logoutRequests.map((req) => (
                        <div key={req.id} className="bg-black/40 border border-red-500/20 rounded-2xl p-5 flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white">{req.kidName} wants to log out</h4>
                            <p className="text-sm text-gray-400 mt-1">Requested at {new Date(req.timestamp).toLocaleTimeString()}</p>
                          </div>
                          <button 
                            onClick={() => handleApproveLogout(req.id)}
                            className="px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
                          >
                            Approve Logout
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Approvals */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-6 h-6 text-yellow-400" />
                      Action Required
                    </h3>
                    <span className="px-3 py-1.5 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-bold">
                      {selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').length} Pending
                    </span>
                  </div>

                  <div className="space-y-4">
                    {selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').length === 0 ? (
                      <div className="text-center py-12 text-gray-500 bg-black/20 rounded-2xl border border-white/5">
                        <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg">All caught up! No pending approvals.</p>
                      </div>
                    ) : (
                      selectedChild.paymentLinks.filter((l: any) => l.status === 'pending').map((link: any) => (
                        <div key={link.id} className="bg-black/40 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                              <LinkIcon className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-white text-lg">{link.title}</h4>
                              <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                                <span className="text-emerald-400 font-bold">${link.amount.toFixed(2)}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {new Date(link.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <button 
                              onClick={() => handleRejectLink(link.id)}
                              className="p-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-6 h-6" />
                            </button>
                            <button 
                              onClick={() => handleApproveLink(link.id)}
                              className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2"
                            >
                              <CheckCircle className="w-5 h-5" />
                              Approve
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Storefront Preview (Read Only) */}
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Store className="w-6 h-6 text-purple-400" />
                      Storefront Activity
                    </h3>
                    <button className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold">
                      <Eye className="w-4 h-4" /> View Store
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm text-gray-400 mb-3 font-bold uppercase tracking-wider">Recently Approved Links</div>
                    {selectedChild.paymentLinks.filter((l: any) => l.status === 'approved').length === 0 ? (
                      <p className="text-sm text-gray-500">No approved links yet.</p>
                    ) : (
                      selectedChild.paymentLinks.filter((l: any) => l.status === 'approved').map((link: any) => (
                        <div key={link.id} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-emerald-400" />
                            <span className="font-medium text-white">{link.title}</span>
                          </div>
                          <span className="text-sm text-gray-400">{new Date(link.date).toLocaleDateString()}</span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Privacy Notice */}
                  <div className="mt-10 pt-8 border-t border-white/5">
                    <div className="flex items-start gap-4 text-sm text-gray-500">
                      <Shield className="w-6 h-6 shrink-0 opacity-50" />
                      <p className="leading-relaxed">
                        <strong className="text-gray-400">Privacy Protected:</strong> To respect the creator's privacy, direct customer communications, private drafts, and login credentials are not visible in the Guardian dashboard.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
