import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Smartphone, Download, Shield, Zap, BarChart2,
  MessageSquare, CreditCard, Package, Users, Check,
  ChevronRight, Apple,
  Monitor, MonitorSmartphone, Laptop2,
  type LucideIcon,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';

const LATEST_VERSION = '1.0.0';
const APK_URL = '/wersee-app.apk'; // Place the built APK in /public/wersee-app.apk
const APPSTORE_APK_URL = '/wersee-appstore.apk'; // App Store APK in /public/wersee-appstore.apk

// Desktop installer links — served from /public or GitHub releases
const DESKTOP_DOWNLOADS = {
  windows: `/downloads/Wersee-Installer-${LATEST_VERSION}.exe`,
  mac:     `/downloads/Wersee-${LATEST_VERSION}.dmg`,
  linux:   `/downloads/Wersee-${LATEST_VERSION}.AppImage`,
};

const APPSTORE_DESKTOP_DOWNLOADS = {
  windows: `/downloads/Wersee-AppStore-Installer-${LATEST_VERSION}.exe`,
};

const MOBILE_APKS = [
  {
    key: 'wersee',
    title: 'Wersee',
    tagline: 'The main app — dashboard, products, payments & chat.',
    url: APK_URL,
    filename: 'wersee-app.apk',
    size: '~32 MB',
    badge: 'MAIN APP',
  },
  {
    key: 'appstore',
    title: 'Wersee App Store',
    tagline: 'Browse & install apps from the Wersee community. Upload your own — free.',
    url: APPSTORE_APK_URL,
    filename: 'wersee-appstore.apk',
    size: '~28 MB',
    badge: 'APP STORE',
  },
] as const;

type DesktopOS = 'windows' | 'mac' | 'linux';

const detectOS = (): DesktopOS => {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux') || ua.includes('x11')) return 'linux';
  return 'windows';
};

const features = [
  { icon: BarChart2, title: 'Live Dashboard', desc: 'Track revenue, orders and analytics in real time.' },
  { icon: Package, title: 'Manage Products', desc: 'Create and update your digital products on the go.' },
  { icon: CreditCard, title: 'Instant Payments', desc: 'Accept payments, send invoices and manage payouts.' },
  { icon: MessageSquare, title: 'Chat & Community', desc: 'Stay connected with your customers and team.' },
  { icon: Users, title: 'CRM on Mobile', desc: 'View contacts, deals and customer history anywhere.' },
  { icon: Shield, title: 'Secure & Private', desc: 'End-to-end encrypted with biometric login support.' },
];

const screenshots = [
  { label: 'Dashboard', bg: 'from-indigo-600 to-purple-700', icon: BarChart2 },
  { label: 'Products', bg: 'from-purple-600 to-pink-600', icon: Package },
  { label: 'Payments', bg: 'from-blue-600 to-cyan-500', icon: CreditCard },
  { label: 'Messages', bg: 'from-emerald-600 to-teal-500', icon: MessageSquare },
];

const PhoneMockup = ({ gradient, icon: Icon, label }: { gradient: string; icon: LucideIcon; label: string }) => (
  <div className="relative w-[160px] sm:w-[180px] shrink-0">
    <div className="relative rounded-[2.5rem] border-4 border-white/20 overflow-hidden shadow-2xl bg-black aspect-[9/19]">
      {/* Status bar */}
      <div className="absolute top-0 left-0 right-0 h-6 bg-black/60 z-10 flex items-center justify-between px-4">
        <span className="text-[8px] text-white/70 font-medium">9:41</span>
        <div className="flex gap-1 items-center">
          <div className="w-3 h-1.5 border border-white/50 rounded-sm"><div className="w-2 h-1 bg-white/70 rounded-sm" /></div>
        </div>
      </div>
      {/* Dynamic Island */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-black rounded-full z-10" />
      {/* Screen */}
      <div className={`w-full h-full bg-gradient-to-br ${gradient} flex flex-col items-center justify-center gap-3`}>
        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <span className="text-white/90 text-xs font-semibold">{label}</span>
        {/* Fake content lines */}
        <div className="w-24 space-y-1.5 mt-2">
          <div className="h-1.5 bg-white/30 rounded-full" />
          <div className="h-1.5 bg-white/20 rounded-full w-3/4" />
          <div className="h-1.5 bg-white/20 rounded-full w-1/2" />
        </div>
      </div>
    </div>
  </div>
);

export const DownloadApp: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const [detectedOS, setDetectedOS] = useState<DesktopOS>('windows');

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://wersee.com/download');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const osMeta: Record<DesktopOS, { label: string; icon: LucideIcon; ext: string; file: string; size: string }> = {
    windows: { label: 'Windows',   icon: Monitor,           ext: '.exe',      file: DESKTOP_DOWNLOADS.windows, size: '~140 MB' },
    mac:     { label: 'macOS',     icon: Apple,             ext: '.dmg',      file: DESKTOP_DOWNLOADS.mac,     size: '~160 MB' },
    linux:   { label: 'Linux',     icon: Laptop2,           ext: '.AppImage', file: DESKTOP_DOWNLOADS.linux,   size: '~150 MB' },
  };
  const primary = osMeta[detectedOS];
  const PrimaryIcon: LucideIcon = primary.icon;

  return (
    <>
      <SEO
        title="Download Wersee – Desktop & Mobile Apps"
        description="Download Wersee for Windows, macOS, Linux and Android. Manage products, payments, invoices and your entire business from any device."
      />

      <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

        {/* Hero */}
        <section className="relative pt-24 pb-20 px-4 overflow-hidden">
          {/* Background glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-8">
                    <Smartphone className="w-4 h-4" />
                    Now available for Android
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
                    Your Business
                    <br />
                    <span className="text-indigo-400">
                      In Your Pocket
                    </span>
                  </h1>

                  <p className="text-xl text-white/60 max-w-lg mx-auto lg:mx-0 mb-10 leading-relaxed">
                    The full power of Wersee, now on mobile. Two free APKs — the main Wersee app and our community App Store.
                  </p>

                  {/* Download buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                    <motion.a
                      href={APK_URL}
                      download="wersee-app.apk"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl font-bold text-lg transition-all duration-300 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
                    >
                      <Download className="w-5 h-5 group-hover:animate-bounce" />
                      Wersee App
                      <span className="text-white/60 text-sm font-normal">v{LATEST_VERSION}</span>
                    </motion.a>

                    <motion.a
                      href={APPSTORE_APK_URL}
                      download="wersee-appstore.apk"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="group flex items-center justify-center gap-3 px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl font-bold text-white transition-all duration-300"
                    >
                      <Download className="w-5 h-5 group-hover:animate-bounce" />
                      Wersee App Store
                    </motion.a>
                  </div>

                  {/* Stats */}
                  <div className="flex gap-8 mt-12 justify-center lg:justify-start">
                    {[
                      { label: 'Downloads', value: '10K+' },
                      { label: 'Rating', value: '4.9★' },
                      { label: 'Size', value: '32 MB' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <div className="text-xs text-white/40 mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right: Phone mockups */}
              <motion.div
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex gap-4 items-end"
              >
                {screenshots.map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: i % 2 === 0 ? 0 : 24 }}
                    transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }}
                  >
                    <PhoneMockup gradient={s.bg} icon={s.icon} label={s.label} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Two Android APKs ─────────────────────────────────── */}
        <section className="relative py-20 px-4 border-t border-white/[0.04]">
          <div className="relative max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Smartphone className="w-4 h-4" />
                Two Wersee apps for Android
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Pick your Wersee APK
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Install the main app to run your business, or grab the App Store to browse &
                publish community apps — both free.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {MOBILE_APKS.map((apk, i) => (
                <motion.a
                  key={apk.key}
                  href={apk.url}
                  download={apk.filename}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -4 }}
                  className={`group p-7 rounded-3xl border transition-all ${
                    i === 0
                      ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-400/50'
                      : 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-400/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black tracking-widest ${
                      i === 0 ? 'bg-indigo-500/30 text-indigo-200' : 'bg-purple-500/30 text-purple-200'
                    }`}>
                      {apk.badge}
                    </div>
                    <span className="text-white/40 text-xs">{apk.size}</span>
                  </div>
                  <h3 className="text-2xl font-black mb-2">{apk.title}</h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6">{apk.tagline}</p>
                  <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    i === 0
                      ? 'bg-indigo-600 group-hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)]'
                      : 'bg-purple-600 group-hover:bg-purple-500 text-white shadow-[0_0_30px_rgba(168,85,247,0.3)]'
                  }`}>
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    Download {apk.filename}
                  </div>
                </motion.a>
              ))}
            </div>

            <p className="text-center text-white/30 text-xs mt-6">
              Both APKs are signed by Wersee · Android 8.0+ · You can install both side by side.
            </p>
          </div>
        </section>

        {/* ── Desktop download ─────────────────────────────────── */}
        <section className="relative py-24 px-4 border-t border-white/[0.04]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6">
                <MonitorSmartphone className="w-4 h-4" />
                Also available for Desktop
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Wersee for Desktop
              </h2>
              <p className="text-white/50 text-lg max-w-2xl mx-auto">
                Native Windows, macOS and Linux apps. Faster, focused and always one click away — with native notifications and offline-friendly performance.
              </p>
            </div>

            {/* Primary download for detected OS */}
            <div className="max-w-3xl mx-auto mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-8 rounded-3xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 backdrop-blur-sm"
              >
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-[0_0_40px_rgba(99,102,241,0.35)]">
                    <PrimaryIcon className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-sm text-white/50 mb-1">We detected your OS</div>
                    <div className="text-2xl font-black mb-1">Download for {primary.label}</div>
                    <div className="text-white/40 text-sm">Version {LATEST_VERSION} · {primary.size} · Wersee-Installer{primary.ext}</div>
                  </div>
                  <motion.a
                    href={primary.file}
                    download
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl font-bold text-base transition-all duration-300 shadow-[0_0_40px_rgba(99,102,241,0.4)] hover:shadow-[0_0_60px_rgba(99,102,241,0.6)]"
                  >
                    <Download className="w-5 h-5 group-hover:animate-bounce" />
                    Download Installer
                  </motion.a>
                </div>
              </motion.div>
            </div>

            <div className="max-w-3xl mx-auto mb-10">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="p-6 rounded-3xl bg-white/[0.03] border border-white/[0.08]"
              >
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center shrink-0">
                    <Monitor className="w-7 h-7 text-purple-300" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <div className="text-xs text-white/50 mb-1">Desktop preview</div>
                    <div className="text-xl font-black mb-1">Wersee App Store for Windows</div>
                    <div className="text-white/40 text-sm">Version {LATEST_VERSION} · .exe installer</div>
                  </div>
                  <motion.a
                    href={APPSTORE_DESKTOP_DOWNLOADS.windows}
                    download
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold text-sm transition-all duration-300"
                  >
                    <Download className="w-4 h-4 group-hover:animate-bounce" />
                    Download App Store .exe
                  </motion.a>
                </div>
              </motion.div>
            </div>

            {/* All platforms */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {(['windows', 'mac', 'linux'] as DesktopOS[]).map((os) => {
                const meta = osMeta[os];
                const Icon: LucideIcon = meta.icon;
                const isPrimary = os === detectedOS;
                return (
                  <motion.a
                    key={os}
                    href={meta.file}
                    download
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -4 }}
                    className={`group p-6 rounded-3xl border transition-all ${
                      isPrimary
                        ? 'bg-indigo-500/10 border-indigo-500/30 hover:bg-indigo-500/15'
                        : 'bg-white/[0.03] border-white/[0.06] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isPrimary ? 'bg-indigo-500/20' : 'bg-white/5'
                      }`}>
                        <Icon className={`w-6 h-6 ${isPrimary ? 'text-indigo-400' : 'text-white/70'}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{meta.label}</h3>
                        <p className="text-xs text-white/40">{meta.size} · {meta.ext}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${
                      isPrimary ? 'text-indigo-400' : 'text-white/60 group-hover:text-white'
                    }`}>
                      <Download className="w-4 h-4" />
                      Download
                      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.a>
                );
              })}
            </div>

            {/* Security / system notes */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {[
                { icon: Shield, label: 'Signed installer', desc: 'Verified & published by Wersee.' },
                { icon: Zap,    label: 'Fast & native',    desc: 'Dedicated window, shortcuts & tray.' },
                { icon: Check,  label: 'Auto updates',     desc: 'Always on the latest version.' },
              ].map((n) => (
                <div key={n.label} className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                    <n.icon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{n.label}</p>
                    <p className="text-white/40 text-xs mt-0.5">{n.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Everything You Need
              </h2>
              <p className="text-white/50 text-lg max-w-xl mx-auto">
                All the tools you love on the web, rebuilt for the speed of mobile.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="group p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 hover:bg-white/[0.06] transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 group-hover:bg-indigo-500/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Install Guide */}
        <section className="py-24 px-4 bg-white/[0.02]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-black tracking-tight mb-4">
                Get Started in 3 Steps
              </h2>
              <p className="text-white/50">Installing the APK takes less than 60 seconds.</p>
            </div>

            <div className="space-y-4">
              {[
                {
                  step: '01',
                  title: 'Download an APK',
                  desc: 'Grab the main Wersee app, the App Store, or both — they can live side by side on the same device.',
                  action: (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={APK_URL}
                        download="wersee-app.apk"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 rounded-xl text-indigo-400 text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Wersee App
                      </a>
                      <a
                        href={APPSTORE_APK_URL}
                        download="wersee-appstore.apk"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        App Store
                      </a>
                    </div>
                  ),
                },
                {
                  step: '02',
                  title: 'Allow Unknown Sources',
                  desc: 'Go to Settings → Security → Install Unknown Apps and allow your browser or file manager to install APKs.',
                  action: null,
                },
                {
                  step: '03',
                  title: 'Install & Launch',
                  desc: 'Open the downloaded file, tap Install, then open Wersee and log in with your account.',
                  action: null,
                },
              ].map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="flex gap-6 p-6 rounded-3xl bg-white/[0.03] border border-white/[0.06]"
                >
                  <div className="text-4xl font-black text-white/10 shrink-0 w-12">{item.step}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                    <p className="text-white/50 text-sm leading-relaxed mb-3">{item.desc}</p>
                    {item.action}
                  </div>
                  <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-indigo-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Requirements */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  System Requirements
                </h3>
                <ul className="space-y-3">
                  {[
                    'Android 8.0 (Oreo) or higher',
                    '2 GB RAM minimum (4 GB recommended)',
                    '50 MB free storage',
                    'Internet connection required',
                  ].map((req) => (
                    <li key={req} className="flex items-center gap-3 text-white/60 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  Safe & Verified
                </h3>
                <ul className="space-y-3">
                  {[
                    'Digitally signed by Wersee',
                    'No third-party trackers',
                    'Open-source dependencies',
                    'Encrypted data transmission',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-white/60 text-sm">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-600 to-purple-600 mb-8 shadow-[0_0_80px_rgba(99,102,241,0.4)]">
                <Smartphone className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
                Ready to download?
              </h2>
              <p className="text-white/50 text-lg mb-10">
                Join thousands of creators managing their business with Wersee.
              </p>
              <motion.a
                href={APK_URL}
                download="wersee-app.apk"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-2xl font-bold text-xl transition-all duration-300 shadow-[0_0_60px_rgba(99,102,241,0.4)]"
              >
                <Download className="w-6 h-6" />
                Download for Android
              </motion.a>
              <p className="text-white/30 text-sm mt-4">
                Version {LATEST_VERSION} · Free · No account required to download
              </p>
            </motion.div>
          </div>
        </section>

        {/* Bottom nav hint */}
        <div className="border-t border-white/[0.06] py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/30 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <span className="font-bold text-white/60">Wersee</span>
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
              <Link to="/support" className="hover:text-white/60 transition-colors">Support</Link>
              <Link to="/" className="hover:text-white/60 transition-colors">Back to site</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DownloadApp;
