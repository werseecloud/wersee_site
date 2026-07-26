-- Persist workspace appearance preference outside profiles for robust storage and RLS safety.

alter table public.user_preferences
  add column if not exists workspace_theme_preference text check (
    workspace_theme_preference in ('light', 'dark', 'system')
  );

