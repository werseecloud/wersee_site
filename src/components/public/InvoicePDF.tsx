import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: '1pt solid #F3F4F6',
    alignItems: 'flex-start',
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 15,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    letterSpacing: -0.5,
  },
  invoiceNumber: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: 'medium',
  },
  businessInfo: {
    textAlign: 'right',
    maxWidth: 200,
  },
  businessName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  detailsColumn: {
    flex: 1,
  },
  detailsLabel: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  detailsValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  detailsSubValue: {
    fontSize: 9,
    color: '#6B7280',
    marginBottom: 2,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: '1pt solid #F3F4F6',
    paddingBottom: 8,
    marginBottom: 8,
  },
  tableHeaderCol: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottom: '0.5pt solid #F9FAFB',
    alignItems: 'center',
  },
  tableCol: {
    fontSize: 10,
    color: '#374151',
  },
  colDesc: { flex: 2 },
  colQty: { flex: 0.5, textAlign: 'right' },
  colPrice: { flex: 1, textAlign: 'right' },
  colVat: { flex: 0.5, textAlign: 'right' },
  colAmount: { flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#111827' },
  
  footerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  notesColumn: {
    flex: 1,
    paddingRight: 40,
  },
  totalsColumn: {
    width: 180,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: '#6B7280',
  },
  totalValue: {
    fontSize: 9,
    color: '#111827',
    fontWeight: 'medium',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1pt solid #F3F4F6',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  paymentMethods: {
    marginTop: 20,
  },
  methodTag: {
    fontSize: 8,
    backgroundColor: '#F3F4F6',
    color: '#374151',
    padding: '3 6',
    borderRadius: 4,
    marginRight: 5,
    marginBottom: 5,
    fontWeight: 'bold',
  },
  memo: {
    marginTop: 15,
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  qrContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrImage: {
    width: 50,
    height: 50,
  },
  qrText: {
    marginLeft: 12,
    flex: 1,
  },
  qrTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  qrDesc: {
    fontSize: 8,
    color: '#6B7280',
    marginTop: 2,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    borderTop: '1pt solid #F3F4F6',
    paddingTop: 15,
  },
  footerText: {
    fontSize: 8,
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 2,
  }
});

const PAYMENT_METHODS = [
  { id: 'card', name: 'Card' },
  { id: 'ideal', name: 'iDEAL' },
  { id: 'bancontact', name: 'Bancontact' },
  { id: 'sepa_debit', name: 'SEPA' },
  { id: 'sofort', name: 'SOFORT' },
  { id: 'giropay', name: 'Giropay' },
  { id: 'eps', name: 'EPS' },
  { id: 'p24', name: 'P24' },
  { id: 'klarna', name: 'Klarna' },
  { id: 'affirm', name: 'Affirm' },
  { id: 'afterpay_clearpay', name: 'Afterpay' },
  { id: 'apple_pay', name: 'Apple Pay' },
  { id: 'google_pay', name: 'Google Pay' },
];

interface InvoicePDFProps {
  invoice: any;
  business?: any;
  qrCodeDataUrl?: string;
}

export const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, business, qrCodeDataUrl }) => {
  const currencySymbol = invoice.currency === 'eur' ? '€' : invoice.currency === 'usd' ? '$' : '£';
  
  const businessName = business?.company_name || invoice.business_name || 'Business Name';
  const businessLogo = business?.logo_url || invoice.business_logo_url;
  const businessAddress = business?.address || invoice.business_address;
  const businessCity = business?.city || invoice.business_city;
  const businessCountry = business?.country || invoice.business_country;
  const businessVat = business?.vat_number || invoice.business_vat;
  const businessKvk = business?.kvk_number || invoice.business_kvk;

  const subtotal = invoice.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
  const taxAmount = invoice.tax_amount || 0;

  return (
    <Document title={`Invoice ${invoice.invoice_number}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoSection}>
            {businessLogo ? (
              <Image src={businessLogo} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Text style={{ color: '#9CA3AF', fontSize: 20 }}>#</Text>
              </View>
            )}
            <View>
              <Text style={styles.title}>INVOICE</Text>
              <Text style={styles.invoiceNumber}>{invoice.invoice_number || 'INV-0000'}</Text>
            </View>
          </View>
          <View style={styles.businessInfo}>
            <Text style={styles.businessName}>{businessName}</Text>
            {businessAddress && <Text style={styles.businessDetail}>{businessAddress}</Text>}
            {(businessCity || businessCountry) && (
              <Text style={styles.businessDetail}>
                {[businessCity, businessCountry].filter(Boolean).join(', ')}
              </Text>
            )}
            {businessVat && <Text style={styles.businessDetail}>VAT: {businessVat}</Text>}
            {businessKvk && <Text style={styles.businessDetail}>KvK: {businessKvk}</Text>}
          </View>
        </View>

        {/* Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailsColumn}>
            <Text style={styles.detailsLabel}>Billed To</Text>
            <Text style={styles.detailsValue}>{invoice.customer_name || 'Customer Name'}</Text>
            <Text style={styles.detailsSubValue}>{invoice.customer_email}</Text>
            {invoice.customer_address && <Text style={styles.detailsSubValue}>{invoice.customer_address}</Text>}
            {invoice.customer_country && <Text style={styles.detailsSubValue}>{invoice.customer_country}</Text>}
            {invoice.customer_vat && <Text style={styles.detailsSubValue}>VAT: {invoice.customer_vat}</Text>}
          </View>
          <View style={[styles.detailsColumn, { textAlign: 'right' }]}>
            <View style={{ alignSelf: 'flex-end' }}>
              <Text style={styles.detailsLabel}>Invoice Details</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 150, marginBottom: 4 }}>
                <Text style={styles.detailsSubValue}>Date</Text>
                <Text style={[styles.detailsSubValue, { fontWeight: 'bold', color: '#111827' }]}>
                  {new Date(invoice.created_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 150, marginBottom: 4 }}>
                <Text style={styles.detailsSubValue}>Due Date</Text>
                <Text style={[styles.detailsSubValue, { fontWeight: 'bold', color: '#111827' }]}>
                  {new Date(invoice.due_date).toLocaleDateString()}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: 150 }}>
                <Text style={styles.detailsSubValue}>Status</Text>
                <Text style={[styles.detailsSubValue, { fontWeight: 'bold', color: invoice.status === 'paid' ? '#10B981' : '#F59E0B' }]}>
                  {invoice.status?.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCol, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCol, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCol, styles.colPrice]}>Price</Text>
            <Text style={[styles.tableHeaderCol, styles.colVat]}>VAT</Text>
            <Text style={[styles.tableHeaderCol, styles.colAmount]}>Total</Text>
          </View>
          {invoice.items?.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCol, styles.colDesc]}>{item.description || '—'}</Text>
              <Text style={[styles.tableCol, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCol, styles.colPrice]}>{currencySymbol}{item.price.toFixed(2)}</Text>
              <Text style={[styles.tableCol, styles.colVat]}>{item.vat_rate || 0}%</Text>
              <Text style={[styles.tableCol, styles.colAmount]}>{currencySymbol}{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Footer Section */}
        <View style={styles.footerSection}>
          <View style={styles.notesColumn}>
            {invoice.metadata?.payment_methods && invoice.metadata.payment_methods.length > 0 && (
              <View style={styles.paymentMethods}>
                <Text style={styles.detailsLabel}>Accepted Payment Methods</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  {invoice.metadata.payment_methods.map((mId: string) => {
                    const m = PAYMENT_METHODS.find(pm => pm.id === mId);
                    return <Text key={mId} style={styles.methodTag}>{m?.name || mId}</Text>;
                  })}
                </View>
              </View>
            )}
            {invoice.memo && (
              <View style={{ marginTop: 15 }}>
                <Text style={styles.detailsLabel}>Memo</Text>
                <Text style={styles.memo}>{invoice.memo}</Text>
              </View>
            )}
            {qrCodeDataUrl && (
              <View style={styles.qrContainer}>
                <Image src={qrCodeDataUrl} style={styles.qrImage} />
                <View style={styles.qrText}>
                  <Text style={styles.qrTitle}>Scan to Pay</Text>
                  <Text style={styles.qrDesc}>Scan this QR code with your phone to pay this invoice securely via Stripe.</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.totalsColumn}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{currencySymbol}{subtotal.toFixed(2)}</Text>
            </View>
            {taxAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>VAT</Text>
                <Text style={styles.totalValue}>{currencySymbol}{taxAmount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Due</Text>
              <Text style={styles.grandTotalValue}>{currencySymbol}{invoice.amount.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Powered by Wersee</Text>
        </View>
      </Page>
    </Document>
  );
};
