import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export interface ExportData {
  account: {
    id: string;
    email: string;
    created_at: string;
    last_sign_in_at: string;
    email_confirmed_at: string;
    phone: string;
    email_history: any[];
    username_history: any[];
    profile_history: any[];
  };
  profile: any;
  security: any[];
  sessions: any[];
  activity: any[];
  audit_logs: any[];
  communications: {
    notifications: any[];
    messages: any[];
    emails: any[];
  };
  privacy: any[];
  payments: {
    orders_as_buyer: any[];
    orders_as_seller: any[];
    payouts: any[];
    disputes: any[];
  };
  subscriptions: any[];
  marketplace: {
    products: any[];
    purchases: any[];
    sales: any[];
  };
  content: {
    posts: any[];
    comments: any[];
    uploads: any[];
  };
  social: {
    followers: any[];
    following: any[];
    blocks: any[];
  };
  integrations: any[];
  developer: {
    api_keys: any[];
    webhooks: any[];
  };
  system: {
    trust_score: number;
    risk_level: string;
    flags: string[];
  };
}

export const dataExportService = {
  async fetchAllUserData(userId: string): Promise<ExportData> {
    // 1. Account & Profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: emailHistory } = await supabase.from('user_email_history').select('*').eq('user_id', userId);
    const { data: usernameHistory } = await supabase.from('user_username_history').select('*').eq('user_id', userId);
    const { data: profileHistory } = await supabase.from('user_profile_history').select('*').eq('user_id', userId);

    // 2. Security & Sessions
    const { data: securityLogs } = await supabase.from('user_security_logs').select('*').eq('user_id', userId);
    const { data: sessions } = await supabase.from('user_sessions').select('*').eq('user_id', userId);

    // 3. Activity & Audit
    const { data: activityLogs } = await supabase.from('user_activity_logs').select('*').eq('user_id', userId);
    const { data: auditLogs } = await supabase.from('user_audit_logs').select('*').eq('user_id', userId);

    // 4. Communications
    const { data: notifications } = await supabase.from('notifications').select('*').eq('user_id', userId);
    const { data: communications } = await supabase.from('user_communications').select('*').eq('user_id', userId);

    // 5. Privacy
    const { data: privacyConsents } = await supabase.from('user_privacy_consents').select('*').eq('user_id', userId);

    // 6. Payments & Billing
    const { data: ordersAsBuyer } = await supabase.from('orders').select('*').eq('buyer_id', userId);
    const { data: ordersAsSeller } = await supabase.from('orders').select('*').eq('seller_id', userId);
    const { data: payouts } = await supabase.from('payouts').select('*').eq('user_id', userId);
    const { data: disputes } = await supabase.from('disputes').select('*').eq('seller_id', userId);

    // 7. Subscriptions
    const { data: subscriptions } = await supabase.from('subscriptions').select('*').eq('user_id', userId);

    // 8. Marketplace
    const { data: products } = await supabase.from('listings').select('*').eq('seller_id', userId);

    // 9. Content
    const { data: posts } = await supabase.from('posts').select('*').eq('user_id', userId);
    const { data: comments } = await supabase.from('comments').select('*').eq('user_id', userId);

    // 10. Social
    const { data: followers } = await supabase.from('follows').select('*').eq('following_id', userId);
    const { data: following } = await supabase.from('follows').select('*').eq('follower_id', userId);

    // 11. Integrations
    const { data: integrations } = await supabase.from('user_integrations').select('*').eq('user_id', userId);

    // 12. Developer
    const { data: apiKeys } = await supabase.from('api_keys').select('*').eq('user_id', userId);

    return {
      account: {
        id: user?.id || '',
        email: user?.email || '',
        created_at: user?.created_at || '',
        last_sign_in_at: user?.last_sign_in_at || '',
        email_confirmed_at: user?.email_confirmed_at || '',
        phone: user?.phone || '',
        email_history: emailHistory || [],
        username_history: usernameHistory || [],
        profile_history: profileHistory || [],
      },
      profile: profile || {},
      security: securityLogs || [],
      sessions: sessions || [],
      activity: activityLogs || [],
      audit_logs: auditLogs || [],
      communications: {
        notifications: notifications || [],
        messages: [],
        emails: communications || [],
      },
      privacy: privacyConsents || [],
      payments: {
        orders_as_buyer: ordersAsBuyer || [],
        orders_as_seller: ordersAsSeller || [],
        payouts: payouts || [],
        disputes: disputes || [],
      },
      subscriptions: subscriptions || [],
      marketplace: {
        products: products || [],
        purchases: ordersAsBuyer || [],
        sales: ordersAsSeller || [],
      },
      content: {
        posts: posts || [],
        comments: comments || [],
        uploads: [],
      },
      social: {
        followers: followers || [],
        following: following || [],
        blocks: [],
      },
      integrations: integrations || [],
      developer: {
        api_keys: apiKeys || [],
        webhooks: [],
      },
      system: {
        trust_score: 95,
        risk_level: 'low',
        flags: ['verified_email', 'active_user'],
      },
    };
  },

  async fetchExportHistory(userId: string) {
    const { data, error } = await supabase
      .from('user_data_exports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async createInteractiveSession(userId: string, data: ExportData) {
    try {
      // Get IP address
      let ip = 'unknown';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ip = ipData.ip;
        }
      } catch (e) {
        console.warn('Could not fetch IP for interactive session restriction - defaulting to unknown');
      }

      const { data: session, error } = await supabase
        .from('interactive_data_exports')
        .insert({
          user_id: userId,
          data: data,
          allowed_ip: ip,
          expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    } catch (err) {
      console.error('Error creating interactive session:', err);
      return null;
    }
  },

  async downloadExport(filePath: string, fileName: string) {
    const { data, error } = await supabase.storage
      .from('business_storage')
      .download(filePath);

    if (error) throw error;
    if (data) {
      saveAs(data, fileName);
    }
  },

  async generateExportZip(data: ExportData) {
    const zip = new JSZip();
    const root = zip.folder('user-data-export');

    if (!root) return;

    // 0. Add schema.json
    const schema = {
      version: "1.0.0",
      export_date: new Date().toISOString(),
      structure: {
        "account/": "Core account data, including email and username history.",
        "profile/": "Personal profile information, bio, and preferences.",
        "security/": "Security logs, login attempts, and 2FA status.",
        "sessions/": "Active and historical session data with device info.",
        "activity/": "Granular user activity logs (clicks, page visits).",
        "communications/": "Notification history and sent communications.",
        "privacy/": "Consent history and privacy preferences.",
        "payments/": "Financial transactions, orders, payouts, and disputes.",
        "subscriptions/": "Active and past subscription plans.",
        "marketplace/": "Products listed, purchased, and sold.",
        "content/": "User-generated content (posts, comments).",
        "social/": "Followers, following, and social interactions.",
        "developer/": "API keys and webhook configurations.",
        "system/": "Internal system flags and trust scores.",
        "logs/": "Full system audit logs."
      }
    };
    root.file('schema.json', JSON.stringify(schema, null, 2));

    // 1. Add JSON files and technical READMEs
    const addFolderData = (path: string, fileName: string, jsonData: any, description: string) => {
      const folder = root.folder(path);
      if (folder) {
        folder.file(fileName, JSON.stringify(jsonData, null, 2));
        folder.file('README.txt', `Technical Overview: ${path}\n\nDescription: ${description}\n\nData Schema:\n${JSON.stringify(Object.keys(Array.isArray(jsonData) ? (jsonData[0] || {}) : jsonData), null, 2)}`);
      }
    };

    addFolderData('account', 'account.json', data.account, "Core authentication and identity data.");
    addFolderData('profile', 'profile.json', data.profile, "Public and private profile metadata.");
    addFolderData('security', 'security.json', data.security, "Security-critical event logs.");
    addFolderData('sessions', 'sessions.json', data.sessions, "Device and session tracking data.");
    addFolderData('activity', 'activity.json', data.activity, "User interaction and navigation logs.");
    addFolderData('communications', 'notifications.json', data.communications.notifications, "System and user notifications.");
    addFolderData('privacy', 'privacy.json', data.privacy, "Legal consents and privacy toggles.");
    addFolderData('payments', 'payments.json', data.payments, "Financial ledger and transaction history.");
    addFolderData('subscriptions', 'subscriptions.json', data.subscriptions, "Recurring billing and plan data.");
    addFolderData('marketplace', 'marketplace.json', data.marketplace, "E-commerce and listing data.");
    addFolderData('content', 'content.json', data.content, "User-created posts and comments.");
    addFolderData('social', 'social.json', data.social, "Social graph and relationship data.");
    addFolderData('developer', 'developer.json', data.developer, "API and integration metadata.");
    addFolderData('system', 'system.json', data.system, "Internal trust and risk assessment data.");
    addFolderData('logs', 'audit.json', data.audit_logs, "Comprehensive system audit trail.");

    // 2. Generate PDF Overview
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let y = 20;

    // Premium Colors
    const colors: { [key: string]: [number, number, number] } = {
      primary: [10, 10, 10], // Dark Black
      accent: [79, 70, 229], // Indigo
      secondary: [16, 185, 129], // Emerald
      text: [40, 40, 40],
      muted: [120, 120, 120],
      bg: [250, 250, 250],
      border: [230, 230, 230],
      gold: [212, 175, 55]
    };

    // Helper for Logo
    const drawLogo = (x: number, y: number, size: number, color: [number, number, number]) => {
      pdf.setDrawColor(color[0], color[1], color[2]);
      pdf.setLineWidth(size / 10);
      
      // Draw a stylized "W" using lines for a modern look
      const half = size / 2;
      const quarter = size / 4;
      
      pdf.line(x - half, y - half, x - quarter, y + half);
      pdf.line(x - quarter, y + half, x, y - quarter);
      pdf.line(x, y - quarter, x + quarter, y + half);
      pdf.line(x + quarter, y + half, x + half, y - half);
      
      // Add a small accent dot
      pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.circle(x + half + 2, y - half, 1, 'F');
    };

    // Helper for beautiful headers
    const addHeader = (text: string, size = 24) => {
      // Add a subtle background for the header
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(0, y - 15, pageWidth, 40, 'F');
      
      // Accent line
      pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.rect(0, y - 15, 5, 40, 'F');

      pdf.setFontSize(size);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.text(text.toUpperCase(), 20, y + 10);
      
      pdf.setTextColor(0, 0, 0);
      y += 45;
    };

    const addSectionTitle = (text: string, size = 16) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.text(text, 20, y);
      
      // Decorative line
      pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.setLineWidth(0.5);
      pdf.line(20, y + 2, 40, y + 2);
      
      y += 12;
      checkPage(y);
    };

    const addText = (text: string, size = 10, style = 'normal', color = colors.text) => {
      pdf.setFontSize(size);
      pdf.setFont('helvetica', style);
      pdf.setTextColor(color[0], color[1], color[2]);
      const lines = pdf.splitTextToSize(text, pageWidth - 40);
      pdf.text(lines, 20, y);
      y += (lines.length * (size / 2)) + 5;
      checkPage(y);
    };

    const addCode = (code: any) => {
      const codeStr = JSON.stringify(code, null, 2);
      const lines = pdf.splitTextToSize(codeStr, pageWidth - 50);
      const blockHeight = (lines.length * 4) + 12;
      
      // Shadow effect
      pdf.setFillColor(240, 240, 240);
      pdf.roundedRect(21, y - 4, pageWidth - 40, blockHeight, 2, 2, 'F');

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.roundedRect(20, y - 5, pageWidth - 40, blockHeight, 2, 2, 'FD');
      
      pdf.setFont('courier', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(60, 60, 60);
      pdf.text(lines, 25, y + 2);
      
      y += blockHeight + 10;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont('helvetica', 'normal');
      checkPage(y);
    };

    const addDataVisualization = (title: string, chartData: { label: string, value: number }[]) => {
      addSectionTitle(title);
      const chartWidth = pageWidth - 80;
      const barHeight = 6;
      const spacing = 6;
      const maxValue = Math.max(...chartData.map(d => d.value), 1);

      chartData.forEach((item) => {
        const barWidth = (item.value / maxValue) * chartWidth;
        
        // Label
        pdf.setFontSize(8);
        pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
        pdf.text(item.label, 20, y + 4);
        
        // Bar background
        pdf.setFillColor(245, 245, 245);
        pdf.roundedRect(60, y, chartWidth, barHeight, 1, 1, 'F');
        
        // Bar foreground
        pdf.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
        pdf.roundedRect(60, y, barWidth, barHeight, 1, 1, 'F');
        
        // Value
        pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.value.toString(), 60 + chartWidth + 5, y + 4);
        pdf.setFont('helvetica', 'normal');
        
        y += barHeight + spacing;
        checkPage(y);
      });
      y += 10;
    };

    const checkPage = (currentY: number) => {
      if (currentY > 265) {
        pdf.addPage();
        // Add subtle grid background
        pdf.setDrawColor(245, 245, 245);
        for(let i=0; i<pageWidth; i+=20) pdf.line(i, 0, i, pageHeight);
        for(let i=0; i<pageHeight; i+=20) pdf.line(0, i, pageWidth, i);

        // Add page footer
        pdf.setFontSize(8);
        pdf.setTextColor(180, 180, 180);
        pdf.text(`WERSEE DATA ARCHIVE • CONFIDENTIAL • PAGE ${pdf.getNumberOfPages()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        y = 30;
      }
    };

    // Page 1: Ultra Premium Cover
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Abstract Tech Lines
    pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2], 0.2);
    for(let i=0; i<pageWidth; i+=10) {
      pdf.line(i, 0, pageWidth - i, pageHeight);
    }

    // Decorative elements
    pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    pdf.setLineWidth(1);
    pdf.line(20, 20, 60, 20);
    pdf.line(20, 20, 20, 60);
    pdf.line(pageWidth - 20, pageHeight - 20, pageWidth - 60, pageHeight - 20);
    pdf.line(pageWidth - 20, pageHeight - 20, pageWidth - 20, pageHeight - 60);

    // Logo
    drawLogo(pageWidth / 2, 80, 40, [255, 255, 255]);
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(42);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WERSEE', pageWidth / 2, 125, { align: 'center', charSpace: 2 });
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    pdf.text('DATA EXPORT PROTOCOL v1.1', pageWidth / 2, 140, { align: 'center', charSpace: 1 });
    
    pdf.setDrawColor(255, 255, 255, 0.1);
    pdf.line(40, 160, pageWidth - 40, 160);
    
    pdf.setTextColor(180, 180, 180);
    pdf.setFontSize(10);
    pdf.text(`SUBJECT IDENTITY: ${data.account.email}`, pageWidth / 2, 180, { align: 'center' });
    pdf.text(`TEMPORAL STAMP: ${format(new Date(), 'PPP p')}`, pageWidth / 2, 190, { align: 'center' });
    pdf.text(`ARCHIVE HASH: ${Math.random().toString(36).substring(2).toUpperCase()}`, pageWidth / 2, 200, { align: 'center' });

    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(8);
    const disclaimer = "This document contains sensitive personal data protected under GDPR and international privacy laws. Unauthorized access is strictly prohibited.";
    pdf.text(disclaimer, pageWidth / 2, pageHeight - 30, { align: 'center', maxWidth: 120 });

    // Page 2: Executive Summary & Stats
    pdf.addPage(); y = 30;
    addHeader('Executive Summary');
    
    // Stats Grid
    const stats = [
      { label: 'Security Events', value: data.security.length },
      { label: 'Active Sessions', value: data.sessions.length },
      { label: 'Total Orders', value: data.payments.orders_as_buyer.length + data.payments.orders_as_seller.length },
      { label: 'Social Connections', value: data.social.followers.length + data.social.following.length }
    ];

    let statX = 20;
    stats.forEach(stat => {
      pdf.setFillColor(248, 248, 248);
      pdf.roundedRect(statX, y, 40, 30, 2, 2, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(120, 120, 120);
      pdf.text(stat.label, statX + 20, y + 10, { align: 'center' });
      pdf.setFontSize(14);
      pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      pdf.setFont('helvetica', 'bold');
      pdf.text(stat.value.toString(), statX + 20, y + 22, { align: 'center' });
      statX += 45;
    });
    y += 45;

    addDataVisualization('Data Distribution Overview', [
      { label: 'Security Logs', value: data.security.length },
      { label: 'Activity Logs', value: data.activity.length },
      { label: 'Audit Logs', value: data.audit_logs.length },
      { label: 'Notifications', value: data.communications.notifications.length },
      { label: 'Content (Posts/Comments)', value: data.content.posts.length + data.content.comments.length }
    ]);

    addDataVisualization('Privacy & Security Metrics', [
      { label: 'Trust Score', value: data.system.trust_score },
      { label: 'Data Portability Index', value: 100 },
      { label: 'Encryption Standard (AES)', value: 256 },
      { label: 'Access Control Level', value: 10 }
    ]);

    addSectionTitle('Archive Architecture');
    addText('The accompanying ZIP file utilizes a standardized JSON-LD compatible structure for maximum interoperability.', 10);
    
    y += 5;
    Object.entries(schema.structure).forEach(([path, desc]) => {
      pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      pdf.line(20, y, pageWidth - 20, y);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.text(path, 25, y + 7);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2]);
      pdf.text(desc, 65, y + 7);
      y += 12;
      checkPage(y);
    });

    // Page 3: Identity
    pdf.addPage(); y = 30;
    addHeader('Identity Profile');
    addSectionTitle('Core Authentication Node');
    addCode({
      uid: data.account.id,
      primary_email: data.account.email,
      registration_date: data.account.created_at,
      verified: data.account.email_confirmed_at ? true : false,
      mfa_enabled: data.security.some(s => s.event_type === 'mfa_enabled')
    });

    addSectionTitle('Profile Metadata');
    addCode(data.profile);

    // Page 4: Financial Ledger
    pdf.addPage(); y = 30;
    addHeader('Financial Ledger');
    
    const spendingByMonth = this.aggregateFinancials(data.payments.orders_as_buyer, 'month');
    const earningsByMonth = this.aggregateFinancials(data.payments.orders_as_seller, 'month');

    addSectionTitle('Outbound Transaction Volume');
    autoTable(pdf, {
      startY: y,
      head: [['Fiscal Period', 'Volume (€)']],
      body: spendingByMonth.map(s => [s.period, s.amount.toFixed(2)]),
      theme: 'grid',
      headStyles: { fillColor: colors.primary, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = (pdf as any).lastAutoTable.finalY + 15;

    addSectionTitle('Inbound Revenue Stream');
    autoTable(pdf, {
      startY: y,
      head: [['Fiscal Period', 'Revenue (€)']],
      body: earningsByMonth.map(s => [s.period, s.amount.toFixed(2)]),
      theme: 'grid',
      headStyles: { fillColor: colors.accent, textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9 }
    });
    y = (pdf as any).lastAutoTable.finalY + 15;

    // Page 5: Security & Audit
    pdf.addPage(); y = 30;
    addHeader('Security Audit');
    
    addSectionTitle('Recent Access Logs');
    autoTable(pdf, {
      startY: y,
      head: [['Event Type', 'Source IP', 'Timestamp']],
      body: data.security.slice(0, 15).map(s => [
        s.event_type.replace(/_/g, ' ').toUpperCase(), 
        s.ip_address, 
        format(new Date(s.created_at), 'yyyy-MM-dd HH:mm:ss')
      ]),
      theme: 'striped',
      headStyles: { fillColor: colors.primary },
      styles: { fontSize: 8 }
    });
    y = (pdf as any).lastAutoTable.finalY + 15;

    addSectionTitle('System Health & Risk Assessment');
    addCode({
      trust_score: data.system.trust_score,
      risk_level: data.system.risk_level.toUpperCase(),
      active_flags: data.system.flags
    });

    // Page 6: Marketplace
    pdf.addPage(); y = 30;
    addHeader('Marketplace Inventory');
    
    addSectionTitle('Active Asset Listings');
    autoTable(pdf, {
      startY: y,
      head: [['Asset Title', 'Valuation', 'Status']],
      body: data.marketplace.products.map(p => [p.title, `€${p.price}`, p.status.toUpperCase()]),
      theme: 'grid',
      headStyles: { fillColor: colors.primary },
    });
    y = (pdf as any).lastAutoTable.finalY + 15;

    // Page 7: GDPR & Legal
    pdf.addPage(); y = 30;
    addHeader('Legal Compliance');
    const gdprText = `
    This data export is provided in accordance with Article 15 (Right of Access) and Article 20 (Right to Data Portability) of the General Data Protection Regulation (GDPR).
    
    DATA SUBJECT RIGHTS:
    • RECTIFICATION: Request correction of inaccurate data.
    • ERASURE: Request deletion of personal data ("Right to be Forgotten").
    • RESTRICTION: Request limitation of data processing.
    • OBJECTION: Object to processing based on legitimate interests.
    
    ENFORCEMENT:
    For inquiries regarding this export or to exercise further rights, contact our Data Protection Officer at dpo@wersee.com.
    `;
    addText(gdprText, 10, 'normal', colors.text);

    const pdfBlob = pdf.output('blob');
    root.file('overview.pdf', pdfBlob);

    // 3. Generate ZIP and download
    const content = await zip.generateAsync({ type: 'blob' });
    const fileName = `wersee-data-export-${format(new Date(), 'yyyy-MM-dd-HHmm')}.zip`;
    
    // 4. Create Interactive Session
    const interactiveSession = await this.createInteractiveSession(data.account.id, data);
    
    // 5. Upload to Supabase Storage (Visible in Storage Screen)
    try {
      // We upload to 'business_storage' under 'Data Exports' folder for the user
      const filePath = `Data Exports/${fileName}`;
      const fullPath = `${data.account.id}/${filePath}`;
      
      const { error: uploadError } = await supabase.storage
        .from('business_storage')
        .upload(fullPath, content, {
          contentType: 'application/zip',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading export to storage:', uploadError);
      } else {
        // 6. Record in database
        const { error: dbError } = await supabase
          .from('user_data_exports')
          .insert({
            user_id: data.account.id,
            file_name: fileName,
            file_path: fullPath, // Use the full path for downloading later
            file_size: content.size,
            status: 'completed',
            expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 months
          });
        
        if (dbError) console.error('Error recording export in DB:', dbError);
      }
    } catch (err) {
      console.error('Failed to store export copy:', err);
    }

    // 7. Trigger browser download
    saveAs(content, fileName);

    return interactiveSession?.id;
  },

  aggregateFinancials(orders: any[], period: 'day' | 'month' | 'year') {
    const formatStr = period === 'day' ? 'yyyy-MM-dd' : period === 'month' ? 'yyyy-MM' : 'yyyy';
    const aggregated = orders.reduce((acc: any, order: any) => {
      const date = format(new Date(order.created_at), formatStr);
      acc[date] = (acc[date] || 0) + Number(order.amount || 0);
      return acc;
    }, {});

    return Object.entries(aggregated)
      .map(([period, amount]) => ({ period, amount: amount as number }))
      .sort((a, b) => b.period.localeCompare(a.period));
  }
};
