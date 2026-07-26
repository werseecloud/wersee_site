(function() {
  const script = document.currentScript;
  const configId = script.getAttribute('data-config-id');
  const theme = script.getAttribute('data-theme') || 'dark';
  const color = script.getAttribute('data-color') || '#6366f1';
  const position = script.getAttribute('data-position') || 'bottom-right';

  if (!configId) {
    console.error('Wersee Embed: data-config-id is required');
    return;
  }

  // Create styles
  const styles = `
    .wersee-book-btn {
      position: fixed;
      z-index: 999999;
      padding: 12px 24px;
      background: ${color};
      color: white;
      border: none;
      border-radius: 100px;
      font-family: system-ui, -apple-system, sans-serif;
      font-weight: 800;
      font-style: italic;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      cursor: pointer;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      items-center: center;
      gap: 8px;
    }
    .wersee-book-btn:hover {
      transform: translateY(-2px) scale(1.05);
      box-shadow: 0 20px 35px -5px rgba(0,0,0,0.4);
    }
    .wersee-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      z-index: 9999999;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 20px;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .wersee-modal-container {
      width: 100%;
      max-width: 900px;
      height: 80vh;
      background: #050505;
      border-radius: 32px;
      border: 1px solid rgba(255,255,255,0.1);
      overflow: hidden;
      position: relative;
      transform: scale(0.95);
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .wersee-modal-overlay.active {
      display: flex;
      opacity: 1;
    }
    .wersee-modal-overlay.active .wersee-modal-container {
      transform: scale(1);
    }
    .wersee-close-btn {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }
    .wersee-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    .wersee-pos-bottom-right { bottom: 30px; right: 30px; }
    .wersee-pos-bottom-left { bottom: 30px; left: 30px; }
    .wersee-pos-top-right { top: 30px; right: 30px; }
    .wersee-pos-top-left { top: 30px; left: 30px; }
  `;

  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);

  // Create Button
  const btn = document.createElement('button');
  btn.className = `wersee-book-btn wersee-pos-${position}`;
  btn.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
    Book a Call
  `;
  document.body.appendChild(btn);

  // Create Modal
  const overlay = document.createElement('div');
  overlay.className = 'wersee-modal-overlay';
  overlay.innerHTML = `
    <div class="wersee-modal-container">
      <button class="wersee-close-btn">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>
      <iframe class="wersee-iframe" src="${window.location.origin}/book/${configId}?embed=true"></iframe>
    </div>
  `;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.wersee-close-btn');

  btn.onclick = () => {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  closeBtn.onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
})();
