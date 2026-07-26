import React, { useEffect, useState } from 'react';
import { Captions, CheckCircle2, Contrast, Keyboard, Loader2, Move, Type } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { accessibilityDefaults as defaults, applyAccessibilityPreferences, persistAccessibilityPreferences, type AccessibilityPreferences as Preferences } from '../../../lib/accessibilityPreferences';

export const AccessibilitySettings = () => {
  const [preferences, setPreferences] = useState(defaults);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return setLoading(false);
      setUserId(auth.user.id);
      const { data } = await supabase.from('user_preferences').select('reduced_motion,increased_contrast,interface_text_scale,captions_enabled').eq('user_id', auth.user.id).maybeSingle();
      const next = data ? { ...defaults, ...data, interface_text_scale: Number(data.interface_text_scale || 1) } : defaults;
      setPreferences(next);
      persistAccessibilityPreferences(next);
      setLoading(false);
    };
    void load();
  }, []);

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    applyAccessibilityPreferences(next);
  };

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    setMessage('');
    const { error } = await supabase.from('user_preferences').upsert({ user_id: userId, ...preferences, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
    if (!error) persistAccessibilityPreferences(preferences);
    setMessage(error ? error.message : 'Accessibility preferences saved.');
    setSaving(false);
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-white/50" /></div>;

  const toggles = [
    ['reduced_motion', 'Reduced motion', 'Minimizes non-essential transitions and movement.', Move],
    ['increased_contrast', 'Increased contrast', 'Strengthens borders, muted text and focus indication.', Contrast],
    ['captions_enabled', 'Prefer captions', 'Requests captions where media offers them.', Captions],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <h2 className="text-lg font-black text-white">Interface accessibility</h2>
        <p className="mt-1 text-sm leading-6 text-white/45">These settings improve the standard Wersee interface. There is no separate reduced product.</p>
        <div className="mt-5 space-y-3">
          {toggles.map(([key, title, detail, Icon]) => <label key={key} className="flex min-h-20 items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><span className="flex items-start gap-3"><Icon className="mt-0.5 h-5 w-5 text-blue-300" /><span><span className="block text-sm font-bold text-white">{title}</span><span className="mt-1 block text-xs leading-4 text-white/40">{detail}</span></span></span><input type="checkbox" checked={preferences[key]} onChange={(event) => update(key, event.target.checked)} className="h-5 w-5 accent-white" /></label>)}
        </div>
      </section>
      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <label className="flex items-center gap-2 text-sm font-bold text-white"><Type className="h-5 w-5 text-violet-300" /> Interface text size</label>
        <input type="range" min="1" max="1.35" step="0.05" value={preferences.interface_text_scale} onChange={(event) => update('interface_text_scale', Number(event.target.value))} className="mt-5 w-full accent-white" />
        <div className="mt-2 flex justify-between text-xs text-white/35"><span>Standard</span><span>{Math.round(preferences.interface_text_scale * 100)}%</span><span>Larger</span></div>
      </section>
      <section className="rounded-3xl border border-white/[0.07] bg-[#141414] p-5 sm:p-6">
        <h2 className="flex items-center gap-2 text-sm font-black text-white"><Keyboard className="h-5 w-5 text-emerald-300" /> Keyboard information</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/50"><li><kbd className="rounded bg-white/10 px-2 py-1 text-xs text-white">Tab</kbd> moves through controls.</li><li><kbd className="rounded bg-white/10 px-2 py-1 text-xs text-white">Enter</kbd> or <kbd className="rounded bg-white/10 px-2 py-1 text-xs text-white">Space</kbd> activates the focused control.</li><li><kbd className="rounded bg-white/10 px-2 py-1 text-xs text-white">Esc</kbd> closes an open dialog.</li></ul>
      </section>
      {message && <p role="status" className="flex items-center gap-2 text-sm text-white/60"><CheckCircle2 className="h-4 w-4 text-emerald-300" /> {message}</p>}
      <button disabled={saving} onClick={save} className="flex h-11 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-black disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save accessibility settings'}</button>
    </div>
  );
};
