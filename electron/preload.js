/**
 * Wersee Desktop — Electron Preload Script
 * Exposes a minimal, safe API from main process to the renderer (wersee.com).
 */

const { contextBridge, ipcRenderer, webFrame } = require('electron');

contextBridge.exposeInMainWorld('werseeDesktop', {
  // App metadata
  version:  () => ipcRenderer.invoke('get-version'),
  platform: () => ipcRenderer.invoke('get-platform'),
  isDesktop: true,

  // Navigation helper
  navigate: (path) => {
    if (typeof path === 'string' && path.startsWith('/')) {
      ipcRenderer.send('navigate', path);
    }
  },

  // Signal login complete (from onboarding screen)
  loginComplete: () => {
    ipcRenderer.send('navigate', '/');
  },

  // Native notification bridge
  notify: (title, body, url) => {
    if (typeof title !== 'string') return;
    ipcRenderer.send('show-notification', {
      title,
      body: typeof body === 'string' ? body : '',
      url:  typeof url  === 'string' ? url  : undefined,
    });
  },

  // ── Custom window controls (frameless titlebar buttons) ──
  window: {
    minimize:       () => ipcRenderer.send('window:minimize'),
    maximizeToggle: () => ipcRenderer.send('window:maximize-toggle'),
    close:          () => ipcRenderer.send('window:close'),
  },

  // ── PC / Desktop app settings ──────────────────────────────
  settings: {
    get:     (key)        => ipcRenderer.invoke('settings:get', key),
    set:     (key, value) => ipcRenderer.invoke('settings:set', { key, value }),
    getAll:  ()           => ipcRenderer.invoke('settings:getAll'),
  },

  // Sign out: clears session and forces onboarding on next launch
  signOut: () => ipcRenderer.invoke('app:sign-out'),

  // Relaunch the desktop app
  relaunch: () => ipcRenderer.send('app:relaunch'),

  // Quit the app
  quit: () => ipcRenderer.send('app:quit'),
});

// ── Route web `new Notification(...)` calls to native Electron notifications ──
// The web app uses the standard Notification API; on desktop we want those
// to appear as real OS toasts (with Wersee icon, click-to-focus).
webFrame.executeJavaScript(`
  (function() {
    if (window.__werseeNotifPatched) return;
    window.__werseeNotifPatched = true;
    var WD = window.werseeDesktop;
    if (!WD) return;
    function WerseeNotification(title, options) {
      options = options || {};
      try { WD.notify(String(title || 'Wersee'), String(options.body || ''), options.data && options.data.url); } catch(_) {}
      // Return a stub that matches the web Notification shape
      this.title = title; this.body = options.body; this.close = function(){};
      this.addEventListener = function(){}; this.removeEventListener = function(){};
    }
    WerseeNotification.permission = 'granted';
    WerseeNotification.requestPermission = function(cb) {
      if (typeof cb === 'function') cb('granted');
      return Promise.resolve('granted');
    };
    WerseeNotification.maxActions = 2;
    try { window.Notification = WerseeNotification; } catch(_) {}
  })();
`);
