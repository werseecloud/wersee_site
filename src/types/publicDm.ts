export type PublicDmAccessMode =
  | 'everyone'
  | 'authenticated'
  | 'verified'
  | 'secret_link'
  | 'nobody';

export type PublicDmQuestion = {
  id: string;
  label: string;
  required: boolean;
};

export type PublicDmSettings = {
  user_id: string;
  enabled: boolean;
  access_mode: PublicDmAccessMode;
  secret_token?: string;
  require_name: boolean;
  require_email: boolean;
  require_subject: boolean;
  company_requirement: 'hidden' | 'optional' | 'required';
  allow_website: boolean;
  allow_attachments: boolean;
  maximum_length: number;
  custom_questions: PublicDmQuestion[];
  auto_label: boolean;
  auto_archive_days: number | null;
  email_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
  auto_reply_enabled: boolean;
  auto_reply_message: string;
  away_message_enabled: boolean;
  away_message: string;
  captcha_enabled: boolean;
  rate_limit_per_hour: number;
  filter_forbidden_words: boolean;
  forbidden_words: string[];
  filter_links: boolean;
  scan_attachments: boolean;
  blocked_countries: string[];
  suspicious_to_spam: boolean;
  show_avatar: boolean;
  show_full_name: boolean;
  hide_online_status: boolean;
  read_receipts: boolean;
  guest_retention_days: number;
  consent_message: string;
  title: string;
  description: string;
  logo_url: string | null;
  accent_color: string;
  preset_topics: string[];
  thank_you_message: string;
  wizard_completed: boolean;
};

export type PublicDmAttachment = {
  path: string;
  name: string;
  size: number;
  contentType: string;
  scanStatus: string;
};

export type PublicDmSubmission = {
  id: string;
  owner_id: string;
  sender_user_id: string | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_email_hash: string | null;
  subject: string | null;
  company_name: string | null;
  website_url: string | null;
  message: string;
  topic: string | null;
  custom_answers: Record<string, string>;
  attachments: PublicDmAttachment[];
  status: 'new' | 'read' | 'archived' | 'spam';
  label: 'collaboration' | 'support' | 'question' | 'spam';
  spam_score: number;
  country_code: string | null;
  created_at: string;
  read_at: string | null;
};

export const createDefaultPublicDmSettings = (userId: string): PublicDmSettings => ({
  user_id: userId,
  enabled: false,
  access_mode: 'everyone',
  require_name: true,
  require_email: false,
  require_subject: true,
  company_requirement: 'optional',
  allow_website: true,
  allow_attachments: false,
  maximum_length: 3000,
  custom_questions: [],
  auto_label: true,
  auto_archive_days: null,
  email_notifications: true,
  push_notifications: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Amsterdam',
  auto_reply_enabled: false,
  auto_reply_message: '',
  away_message_enabled: false,
  away_message: '',
  captcha_enabled: false,
  rate_limit_per_hour: 5,
  filter_forbidden_words: true,
  forbidden_words: [],
  filter_links: true,
  scan_attachments: true,
  blocked_countries: [],
  suspicious_to_spam: true,
  show_avatar: true,
  show_full_name: true,
  hide_online_status: true,
  read_receipts: false,
  guest_retention_days: 90,
  consent_message: 'I agree that my personal data may be processed to respond to this message.',
  title: 'Send me a message',
  description: 'Contact me directly through Wersee.',
  logo_url: null,
  accent_color: '#6366F1',
  preset_topics: ['Collaboration', 'Support', 'Question'],
  thank_you_message: 'Thank you. Your message was sent securely.',
  wizard_completed: false,
});
