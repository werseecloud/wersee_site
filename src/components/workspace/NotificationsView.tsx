import React, { useState, useEffect } from 'react';
import { Bell, Trash2, Search, X, FileSignature, Receipt, Loader2, ExternalLink, Copy, CheckCircle2 } from 'lucide-react';
import { supabase, invokeApiRunner } from '../../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

import { appToast } from '@/lib/feedback';
import { werseePaymentUrls } from '@/lib/paymentUrls';
export function NotificationsView({ user }: { user: any }) {
  const navigate = useNavigate();
  const { notifications, markAsRead, markAllAsRead, requestPermission } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceResult, setInvoiceResult] = useState<{ paymentLink?: string; alreadyExists?: boolean } | null>(null);

  useEffect(() => {
    requestPermission();
  }, []);

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const openNotification = async (notification: any) => {
    if (!notification.read) await markAsRead(notification.id);

    if (notification.type === 'proposal_accepted' || notification.data?.action === 'proposal_accepted') {
      setSelectedNotification(notification);
      setInvoiceResult(null);
      return;
    }

    if (notification.data?.url) {
      navigate(notification.data.url);
    }
  };

  const handleSendInvoice = async () => {
    if (!selectedNotification?.data?.proposalId) return;

    try {
      setSendingInvoice(true);
      try {
        const result = await invokeApiRunner('generate-invoice-from-proposal', {
          proposalId: selectedNotification.data.proposalId
        });
        setInvoiceResult({
          paymentLink: result.paymentLink || result.invoice?.hosted_url,
          alreadyExists: !!result.alreadyExists
        });
        return;
      } catch (edgeError) {
        console.warn('Edge invoice generation failed, falling back to Supabase invoice insert:', edgeError);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create an invoice.');

      const proposalId = selectedNotification.data.proposalId;
      const { data: proposal, error: proposalError } = await supabase
        .from('proposals')
        .select('*, client:crm_contacts(id, name, email)')
        .eq('id', proposalId)
        .single();

      if (proposalError) throw proposalError;

      if (proposal.accepted_invoice_id) {
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', proposal.accepted_invoice_id)
          .maybeSingle();

        if (existingInvoice) {
          const existingLink = werseePaymentUrls.invoice({
            username: existingInvoice.username,
            invoiceId: existingInvoice.invoice_number || existingInvoice.slug,
            sandbox: true,
          });
          setInvoiceResult({ paymentLink: existingLink, alreadyExists: true });
          return;
        }
      }

      const { data: deliverables, error: deliverablesError } = await supabase
        .from('proposal_deliverables')
        .select('*')
        .eq('proposal_id', proposalId)
        .order('sort_order');

      if (deliverablesError) throw deliverablesError;

      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const username = user.email?.split('@')[0] || 'user';
      const total = Number(proposal.total_amount || 0) || (deliverables || []).reduce((sum: number, item: any) => {
        const price = Number(item.unit_price ?? item.price ?? 0);
        const quantity = Number(item.quantity || 1);
        return sum + price * quantity;
      }, 0);

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert({
          user_id: user.id,
          username,
          stripe_invoice_id: 'sandbox_invoice',
          invoice_number: invoiceNumber,
          show_qr_code: true,
          customer_name: proposal.client?.name || 'Client',
          customer_email: proposal.client?.email || null,
          amount: total,
          currency: (proposal.currency || 'eur').toLowerCase(),
          status: 'sent',
          slug: invoiceNumber.toLowerCase(),
          metadata: {
            items: (deliverables || []).map((item: any) => ({
              description: item.title,
              quantity: item.quantity || 1,
              price: item.unit_price ?? item.price ?? 0
            })),
            memo: `Invoice for Proposal: ${proposal.title}`,
            proposal_id: proposal.id,
            source: 'proposal_acceptance_fallback'
          }
        })
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      await supabase
        .from('proposals')
        .update({ accepted_invoice_id: invoice.id })
        .eq('id', proposal.id);

      const paymentLink = werseePaymentUrls.invoice({
        username,
        invoiceId: invoice.invoice_number,
        sandbox: true,
      });
      await supabase
        .from('invoice_links')
        .upsert({ username, invoice_id: invoice.id, link: paymentLink })
        .then(({ error }) => {
          if (error) console.warn('Invoice link insert failed:', error);
        });

      setInvoiceResult({ paymentLink });
    } catch (error: any) {
      console.error('Error sending invoice from proposal:', error);
      appToast(error.message || 'Failed to send invoice.');
    } finally {
      setSendingInvoice(false);
    }
  };

  // Filter notifications locally
  const displayedNotifications = notifications.filter(n => {
    const matchesFilter = filter === 'all' || !n.read;
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          n.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">Notifications</h1>
          <p className="text-gray-400">Stay updated with your workspace activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={markAllAsRead}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-bold text-white hover:bg-white/10 transition-all"
          >
            Mark all as read
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex flex-col sm:flex-row items-center gap-4 bg-white/5">
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'all' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${filter === 'unread' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
            >
              Unread
            </button>
          </div>
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-white/20 transition-all"
            />
          </div>
        </div>

        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading notifications...</p>
            </div>
          ) : displayedNotifications.length === 0 ? (
            <div className="p-20 text-center">
              <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No notifications found</h3>
              <p className="text-gray-500">You're all caught up!</p>
            </div>
          ) : (
            displayedNotifications.map((notification) => (
              <motion.div 
                layout
                key={notification.id}
                onClick={() => openNotification(notification)}
                className={`p-6 hover:bg-white/5 transition-all group relative cursor-pointer ${!notification.read ? 'bg-blue-500/5' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl shrink-0 border ${
                    notification.type === 'proposal_accepted'
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-gray-300'
                  }`}>
                    {notification.type === 'proposal_accepted' ? (
                      <FileSignature className="w-8 h-8" />
                    ) : (
                      <Bell className="w-8 h-8" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <h4 className={`text-lg font-bold truncate ${!notification.read ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-400 mb-4 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3">
                      {(notification.type === 'proposal_accepted' || notification.data?.action === 'proposal_accepted') && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            openNotification(notification);
                          }}
                          className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                        >
                          Open modal
                        </button>
                      )}
                      {notification.data?.url && notification.type !== 'proposal_accepted' && notification.data?.action !== 'proposal_accepted' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(notification.data!.url);
                          }}
                          className="px-4 py-1.5 bg-white text-black rounded-lg text-xs font-bold hover:bg-gray-200 transition-all"
                        >
                          View Details
                        </button>
                      )}
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="px-4 py-1.5 bg-white/5 border border-white/10 text-white rounded-lg text-xs font-bold hover:bg-white/10 transition-all"
                        >
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[220] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              className="w-full max-w-lg bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Proposal accepted</h2>
                    <p className="text-sm text-gray-400 mt-1">{selectedNotification.message}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Client</div>
                    <div className="text-sm text-white font-semibold">{selectedNotification.data?.clientName || 'Client'}</div>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-lg p-3">
                    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Amount</div>
                    <div className="text-sm text-white font-semibold">
                      {selectedNotification.data?.currency || 'EUR'} {Number(selectedNotification.data?.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {invoiceResult?.paymentLink ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Receipt className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white">
                          {invoiceResult.alreadyExists ? 'Invoice already exists' : 'Invoice created'}
                        </p>
                        <p className="text-xs text-emerald-100/70 mt-1 break-all">{invoiceResult.paymentLink}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">
                    Create the invoice directly from this accepted proposal. The invoice is linked back to the proposal so it will not be duplicated on repeated clicks.
                  </p>
                )}
              </div>

              <div className="p-5 border-t border-white/10 bg-black/20 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.open(`/proposal/${selectedNotification.data?.proposalId}`, '_blank')}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View proposal
                </button>
                {invoiceResult?.paymentLink ? (
                  <button
                    onClick={() => navigator.clipboard.writeText(invoiceResult.paymentLink || '')}
                    className="flex-1 px-4 py-3 bg-white text-black rounded-lg font-bold text-sm hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy invoice link
                  </button>
                ) : (
                  <button
                    onClick={handleSendInvoice}
                    disabled={sendingInvoice}
                    className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {sendingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                    Send invoice now
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
