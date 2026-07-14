import React from 'react';
import { FileSignature, Calendar, DollarSign } from 'lucide-react';

interface ProposalPDFPreviewProps {
  formData: any;
  deliverables: any[];
  milestones: any[];
  isHidden?: boolean;
}

export const ProposalPDFPreview: React.FC<ProposalPDFPreviewProps> = ({
  formData,
  deliverables,
  milestones,
  isHidden = false,
}) => {
  const currencySymbol = formData.currency === 'EUR' ? '€' : formData.currency === 'USD' ? '$' : '£';
  
  const primaryColor = '#10b981'; // Emerald-500
  const primaryColorLight = `${primaryColor}15`;

  const totalAmount = deliverables.reduce((sum, item) => sum + (item.total_price || 0), 0);

  return (
    <div 
      id={isHidden ? "proposal-pdf-preview-hidden" : undefined}
      style={isHidden ? { display: 'none', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '2rem', padding: '2.5rem', minHeight: '800px', width: '800px', flexDirection: 'column' } : { display: 'flex', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '2rem', padding: '2.5rem', minHeight: '800px', flexDirection: 'column' }}
    >
      {/* Header */}
      <div style={{ padding: '2.5rem', borderBottom: `2px solid ${primaryColor}`, backgroundColor: primaryColorLight, borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ width: '5rem', height: '5rem', backgroundColor: '#ffffff', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f3f4f6' }}>
              <FileSignature style={{ width: '2.5rem', height: '2.5rem', color: primaryColor }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: primaryColor, letterSpacing: '-0.05em' }}>PROPOSAL</h1>
              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{formData.title || 'Untitled Proposal'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '2.5rem', flex: 1 }}>
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Executive Summary</h2>
          <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6' }}>{formData.description || 'No description provided.'}</p>
        </div>

        {/* Deliverables */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Deliverables</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111827' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.875rem' }}>
              {deliverables.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '1rem', fontWeight: 700, color: '#111827' }}>{item.title || 'Item'}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500, color: '#4b5563' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500, color: '#4b5563' }}>{currencySymbol}{item.unit_price.toFixed(2)}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: '#111827' }}>{currencySymbol}{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', marginTop: '1rem', fontSize: '1.25rem', fontWeight: 900, color: primaryColor }}>
            Total: {currencySymbol}{totalAmount.toFixed(2)}
          </div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && milestones[0].title && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Milestones</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {milestones.map((m: any, index: number) => (
                <div key={index} style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{m.title}</span>
                  <span style={{ color: '#4b5563' }}>{currencySymbol}{m.amount.toFixed(2)} - {m.due_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Terms */}
        {formData.terms && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', marginBottom: '1rem' }}>Terms & Conditions</h2>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: '1.6' }}>{formData.terms}</p>
          </div>
        )}
      </div>
    </div>
  );
};
