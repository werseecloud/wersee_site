import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, AlertTriangle, Download, ArrowLeft } from 'lucide-react';
import { SEO } from '../components/SEO';

export default function InvoicePdfViewer() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        if (!invoiceId) throw new Error('Invalid invoice ID');

        // Check if invoiceId is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(invoiceId);

        let query = supabase.from('invoices').select('*');
        if (isUuid) {
          query = query.eq('id', invoiceId);
        } else {
          query = query.or(`invoice_number.eq.${invoiceId},slug.eq.${invoiceId}`);
        }

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        if (!data) throw new Error('Invoice not found');

        if (data.pdf_url) {
          setPdfUrl(data.pdf_url);
        } else {
          throw new Error('PDF not available for this invoice');
        }
      } catch (err: any) {
        console.error('Error fetching invoice PDF:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The invoice PDF could not be loaded.'}</p>
          <button onClick={() => navigate(-1)} className="w-full py-3 bg-black text-white rounded-xl font-bold">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <SEO title="View Invoice PDF" noIndex={true} />
      
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="font-bold text-sm">Invoice PDF</h1>
        <a 
          href={pdfUrl} 
          download 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Download</span>
        </a>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto p-4 sm:p-8">
        <iframe 
          src={`${pdfUrl}#toolbar=0`} 
          className="w-full h-[calc(100vh-8rem)] rounded-xl shadow-lg border-0 bg-white"
          title="Invoice PDF"
        />
      </div>
    </div>
  );
}
