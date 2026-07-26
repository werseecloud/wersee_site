type ViewerFile = {
  original_filename: string;
  detected_mime_type: string;
  original_size: number | string;
  sha256: string;
};

export const shouldRenderCdnViewer = (
  accept: string | undefined,
  mimeType: string,
  forceRaw: boolean,
) => !forceRaw && mimeType.startsWith('image/') && Boolean(accept?.toLowerCase().includes('text/html'));

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const safeJson = (value: unknown) => JSON.stringify(value)
  .replaceAll('<', '\\u003c')
  .replaceAll('>', '\\u003e')
  .replaceAll('&', '\\u0026');

const formatBytes = (value: number | string) => {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return 'Unknown size';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let amount = bytes / 1024;
  let unit = units[0];
  for (let index = 1; index < units.length && amount >= 1024; index += 1) {
    amount /= 1024;
    unit = units[index];
  }
  return `${amount >= 10 ? amount.toFixed(1) : amount.toFixed(2)} ${unit}`;
};

export const renderCdnViewer = (
  fileId: string,
  file: ViewerFile,
  nonce: string,
) => {
  const encodedId = encodeURIComponent(fileId);
  const viewerUrl = `https://api.wersee.com/cdn/${encodedId}`;
  const rawUrl = `${viewerUrl}/raw`;
  const filename = escapeHtml(file.original_filename);
  const mimeType = escapeHtml(file.detected_mime_type || 'image/*');
  const size = escapeHtml(formatBytes(file.original_size));
  const hash = escapeHtml(file.sha256);
  const clientData = safeJson({
    filename: file.original_filename,
    viewerUrl,
    rawUrl,
  });
  const favicon = 'data:image/svg+xml,'
    + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse"><stop stop-color="#6e5cff"/><stop offset=".52" stop-color="#2d46e8"/><stop offset="1" stop-color="#b21df2"/></linearGradient></defs><rect width="64" height="64" rx="17" fill="#090b24"/><path d="M7 35C8 15 20 3 38 5c15 2 24 14 20 29-4 17-22 29-39 21C10 51 6 44 7 35Z" fill="url(#g)"/><path d="m15 23 11 22 7-15 7 15 10-22" fill="none" stroke="white" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="51" cy="17" r="4" fill="white"/></svg>');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#f5f5f7">
  <meta name="color-scheme" content="light dark">
  <title>${filename} - Wersee CDN</title>
  <meta name="description" content="View ${filename} securely through Wersee CDN.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${filename}">
  <meta property="og:description" content="${size} · ${mimeType} · Wersee CDN">
  <meta property="og:image" content="${rawUrl}">
  <meta property="og:url" content="${viewerUrl}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:image" content="${rawUrl}">
  <link rel="icon" type="image/svg+xml" href="${favicon}">
  <link rel="canonical" href="${viewerUrl}">
  <link rel="preload" as="image" href="${rawUrl}">
  <style nonce="${nonce}">
    :root{font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","SF Pro Text",Inter,Segoe UI,sans-serif;color:#1d1d1f;background:#f5f5f7;font-synthesis:none}
    *{box-sizing:border-box}html,body{min-height:100%;margin:0}body{overflow-x:hidden;background:#f5f5f7}
    button,a{font:inherit}.ambient{position:fixed;inset:-80px;width:calc(100% + 160px);height:calc(100% + 160px);object-fit:cover;filter:blur(64px) saturate(1.28);opacity:.18;transform:scale(1.08);pointer-events:none}
    .veil{position:fixed;inset:0;background:linear-gradient(145deg,rgba(255,255,255,.82),rgba(245,245,247,.74) 52%,rgba(236,240,247,.82));backdrop-filter:blur(28px);pointer-events:none}
    .shell{position:relative;z-index:1;min-height:100svh;padding:max(18px,env(safe-area-inset-top)) max(18px,env(safe-area-inset-right)) max(24px,env(safe-area-inset-bottom)) max(18px,env(safe-area-inset-left));display:flex;flex-direction:column}
    .topbar{width:min(1380px,100%);margin:0 auto 18px;display:flex;align-items:center;justify-content:space-between;gap:16px}
    .brand{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:650;letter-spacing:-.01em}.mark{width:30px;height:30px;border-radius:9px;background:#111;color:#fff;display:grid;place-items:center;box-shadow:0 5px 18px rgba(0,0,0,.18)}.mark svg{width:17px}
    .status{display:flex;align-items:center;gap:7px;padding:7px 11px;border:1px solid rgba(0,0,0,.08);border-radius:999px;background:rgba(255,255,255,.62);box-shadow:0 8px 30px rgba(20,30,50,.06);font-size:12px;color:#515154}.dot{width:7px;height:7px;border-radius:50%;background:#30d158;box-shadow:0 0 0 4px rgba(48,209,88,.13)}
    .card{width:min(1380px,100%);margin:auto;display:grid;grid-template-columns:minmax(0,1fr) 310px;min-height:min(810px,calc(100svh - 116px));border:1px solid rgba(255,255,255,.68);border-radius:30px;background:rgba(255,255,255,.66);box-shadow:0 34px 90px rgba(27,39,66,.16),inset 0 1px 0 rgba(255,255,255,.9);backdrop-filter:blur(30px) saturate(1.3);overflow:hidden}
    .stage{position:relative;display:grid;place-items:center;min-height:500px;padding:28px;background:radial-gradient(circle at 50% 45%,rgba(255,255,255,.9),rgba(244,246,250,.58) 62%,rgba(232,236,244,.7));overflow:hidden}
    .photo{display:block;max-width:100%;max-height:calc(100svh - 178px);width:auto;height:auto;object-fit:contain;border-radius:18px;box-shadow:0 26px 70px rgba(13,23,45,.22),0 2px 8px rgba(13,23,45,.08);background:#fff;opacity:0;transform:scale(.992);transition:opacity .42s ease,transform .55s cubic-bezier(.2,.8,.2,1)}
    .photo.loaded{opacity:1;transform:scale(1)}.loader{position:absolute;width:34px;height:34px;border:3px solid rgba(0,0,0,.1);border-top-color:#0071e3;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}.loaded+.loader{display:none}
    .panel{padding:30px 26px 24px;border-left:1px solid rgba(0,0,0,.07);display:flex;flex-direction:column;background:rgba(248,249,251,.58)}
    .eyebrow{margin:0 0 8px;color:#6e6e73;font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.08em}.title{margin:0;font-size:23px;line-height:1.14;letter-spacing:-.035em;overflow-wrap:anywhere}.sub{margin:10px 0 0;color:#6e6e73;font-size:13px;line-height:1.5}
    .meta{margin:24px 0;display:grid;gap:9px}.meta-row{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:11px 0;border-bottom:1px solid rgba(0,0,0,.065);font-size:13px}.meta-row span:first-child{color:#86868b}.meta-row span:last-child{text-align:right;font-weight:570;max-width:170px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .actions{display:grid;gap:10px;margin-top:auto}.button{min-height:46px;border:0;border-radius:14px;padding:0 16px;display:flex;align-items:center;justify-content:center;gap:9px;text-decoration:none;cursor:pointer;font-weight:620;font-size:14px;transition:transform .16s ease,filter .16s ease,background .16s ease}.button:hover{transform:translateY(-1px);filter:brightness(.98)}.button:active{transform:scale(.985)}.primary{color:#fff;background:#0071e3;box-shadow:0 10px 24px rgba(0,113,227,.2)}.secondary{color:#1d1d1f;background:rgba(0,0,0,.055)}.button svg{width:17px;height:17px}
    .notice{height:22px;margin:12px 0 0;text-align:center;color:#6e6e73;font-size:12px;opacity:0;transition:opacity .2s}.notice.show{opacity:1}.hash{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}
    @media(max-width:850px){.card{grid-template-columns:1fr;min-height:0}.stage{min-height:55svh;padding:16px}.photo{max-height:62svh;border-radius:14px}.panel{border-left:0;border-top:1px solid rgba(0,0,0,.07);padding:24px 20px 18px}.actions{grid-template-columns:1fr 1fr}.primary{grid-column:1/-1}.topbar{margin-bottom:12px}}
    @media(max-width:520px){.shell{padding-left:10px;padding-right:10px}.card{border-radius:24px}.status{display:none}.stage{min-height:52svh}.actions{grid-template-columns:1fr}.primary{grid-column:auto}.title{font-size:21px}}
    @media(prefers-color-scheme:dark){:root,body{color:#f5f5f7;background:#090a0c}.veil{background:linear-gradient(145deg,rgba(8,9,11,.88),rgba(14,16,20,.78) 52%,rgba(8,10,14,.9))}.ambient{opacity:.26}.status{color:#c7c7cc;background:rgba(34,36,42,.62);border-color:rgba(255,255,255,.09)}.card{background:rgba(24,26,31,.72);border-color:rgba(255,255,255,.11);box-shadow:0 36px 100px rgba(0,0,0,.54),inset 0 1px 0 rgba(255,255,255,.08)}.stage{background:radial-gradient(circle at 50% 45%,rgba(55,58,66,.82),rgba(24,26,31,.62) 62%,rgba(11,13,17,.78))}.panel{background:rgba(20,22,27,.62);border-color:rgba(255,255,255,.08)}.eyebrow,.sub,.meta-row span:first-child,.notice{color:#a1a1a6}.meta-row{border-color:rgba(255,255,255,.08)}.secondary{color:#f5f5f7;background:rgba(255,255,255,.09)}}
    @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important}}
  </style>
</head>
<body>
  <img class="ambient" src="${rawUrl}" alt="" aria-hidden="true">
  <div class="veil"></div>
  <div class="shell">
    <header class="topbar">
      <div class="brand">
        <span class="mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 5.5 12 3l8 2.5v6.3c0 4.7-3.2 7.8-8 9.2-4.8-1.4-8-4.5-8-9.2V5.5Z" fill="currentColor"/><path d="m8.2 12 2.3 2.3 5.3-5.4" stroke="#111" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span>Wersee CDN</span>
      </div>
      <div class="status"><span class="dot"></span>Securely delivered via STRATO</div>
    </header>
    <main class="card">
      <section class="stage" id="stage">
        <img class="photo" id="photo" src="${rawUrl}" alt="${filename}">
        <span class="loader" aria-label="Loading image"></span>
      </section>
      <aside class="panel">
        <p class="eyebrow">Image</p>
        <h1 class="title">${filename}</h1>
        <p class="sub">Original quality, losslessly verified and delivered directly from Wersee Storage.</p>
        <div class="meta">
          <div class="meta-row"><span>Format</span><span>${mimeType}</span></div>
          <div class="meta-row"><span>Size</span><span>${size}</span></div>
          <div class="meta-row"><span>Integrity</span><span>SHA-256 verified</span></div>
          <div class="meta-row"><span>Checksum</span><span class="hash" title="${hash}">${hash.slice(0, 12)}…</span></div>
        </div>
        <div class="actions">
          <a class="button primary" href="${rawUrl}?download=1" download="${filename}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14"/></svg>Download original
          </a>
          <button class="button secondary" id="share" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.5 6.8-4m-6.8 7 6.8 4"/></svg>Share
          </button>
          <button class="button secondary" id="fullscreen" type="button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5m13-5h5v5M8 21H3v-5m13 5h5v-5"/></svg>Full screen
          </button>
        </div>
        <p class="notice" id="notice" role="status"></p>
      </aside>
    </main>
  </div>
  <script nonce="${nonce}">
    const data=${clientData};
    const photo=document.getElementById('photo');
    const notice=document.getElementById('notice');
    const showNotice=(message)=>{notice.textContent=message;notice.classList.add('show');window.setTimeout(()=>notice.classList.remove('show'),2200)};
    if(photo.complete)photo.classList.add('loaded');else photo.addEventListener('load',()=>photo.classList.add('loaded'),{once:true});
    document.getElementById('share').addEventListener('click',async()=>{
      try{
        if(navigator.share)await navigator.share({title:data.filename,url:data.viewerUrl});
        else{await navigator.clipboard.writeText(data.viewerUrl);showNotice('Link copied');}
      }catch(error){if(error?.name!=='AbortError')showNotice('Sharing is unavailable');}
    });
    document.getElementById('fullscreen').addEventListener('click',async()=>{
      try{if(!document.fullscreenElement)await document.getElementById('stage').requestFullscreen();else await document.exitFullscreen();}
      catch{showNotice('Full screen is unavailable');}
    });
  </script>
</body>
</html>`;
};
