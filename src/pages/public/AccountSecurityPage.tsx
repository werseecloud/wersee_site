import React from 'react';
import { ArrowLeft, CheckCircle2, Fingerprint, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '../../components/SEO';

const securityChecks = [
  {
    icon: KeyRound,
    title: 'Leaked password blocking',
    description:
      'Wersee checks new passwords against a known breach database before account creation. If a password has appeared in a public breach, we block it and ask you to choose another one.',
  },
  {
    icon: LockKeyhole,
    title: 'Private password check',
    description:
      'Your full password is never sent to the breach service. Wersee hashes it in your browser and only checks a small hash prefix, so the service cannot see the password you typed.',
  },
  {
    icon: Fingerprint,
    title: 'Anti-bot verification',
    description:
      'Account creation includes a verification step to slow down automated abuse and protect the platform from fake signups.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure account flow',
    description:
      'Wersee uses secure authentication flows for signup, email verification, login sessions, and account recovery so your account starts with the right protections enabled.',
  },
];

const accountProtections = [
  'Passwords must meet a minimum length before account creation can continue.',
  'A strength meter helps you choose a stronger password before submitting.',
  'Known compromised passwords are rejected instead of accepted silently.',
  'Auth sessions are handled through secure token based flows.',
  'Wersee never asks for your password by email or support message.',
];

export const AccountSecurityPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <SEO
        title="Account Creation Security"
        description="Learn how Wersee protects account creation with password safety checks, anti-bot verification, and secure authentication flows."
        noIndex
      />

      <div className="sticky top-0 z-20 border-b border-white/10 bg-[#050505]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Wersee Security</p>
            <h1 className="text-base font-bold text-white">Account creation protection</h1>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-5 py-10 md:py-16">
        <section className="mb-12 max-w-3xl">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10">
            <ShieldCheck className="h-8 w-8 text-emerald-300" />
          </div>
          <h2 className="mb-4 text-4xl font-black tracking-tight text-white md:text-5xl">
            Why Wersee stops breached passwords
          </h2>
          <p className="text-lg leading-8 text-white/60">
            If you see the warning that your password appeared in a known data breach, it means that password is already public somewhere on the internet. Wersee blocks it before your account is created because attackers often try leaked passwords on new accounts.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {securityChecks.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                  <Icon className="h-6 w-6 text-emerald-300" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-white">{item.title}</h3>
                <p className="leading-7 text-white/55">{item.description}</p>
              </article>
            );
          })}
        </section>

        <section className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] p-6 md:p-8">
          <h3 className="mb-6 text-2xl font-bold text-white">What Wersee checks during signup</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {accountProtections.map((protection) => (
              <div key={protection} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
                <p className="text-sm leading-6 text-white/65">{protection}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-red-400/20 bg-red-400/10 p-6 md:p-8">
          <h3 className="mb-3 text-xl font-bold text-white">What to do when you see the warning</h3>
          <p className="leading-7 text-white/65">
            Choose a new password that you do not use on other websites. A strong password is long, unique, and hard to guess. If you used the same password somewhere else, change it there too.
          </p>
        </section>
      </main>
    </div>
  );
};
