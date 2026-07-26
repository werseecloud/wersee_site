import { BookOpen, Check, Copy, Download, ExternalLink, Image, Lightbulb, Play, Send, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { creatorReferralUrl } from '../../lib/creatorGrowth';

const assets = [
  { name: 'Landscape campaign', format: '16:9 · posts, thumbnails and email', src: '/creator-kit/wersee-creator-landscape.png' },
  { name: 'Square campaign', format: '1:1 · Instagram and LinkedIn', src: '/creator-kit/wersee-creator-square.png' },
  { name: 'Story campaign', format: '9:16 · Reels, TikTok and Stories', src: '/creator-kit/wersee-creator-story.png' },
];

const CopyButton = ({ value, label = 'Copy' }: { value: string; label?: string }) => (
  <button onClick={async () => { await navigator.clipboard.writeText(value); toast.success(`${label} copied`); }} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60 transition hover:border-white/25 hover:text-white">
    <Copy className="h-3.5 w-3.5" /> {label}
  </button>
);

export default function CreatorDocsPanel({ creator, links }: any) {
  const primary = links.find((link: any) => link.is_primary) || links[0];
  const referralUrl = primary ? creatorReferralUrl(creator.username, primary.slug) : creatorReferralUrl(creator.username);
  const setupUrl = `${window.location.origin}/creators`;
  const welcomeMessage = `You're invited to Wersee Creators. Set up your creator profile, tracked link and payouts here: ${setupUrl}\n\nAfter setup, open Creator Docs for ready-made scripts, high-CTR guidance and Wersee campaign images.`;
  const scripts = [
    {
      label: 'Short-form video',
      title: 'Curiosity → proof → action',
      text: `I found a smarter way to discover products, creators and tools without jumping between ten platforms. I’m trying Wersee and this is what stood out: [show one real result]. Explore it here: ${referralUrl}`,
    },
    {
      label: 'Story / Reel',
      title: 'Three-frame story',
      text: `Frame 1: “Why does finding the right creator tool still take this long?”\nFrame 2: Show one Wersee flow or result — keep it specific.\nFrame 3: “I put my tracked Wersee link here → ${referralUrl}”`,
    },
    {
      label: 'Caption',
      title: 'Honest recommendation',
      text: `I only share platforms I would actually use. Wersee brings products, creators and business tools into one place. Take a look through my link: ${referralUrl}\n\nAffiliate link — I may earn a commission at no extra cost to you.`,
    },
    {
      label: 'Email / community',
      title: 'Warm introduction',
      text: `Quick recommendation: I’ve started using Wersee to bring discovery, creator profiles and useful business tools together. If you want to explore it, this is my personal link: ${referralUrl}\n\nTell me what you think — I’m collecting honest feedback.`,
    },
  ];

  return <div className="space-y-8">
    <section className="relative min-h-[380px] overflow-hidden rounded-[34px] border border-white/[.08]">
      <img src="/creator-kit/wersee-creator-landscape.png" alt="Wersee creator recording content in a studio" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/15" />
      <div className="relative z-10 flex min-h-[380px] max-w-2xl flex-col justify-end p-7 sm:p-10">
        <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[.25em] text-orange-300"><BookOpen className="h-4 w-4" /> Creator Docs</p>
        <h1 className="text-4xl font-semibold tracking-[-.05em] sm:text-6xl">Everything you need to publish.</h1>
        <p className="mt-5 max-w-xl leading-7 text-white/55">Your personal link, Wersee-ready visuals, proven content structures and honest disclosure guidance — all inside your Creator workspace.</p>
      </div>
    </section>

    <section className="grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-[28px] border border-orange-300/20 bg-orange-300/[.055] p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Wersee outreach pack</p><h2 className="mt-3 text-2xl font-semibold">Send this to a new creator</h2></div><Send className="h-5 w-5 text-orange-300" /></div>
        <p className="mt-5 whitespace-pre-line text-sm leading-7 text-white/55">{welcomeMessage}</p>
        <div className="mt-6 flex flex-wrap gap-2"><CopyButton value={welcomeMessage} label="Welcome message" /><button onClick={() => navigator.share?.({ title: 'Join Wersee Creators', text: welcomeMessage, url: setupUrl })} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-black"><Send className="h-3.5 w-3.5" /> Share setup</button></div>
      </div>
      <div className="rounded-[28px] border border-white/[.07] bg-white/[.03] p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-white/30">Your tracked link</p><p className="mt-5 break-all font-mono text-sm leading-6 text-white/70">{referralUrl}</p>
        <div className="mt-6 flex flex-wrap gap-2"><CopyButton value={referralUrl} label="Personal link" /><a href={referralUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white/60"><ExternalLink className="h-3.5 w-3.5" /> Test link</a></div>
      </div>
    </section>

    <section>
      <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Start here</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Creator launch checklist</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">{[
        ['1', 'Complete profile', 'Add a recognisable photo, one-line promise and your main platform.'],
        ['2', 'Choose one offer', 'Send people to one useful Wersee destination, not a generic list.'],
        ['3', 'Make it native', 'Film in your normal style and show the product before explaining it.'],
        ['4', 'Use your link', 'Always paste the tracked link from this workspace. Never rebuild it.'],
        ['5', 'Learn and repeat', 'Check unique clicks and purchases after 24–72 hours, then improve the hook.'],
      ].map(([step, title, body]) => <article key={step} className="rounded-[24px] border border-white/[.07] bg-white/[.03] p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-black text-black">{step}</span><h3 className="mt-5 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/35">{body}</p></article>)}</div>
    </section>

    <section className="rounded-[32px] border border-white/[.07] bg-white/[.025] p-6 sm:p-8">
      <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">High-CTR playbook</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Earn the click. Don’t beg for it.</h2></div><Lightbulb className="h-6 w-6 text-orange-300" /></div>
      <div className="grid gap-4 lg:grid-cols-4">{[
        ['0–2 sec', 'Hook', 'Open with a specific problem, surprising result or strong opinion. Skip introductions.'],
        ['3–10 sec', 'Proof', 'Show the screen, item or outcome. Concrete evidence beats broad claims.'],
        ['11–20 sec', 'Payoff', 'Explain who it helps and the one reason it is worth trying.'],
        ['Final 3 sec', 'CTA', 'Say exactly where the link is and what they will get after clicking.'],
      ].map(([time, title, body]) => <div key={title} className="rounded-[22px] border border-white/[.07] p-5"><p className="text-[10px] font-bold uppercase tracking-widest text-orange-300">{time}</p><h3 className="mt-3 text-lg font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/40">{body}</p></div>)}</div>
      <div className="mt-5 grid gap-3 md:grid-cols-3"><p className="rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4" /> One idea, one audience, one CTA</p><p className="rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4" /> Show the result before features</p><p className="rounded-2xl bg-emerald-400/10 p-4 text-sm text-emerald-200"><Check className="mr-2 inline h-4 w-4" /> Test hooks, not just thumbnails</p></div>
    </section>

    <section>
      <div className="mb-5 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Copy library</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Ready-made starting points</h2></div><Play className="hidden h-6 w-6 text-white/20 sm:block" /></div>
      <div className="grid gap-4 lg:grid-cols-2">{scripts.map((script) => <article key={script.title} className="rounded-[26px] border border-white/[.07] bg-white/[.03] p-6"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-orange-300">{script.label}</p><h3 className="mt-3 text-xl font-semibold">{script.title}</h3><p className="mt-4 whitespace-pre-line text-sm leading-7 text-white/48">{script.text}</p><div className="mt-5"><CopyButton value={script.text} label="Script" /></div></article>)}</div>
    </section>

    <section>
      <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[.22em] text-orange-300">Wersee media kit</p><h2 className="mt-2 text-3xl font-semibold tracking-[-.04em]">Download and make it yours</h2><p className="mt-2 text-sm text-white/35">Add your own hook, subtitles and tracked link in the platform editor. Do not cover faces or key product areas.</p></div>
      <div className="grid gap-4 lg:grid-cols-3">{assets.map((asset) => <article key={asset.src} className="group overflow-hidden rounded-[26px] border border-white/[.07] bg-white/[.03]"><div className="aspect-[4/3] overflow-hidden"><img src={asset.src} alt={asset.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" /></div><div className="flex items-center justify-between gap-3 p-5"><div><h3 className="font-semibold">{asset.name}</h3><p className="mt-1 text-xs text-white/30">{asset.format}</p></div><a href={asset.src} download className="rounded-full bg-white p-3 text-black" aria-label={`Download ${asset.name}`}><Download className="h-4 w-4" /></a></div></article>)}</div>
    </section>

    <section className="grid gap-4 md:grid-cols-2">
      <div className="rounded-[26px] border border-white/[.07] bg-white/[.03] p-6"><ShieldCheck className="h-5 w-5 text-emerald-300" /><h2 className="mt-5 text-xl font-semibold">Be clear about affiliate links</h2><p className="mt-3 text-sm leading-7 text-white/40">Use a visible, plain-language disclosure near the recommendation. A good default is: “Affiliate link — I may earn a commission at no extra cost to you.” Never hide it behind hashtags or vague wording.</p></div>
      <div className="rounded-[26px] border border-white/[.07] bg-white/[.03] p-6"><Sparkles className="h-5 w-5 text-orange-300" /><h2 className="mt-5 text-xl font-semibold">What usually wins</h2><p className="mt-3 text-sm leading-7 text-white/40">Specific demos, personal context and one honest limitation build more trust than polished superlatives. High CTR matters, but qualified clicks and real purchases matter more.</p></div>
    </section>
  </div>;
}
