import React from 'react';
import { ArrowLeft, ArrowUpRight, ExternalLink, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';

type WebsiteDetailProps = {
  listing: Record<string, any>;
  onShare: () => void;
};

const safeSiteUrl = (listing: Record<string, any>) => {
  const candidate = String(listing.metadata?.site_url || '');
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
};

export function WebsiteDetail({ listing, onShare }: WebsiteDetailProps) {
  const navigate = useNavigate();
  const siteUrl = safeSiteUrl(listing);
  const image = listing.image_url || listing.images?.[0] || '/brand/wersee-social-card.jpg';

  return (
    <main className="min-h-screen bg-[#08080b] px-4 pb-20 pt-28 text-white sm:px-7 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-bold text-white/60 hover:bg-white/5 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <section className="grid overflow-hidden rounded-[36px] border border-white/10 bg-white/[.035] shadow-[0_40px_140px_rgba(0,0,0,.5)] lg:grid-cols-[1.18fr_.82fr]">
          <div className="relative min-h-[420px] overflow-hidden lg:min-h-[680px]">
            <img src={image} alt={`${listing.title} website preview`} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur-xl"><Globe2 className="h-3 w-3" /> Live website</span>
                <p className="mt-3 max-w-xl text-sm text-white/65">Hosted as an immutable Wersee Sites release and opened directly on its secure live address.</p>
              </div>
            </div>
          </div>

          <div className="relative flex flex-col justify-center p-7 md:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.2em] text-fuchsia-300"><Sparkles className="h-3.5 w-3.5" /> Wersee Site Showcase</span>
              <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">{listing.title}</h1>
              <p className="mt-5 text-base leading-7 text-white/55">{listing.description || 'Discover this website, built and published with Wersee Sites.'}</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><ShieldCheck className="h-5 w-5 text-emerald-300" /><p className="mt-3 text-sm font-bold">Validated release</p><p className="mt-1 text-xs text-white/40">Files are checked before going live.</p></div>
                <div className="rounded-2xl border border-white/10 bg-black/25 p-4"><Globe2 className="h-5 w-5 text-indigo-300" /><p className="mt-3 text-sm font-bold">Secure HTTPS</p><p className="mt-1 text-xs text-white/40">Published on a Wersee subdomain.</p></div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {siteUrl ? <motion.a whileHover={{ y: -2 }} href={siteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-black">Visit live website <ArrowUpRight className="h-4 w-4" /></motion.a> : <span className="flex-1 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-5 py-4 text-center text-sm font-bold text-amber-100">Live address unavailable</span>}
                <button onClick={onShare} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-4 text-sm font-bold text-white hover:bg-white/5"><ExternalLink className="h-4 w-4" /> Share</button>
              </div>
              <p className="mt-4 text-center text-xs text-white/30">Free to visit. No marketplace checkout is required.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
