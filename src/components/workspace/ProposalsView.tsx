import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { 
  FileSignature, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ProposalWizard } from './proposals/ProposalWizard';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Select } from '../ui/Select';

import { appToast, destructiveAction } from '@/lib/feedback';
export const ProposalsView: React.FC = () => {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's business_id (either as team member or owner)
      let { data: teamMember } = await supabase
        .from('team_members')
        .select('business_id')
        .eq('user_id', user.id)
        .maybeSingle();

      let businessIdToUse = teamMember?.business_id;

      if (!businessIdToUse) {
        const { data: ownedBusiness } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        if (ownedBusiness) businessIdToUse = ownedBusiness.id;
      }

      if (!businessIdToUse) {
        setProposals([]);
        return;
      }

      const { data, error } = await supabase
        .from('proposals')
        .select(`
          *,
          client:crm_contacts(id, name, email, company:crm_companies(name))
        `)
        .eq('business_id', businessIdToUse)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePdf = async (proposalId: string) => {
    try {
      setIsGeneratingPdf(proposalId);
      
      // Open the public view in a hidden iframe to generate the PDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.width = '1000px';
      iframe.style.height = '1000px';
      iframe.style.left = '-9999px';
      iframe.src = `/proposal/${proposalId}`;
      document.body.appendChild(iframe);

      await new Promise((resolve) => {
        iframe.onload = () => {
          setTimeout(async () => {
            try {
              const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
              if (!iframeDoc) throw new Error('Could not access iframe content');
              
              const element = iframeDoc.getElementById('proposal-content');
              if (!element) throw new Error('Proposal content not found in iframe');

              element.classList.add('pdf-mode');
              
              const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
              });
              
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
              });

              pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
              
              const proposal = proposals.find(p => p.id === proposalId);
              pdf.save(`Proposal_${proposal?.title?.replace(/\s+/g, '_') || 'Document'}.pdf`);
            } catch (err) {
              console.error('Error in iframe PDF generation:', err);
              appToast('Failed to generate PDF. Please try opening the proposal and downloading from there.');
            } finally {
              document.body.removeChild(iframe);
              resolve(null);
            }
          }, 2000); // Wait for content to render
        };
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      appToast('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'sent': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'viewed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'accepted': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileSignature className="w-3.5 h-3.5" />;
      case 'sent': return <Send className="w-3.5 h-3.5" />;
      case 'viewed': return <Eye className="w-3.5 h-3.5" />;
      case 'accepted': return <CheckCircle2 className="w-3.5 h-3.5" />;
      case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
      default: return <Clock className="w-3.5 h-3.5" />;
    }
  };

  const handleDeleteProposal = async (proposalId: string) => {
    if (!(await destructiveAction({ description: 'Are you sure you want to delete this proposal? This action cannot be undone.' }))) {
      return;
    }

    try {
      const { error } = await supabase
        .from('proposals')
        .delete()
        .eq('id', proposalId);

      if (error) throw error;
      
      setProposals(proposals.filter(p => p.id !== proposalId));
    } catch (err) {
      console.error('Error deleting proposal:', err);
      appToast('Failed to delete proposal.');
    }
  };

  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = 
      proposal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.client?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proposal.client?.company?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const proposalStats = {
    total: proposals.length,
    open: proposals.filter(p => ['sent', 'viewed'].includes(p.status)).length,
    accepted: proposals.filter(p => p.status === 'accepted').length,
    value: proposals.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0)
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Proposals</h1>
          <p className="text-gray-400 text-sm mt-1">Create, share, accept, and invoice client proposals from one place.</p>
        </div>
        
        <button 
          onClick={() => navigate('/builder/proposal')}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors shadow-lg shadow-emerald-500/15"
        >
          <Plus className="w-4 h-4" />
          Create Proposal
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: proposalStats.total, icon: FileSignature },
          { label: 'Open', value: proposalStats.open, icon: Clock },
          { label: 'Accepted', value: proposalStats.accepted, icon: CheckCircle2 },
          { label: 'Pipeline', value: `EUR ${proposalStats.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Send }
        ].map((stat) => (
          <div key={stat.label} className="bg-[#141414] border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">{stat.label}</span>
              <stat.icon className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="text-2xl font-black text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-[#141414] border border-white/10 rounded-lg p-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search proposals or clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-52">
          <Filter className="w-4 h-4 text-gray-400" />
          <Select
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'viewed', label: 'Viewed' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'rejected', label: 'Rejected' }
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      ) : filteredProposals.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <FileSignature className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No proposals found</h3>
          <p className="text-gray-400 max-w-md mb-6">
            {searchQuery || statusFilter !== 'all' 
              ? "We couldn't find any proposals matching your filters."
              : "You haven't created any proposals yet. Create your first proposal to win more business."}
          </p>
          {(!searchQuery && statusFilter === 'all') && (
            <button 
              onClick={() => navigate('/builder/proposal')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-xl font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Proposal
            </button>
          )}
        </div>
      ) : (
        <div className="bg-[#141414] border border-white/10 rounded-lg overflow-hidden shadow-2xl shadow-black/20">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-sm text-gray-400">
                  <th className="p-4 font-medium">Proposal</th>
                  <th className="p-4 font-medium">Client</th>
                  <th className="p-4 font-medium">Amount</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                          <FileSignature className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white">{proposal.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {(proposal.type || 'project').charAt(0).toUpperCase() + (proposal.type || 'project').slice(1)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {proposal.client ? (
                        <div>
                          <div className="text-white text-sm">
                            {proposal.client.name}
                          </div>
                          {proposal.client.company?.name && (
                            <div className="text-xs text-gray-500 mt-0.5">{proposal.client.company.name}</div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">No client selected</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-white text-sm font-medium">
                        {proposal.currency} {proposal.total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                        {getStatusIcon(proposal.status)}
                        <span className="capitalize">{proposal.status}</span>
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => window.open(`/proposal/${proposal.id}`, '_blank')}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" 
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/builder/proposal/${proposal.id}`)}
                          className="px-3 py-2 hover:bg-white/10 rounded-lg text-xs font-bold text-gray-300 hover:text-white transition-colors"
                          title="Edit"
                        >
                          Edit
                        </button>
                        {proposal.status === 'draft' && (
                          <button 
                            onClick={async () => {
                              try {
                                const { error } = await supabase
                                  .from('proposals')
                                  .update({ status: 'sent' })
                                  .eq('id', proposal.id);
                                if (error) throw error;
                                fetchProposals();
                                appToast('Proposal marked as sent!');
                              } catch (err) {
                                console.error('Error sending proposal:', err);
                                appToast('Failed to send proposal.');
                              }
                            }}
                            className="p-2 hover:bg-emerald-500/10 rounded-lg text-gray-400 hover:text-emerald-400 transition-colors" 
                            title="Mark as Sent"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleGeneratePdf(proposal.id)}
                          disabled={isGeneratingPdf === proposal.id}
                          className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors disabled:opacity-50" 
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteProposal(proposal.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" 
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isWizardOpen && (
        <ProposalWizard 
          onClose={() => setIsWizardOpen(false)}
          onComplete={() => {
            setIsWizardOpen(false);
            fetchProposals();
          }}
        />
      )}
    </div>
  );
};
