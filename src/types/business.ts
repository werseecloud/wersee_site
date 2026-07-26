import { LucideIcon } from 'lucide-react';

export interface BusinessSettings {
  id: string;
  user_id: string;
  business_name: string;
  business_description: string;
  logo_url: string;
  terms_url: string;
  privacy_url: string;
  use_platform_policies: boolean;
  payout_schedule: 'monthly' | 'bi-weekly' | 'quarterly';
  default_payment_methods: string[];
}

export interface RevenueSplit {
  id: string;
  user_id: string;
  recipient_email: string;
  percentage: number;
  status: 'pending' | 'accepted';
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: LucideIcon | null;
  logo: string | null;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_email: string;
  customer_name: string;
  amount: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'refunded';
  due_date: string | null;
  paid_at: string | null;
  items: any[];
  tax_amount: number;
  refunded_amount: number;
  invoice_number: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  listing_id: string | null;
  invoice_id: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed' | 'refunded';
  customer_email: string;
  created_at: string;
}
