import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvoiceBuilder } from '../components/workspace/InvoiceBuilder';
import { ContractBuilder } from '../components/workspace/ContractBuilder';
import { ProposalBuilder } from '../components/workspace/proposals/ProposalBuilder';
import { useAuth } from '../context/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';

export const BuilderPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    setLoading(false);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#635BFF] animate-spin" />
      </div>
    );
  }

  const handleClose = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Top Navigation Bar for Full Screen Builders */}
      <div className="h-16 bg-[#0A0A0A] border-b border-white/5 px-6 flex items-center justify-between shrink-0 z-[110]">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold tracking-tight uppercase">
            {type?.replace('-', ' ')} Builder
          </h1>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {type === 'invoice' && (
          <InvoiceBuilder 
            invoiceId={id || null} 
            onClose={handleClose} 
          />
        )}
        {type === 'contract' && (
          <ContractBuilder 
            contractId={id || null} 
            onClose={handleClose} 
          />
        )}
        {type === 'proposal' && (
          <ProposalBuilder 
            proposalId={id || null} 
            onClose={handleClose} 
          />
        )}
      </div>
    </div>
  );
};
