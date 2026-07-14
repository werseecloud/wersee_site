import React from 'react';
import { FileText, QrCode, CreditCard, Landmark } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit Card', icon: CreditCard, logo: null, currencies: ['eur', 'usd', 'gbp'] },
  { id: 'ideal', name: 'iDEAL', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/iDEAL_Wero_Lockup_Yellow_Square_RGB.svg', currencies: ['eur'] },
  { id: 'bancontact', name: 'Bancontact', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment%20logos/Bancontact_logo.svg.png', currencies: ['eur'] },
  { id: 'klarna', name: 'Klarna', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/klarna-icon.webp', currencies: ['eur', 'usd', 'gbp'] },
  { id: 'affirm', name: 'Affirm', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/blue_solid_circle-transparent_bg.avif', currencies: ['usd'] },
  { id: 'eps', name: 'EPS', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/32041242-b0eb5b7c-ba33-11e7-8d58-7f134da0e4d8.png', currencies: ['eur'] },
  { id: 'alipay', name: 'Alipay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/62b1e77b56b6848f8bec9031.png', currencies: ['usd', 'eur'] },
  { id: 'sepa_debit', name: 'SEPA Direct Debit', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/67433ffcacc11a3a9c648faf_639b928a92f2c749f5ad800c_APMsLPMs20Website20Template.png', currencies: ['eur'] },
  { id: 'sofort', name: 'Sofort', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/payment-sofort.png', currencies: ['eur'] },
  { id: 'afterpay_clearpay', name: 'Afterpay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/unnamed.png', currencies: ['eur', 'usd', 'gbp'] },
  { id: 'giropay', name: 'Giropay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/Giropay.svg.png', currencies: ['eur'] },
  { id: 'p24', name: 'Przelewy24', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/6.Przelewy24_logo.webp', currencies: ['pln', 'eur'] },
  { id: 'wechat_pay', name: 'WeChat Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/77adb574c905404f69555e6fc9e47e3693444c6c.svg', currencies: ['usd', 'eur'] },
  { id: 'link', name: 'Link', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/link.png', currencies: ['usd', 'eur', 'gbp'] },
  { id: 'customer_balance', name: 'Bank Transfer', icon: Landmark, logo: null, currencies: ['eur', 'usd', 'gbp'] },
  { id: 'us_bank_account', name: 'ACH Direct Debit', icon: Landmark, logo: null, currencies: ['usd'] },
  { id: 'boleto', name: 'Boleto', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/boleto.png', currencies: ['brl'] },
  { id: 'cashapp', name: 'Cash App Pay', icon: null, logo: 'https://pkgwzusngqwnmdfpifnd.supabase.co/storage/v1/object/public/icons-logos/cashapp.png', currencies: ['usd'] },
];

interface InvoicePDFPreviewProps {
  formData: any;
  setFormData?: (data: any) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  isHidden?: boolean;
  paymentLink?: string;
}

export const InvoicePDFPreview: React.FC<InvoicePDFPreviewProps> = ({
  formData,
  setFormData,
  subtotal,
  taxAmount,
  total,
  isHidden = false,
  paymentLink
}) => {
  const currencySymbol = formData.currency === 'eur' ? '€' : formData.currency === 'usd' ? '$' : '£';
  
  const getPrimaryColor = () => {
    if (formData.theme_preset === 'bw') return '#000000';
    if (formData.theme_preset === 'custom' && formData.theme_color) return formData.theme_color;
    return '#635BFF'; // default
  };
  
  const primaryColor = getPrimaryColor();
  const primaryColorLight = `${primaryColor}15`; // 15% opacity hex

  const handleEdit = (field: string, value: string) => {
    if (setFormData) {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    }
  };

  const handleItemEdit = (index: number, field: string, value: string) => {
    if (setFormData) {
      setFormData((prev: any) => {
        const newItems = [...prev.items];
        let finalValue: any = value;
        if (field === 'quantity' || field === 'price' || field === 'vat_rate') {
          finalValue = parseFloat(value.replace(/[^0-9.-]+/g, "")) || 0;
        }
        newItems[index] = { ...newItems[index], [field]: finalValue };
        return { ...prev, items: newItems };
      });
    }
  };

  const editableProps = (field: string) => ({
    contentEditable: !!setFormData,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => handleEdit(field, e.currentTarget.textContent || ''),
    style: { outline: 'none', cursor: setFormData ? 'text' : 'default' }
  });

  const editableItemProps = (index: number, field: string) => ({
    contentEditable: !!setFormData,
    suppressContentEditableWarning: true,
    onBlur: (e: React.FocusEvent<HTMLElement>) => handleItemEdit(index, field, e.currentTarget.textContent || ''),
    style: { outline: 'none', cursor: setFormData ? 'text' : 'default' }
  });

  return (
    <div 
      id={isHidden ? "invoice-pdf-preview-hidden" : undefined}
      style={isHidden ? { display: 'none', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '2rem', padding: '2.5rem', minHeight: '800px', width: '800px', flexDirection: 'column' } : { display: 'flex', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '2rem', padding: '2.5rem', minHeight: '800px', flexDirection: 'column' }}
    >
      {/* Invoice Header */}
      <div style={{ padding: '2.5rem', borderBottom: `2px solid ${primaryColor}`, backgroundColor: primaryColorLight, borderRadius: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {formData.business_logo_url ? (
              <img src={formData.business_logo_url} alt="Business Logo" style={{ width: '5rem', height: '5rem', borderRadius: '1rem', objectFit: 'contain', border: '1px solid #ffffff', backgroundColor: '#ffffff' }} />
            ) : (
              <div style={{ width: '5rem', height: '5rem', backgroundColor: '#ffffff', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #f3f4f6' }}>
                <FileText style={{ width: '2.5rem', height: '2.5rem', color: primaryColor }} />
              </div>
            )}
            <div>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 900, color: primaryColor, letterSpacing: '-0.05em' }}>INVOICE</h1>
              <p {...editableProps('invoice_number')} style={{ ...editableProps('invoice_number').style, fontSize: '0.875rem', fontWeight: 700, color: '#9ca3af', marginTop: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{formData.invoice_number || 'INV-0000'}</p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h3 {...editableProps('business_name')} style={{ ...editableProps('business_name').style, fontWeight: 900, color: '#111827', fontSize: '1rem' }}>{formData.business_name || 'Your Business Name'}</h3>
            <p {...editableProps('business_address')} style={{ ...editableProps('business_address').style, fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', fontWeight: 500 }}>{formData.business_address || 'Your Address'}</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.125rem', fontWeight: 500 }}>
              <span {...editableProps('business_city')} style={editableProps('business_city').style}>{formData.business_city || 'City'}</span>, <span {...editableProps('business_country')} style={editableProps('business_country').style}>{formData.business_country || 'Country'}</span>
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>VAT: <span {...editableProps('business_vat')} style={{ ...editableProps('business_vat').style, color: '#4b5563' }}>{formData.business_vat || 'VAT Number'}</span></p>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>KvK: <span {...editableProps('business_kvk')} style={{ ...editableProps('business_kvk').style, color: '#4b5563' }}>{formData.business_kvk || 'KvK Number'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div style={{ padding: '2.5rem', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '3rem' }}>
          <div>
            <p style={{ fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>Billed To</p>
            <p {...editableProps('customer_name')} style={{ ...editableProps('customer_name').style, fontWeight: 900, color: '#111827', fontSize: '1.125rem' }}>{formData.customer_name || 'Customer Name'}</p>
            <p {...editableProps('customer_email')} style={{ ...editableProps('customer_email').style, fontSize: '0.875rem', fontWeight: 500, color: '#6b7280', marginTop: '0.25rem' }}>{formData.customer_email || 'customer@example.com'}</p>
            <div style={{ marginTop: '0.75rem' }}>
              <p {...editableProps('customer_address')} style={{ ...editableProps('customer_address').style, fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{formData.customer_address || 'Customer Address'}</p>
              <p {...editableProps('customer_country')} style={{ ...editableProps('customer_country').style, fontSize: '0.75rem', color: '#6b7280', fontWeight: 500 }}>{formData.customer_country || 'Customer Country'}</p>
              <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', marginTop: '0.5rem' }}>VAT: <span {...editableProps('customer_vat')} style={{ ...editableProps('customer_vat').style, color: '#4b5563' }}>{formData.customer_vat || 'VAT Number'}</span></p>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-block', textAlign: 'left', minWidth: '200px' }}>
              <p style={{ fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '1rem' }}>Invoice Details</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f9fafb' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Invoice Date</span>
                  <span style={{ fontWeight: 700, color: '#111827' }}>{formData.invoice_date ? new Date(formData.invoice_date).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                </div>
                {formData.delivery_date && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid #f9fafb' }}>
                    <span style={{ color: '#6b7280', fontWeight: 500 }}>Delivery Date</span>
                    <span style={{ fontWeight: 700, color: '#111827' }}>{new Date(formData.delivery_date).toLocaleDateString()}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#6b7280', fontWeight: 500 }}>Due Date</span>
                  <span style={{ fontWeight: 700, color: primaryColor, backgroundColor: primaryColorLight, padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }}>
                    {formData.days_until_due === 0 ? 'On Receipt' : `Net ${formData.days_until_due}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '3rem' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #111827' }}>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Description</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Price</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>VAT</th>
                <th style={{ padding: '0.75rem 1rem', fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.875rem' }}>
              {formData.items.map((item: any, index: number) => (
                <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td {...editableItemProps(index, 'description')} style={{ ...editableItemProps(index, 'description').style, padding: '1rem', fontWeight: 700, color: '#111827' }}>{item.description || 'Item description'}</td>
                  <td {...editableItemProps(index, 'quantity')} style={{ ...editableItemProps(index, 'quantity').style, padding: '1rem', textAlign: 'right', fontWeight: 500, color: '#4b5563' }}>{item.quantity}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500, color: '#4b5563' }}>
                    {currencySymbol}<span {...editableItemProps(index, 'price')} style={editableItemProps(index, 'price').style}>{item.price.toFixed(2)}</span>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 500, color: '#4b5563' }}>
                    <span {...editableItemProps(index, 'vat_rate')} style={editableItemProps(index, 'vat_rate').style}>{item.vat_rate}</span>%
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 900, color: '#111827' }}>{currencySymbol}{(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ maxWidth: '300px' }}>
            {formData.memo && (
              <div style={{ backgroundColor: primaryColorLight, borderRadius: '1rem', padding: '1rem', border: `1px solid ${primaryColor}30` }}>
                <p style={{ fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.5rem' }}>Notes</p>
                <p {...editableProps('memo')} style={{ ...editableProps('memo').style, fontSize: '0.75rem', color: '#4b5563', fontWeight: 500, lineHeight: '1.6' }}>{formData.memo}</p>
              </div>
            )}
          </div>
          <div style={{ width: '18rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontWeight: 500 }}>
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6b7280', fontWeight: 500 }}>
                <span>Tax ({formData.tax_type === 'eu_b2b' ? 'Reverse Charge' : formData.tax_type === 'outside_eu' ? '0%' : 'VAT'})</span>
                <span>{currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '2px solid #111827' }}>
                <span style={{ fontWeight: 900, color: '#111827', fontSize: '1.125rem', letterSpacing: '-0.05em' }}>Total Due</span>
                <span style={{ fontWeight: 900, color: primaryColor, fontSize: '1.25rem', letterSpacing: '-0.05em' }}>{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '2.5rem', borderTop: '1px solid #f3f4f6', backgroundColor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: '0.625rem', fontWeight: 900, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>Accepted Payment Methods</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {formData.payment_methods.map((mId: string) => {
              const method = PAYMENT_METHODS.find(m => m.id === mId);
              if (!method) return null;
              return (
                <div key={mId} style={{ padding: '0.375rem 0.75rem', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem', fontSize: '0.625rem', fontWeight: 700, color: '#4b5563', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  {method.icon && <method.icon style={{ width: '0.75rem', height: '0.75rem', color: '#9ca3af' }} />}
                  {method.name}
                </div>
              );
            })}
          </div>
        </div>
        
        {paymentLink && (
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <a 
              href={paymentLink} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                padding: '0.75rem 1.5rem', 
                backgroundColor: '#111827', 
                color: '#ffffff', 
                borderRadius: '0.5rem', 
                textDecoration: 'none', 
                fontWeight: 700, 
                fontSize: '0.875rem' 
              }}
            >
              Pay Invoice
            </a>
            {formData.show_qr_code && (
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <div style={{ width: '6rem', height: '6rem', backgroundColor: '#ffffff', borderRadius: '1rem', border: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.5rem' }}>
                  <QRCodeSVG value={paymentLink} size={80} />
                </div>
                <p style={{ fontSize: '0.625rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Scan to Pay</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
