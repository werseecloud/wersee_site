/**
 * Wersee Desktop — Electron Main Process
 * Wraps wersee.com as a native Windows / macOS / Linux app.
 */

const {
  app,
  BrowserWindow,
  BrowserView,
  shell,
  Tray,
  Menu,
  nativeImage,
  Notification,
  ipcMain,
  session,
  protocol,
} = require('electron');
const path  = require('path');
const Store = require('electron-store');

const APP_BASE_URL = 'https://wersee.com';
const APP_START_PATH = process.env.WERSEE_START_PATH || '';
const APP_LANDING_URL = APP_START_PATH.startsWith('http')
  ? APP_START_PATH
  : `${APP_BASE_URL}${APP_START_PATH}`;
const APP_NAME = process.env.WERSEE_APP_NAME || 'Wersee';
const REQUIRE_LOGIN_GATE = process.env.WERSEE_REQUIRE_LOGIN !== 'false';

// ── Persistent settings store ──────────────────────────────────────────────
const store = new Store({
  defaults: {
    windowBounds: { width: 1280, height: 820 },
    windowMaximized: false,
    theme: 'dark',
    hasLoggedIn: !REQUIRE_LOGIN_GATE, // Main app: login first run, App Store variant: open directly
    // Desktop-only preferences (exposed via werseeDesktop.settings)
    launchOnStartup:       false,
    minimizeToTray:        true,
    startMinimized:        false,
    hardwareAcceleration:  true,
    zoomLevel:             1.0,
    notificationsEnabled:  true,
    autoUpdate:            true,
  },
});

// Honour hardware-acceleration preference before app is ready
if (store.get('hardwareAcceleration') === false) {
  try { require('electron').app.disableHardwareAcceleration(); } catch (_) {}
}

// ── Constants ──────────────────────────────────────────────────────────────
const APP_VERSION  = app.getVersion();
const IS_DEV       = process.env.NODE_ENV === 'development';
const ICON_PATH    = path.join(__dirname, 'assets', 'icon.png');

// ── Single-instance lock ───────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

let mainWindow = null;
let tray       = null;
let splashWindow = null;
let onboardingWindow = null;

// ── Splash screen ──────────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 360,
    height: 360,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    center: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: { contextIsolation: true },
  });
  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
}

// ── Onboarding / Login window (first run) ──────────────────────────────────
function createOnboarding() {
  const isMacOnb = process.platform === 'darwin';
  onboardingWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 800,
    minHeight: 560,
    center: true,
    resizable: true,
    backgroundColor: '#0A0A0A',
    icon: ICON_PATH,
    title: 'Welcome to Wersee',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
    },
    titleBarStyle: isMacOnb ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMacOnb ? { x: 14, y: 12 } : undefined,
    titleBarOverlay: isMacOnb ? undefined : {
      color:        '#0A0A0A',
      symbolColor:  '#E5E7EB',
      height:       38,
    },
  });

  onboardingWindow.loadFile(path.join(__dirname, 'onboarding.html'));

  // When user navigates away (successful login redirects to wersee.com)
  onboardingWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('https://wersee.com')) {
      event.preventDefault();
      store.set('hasLoggedIn', true);
      onboardingWindow.close();
      onboardingWindow = null;
      createMainWindow();
    }
  });

  // Listen for IPC navigation from onboarding
  ipcMain.once('navigate-from-onboarding', () => {
    store.set('hasLoggedIn', true);
    if (onboardingWindow && !onboardingWindow.isDestroyed()) {
      onboardingWindow.close();
      onboardingWindow = null;
    }
    createMainWindow();
  });

  if (splashWindow && !splashWindow.isDestroyed()) {
    onboardingWindow.webContents.once('did-finish-load', () => {
      splashWindow.close();
      splashWindow = null;
      onboardingWindow.show();
    });
  }

  onboardingWindow.on('closed', () => {
    onboardingWindow = null;
    // If user closed without logging in, quit the app
    if (!store.get('hasLoggedIn') && !mainWindow) {
      app.quit();
    }
  });
}

// ── Main window ────────────────────────────────────────────────────────────
function createMainWindow() {
  const { width, height } = store.get('windowBounds');

  // ── Custom Wersee titlebar ──────────────────────────────────────────────
  //  - macOS:  hiddenInset (traffic lights inset into our drag region)
  //  - Win/Linux: hidden titlebar + native titleBarOverlay with Wersee dark theme
  const WERSEE_TITLEBAR_HEIGHT = 38;
  const isMac = process.platform === 'darwin';

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth:  800,
    minHeight: 600,
    title:     APP_NAME,
    icon:      ICON_PATH,
    show:      false,
    backgroundColor: '#0A0A0A',
    webPreferences: {
      preload:             path.join(__dirname, 'preload.js'),
      contextIsolation:    true,
      nodeIntegration:     false,
      sandbox:             true,
      webSecurity:         true,
      allowRunningInsecureContent: false,
      // Allow wersee.com to use service workers / PWA features
      enablePreferredSizeMode: true,
    },
    // Frameless on Win/Linux — we render our own buttons inside the web app.
    // macOS keeps hiddenInset so the native traffic lights stay available.
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    trafficLightPosition: isMac ? { x: 14, y: 12 } : undefined,
    frame: !isMac ? false : undefined,
  });

  // Restore maximized state
  if (store.get('windowMaximized')) {
    mainWindow.maximize();
  }

  // ── Content Security Policy ──────────────────────────────────────────────
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        // Allow wersee.com assets; strip any X-Frame-Options that would block embeds
        'X-Frame-Options': [],
      },
    });
  });

  // ── Navigate to wersee.com ────────────────────────────────────────────
  mainWindow.loadURL(APP_LANDING_URL);

  // ── Inject Wersee titlebar brand strip + custom window controls ──────────
  const injectTitlebar = async () => {
    try {
      const css = `
        /* Reserve space for the custom titlebar (flush — no empty strip) */
        html { padding-top: ${WERSEE_TITLEBAR_HEIGHT}px !important; box-sizing: border-box; background: #0A0A0A; }
        body { background: #0A0A0A; }
        /* Tailwind fixed top-0 bars — push below our titlebar so nothing overlaps */
        .fixed.top-0, .sticky.top-0 { top: ${WERSEE_TITLEBAR_HEIGHT}px !important; }

        #wersee-titlebar {
          position: fixed; top: 0; left: 0; right: 0;
          height: ${WERSEE_TITLEBAR_HEIGHT}px;
          background: #0A0A0A;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          display: flex; align-items: center; justify-content: space-between;
          -webkit-app-region: drag;
          user-select: none;
          z-index: 2147483647;
          color: #E5E7EB;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          padding-left: ${isMac ? '88px' : '14px'};
        }
        #wersee-titlebar .wt-brand {
          display: flex; align-items: center; gap: 8px;
          pointer-events: none;
        }
        #wersee-titlebar .wt-logo {
          width: 18px; height: 18px;
          background: linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%);
          border-radius: 5px;
          box-shadow: 0 0 12px rgba(99,102,241,0.45);
        }
        #wersee-titlebar .wt-title {
          font-size: 12px; font-weight: 800; letter-spacing: 0.18em;
          text-transform: uppercase; color: #ffffff;
        }
        #wersee-titlebar .wt-sep {
          width: 1px; height: 14px; background: rgba(255,255,255,0.1); margin: 0 10px;
        }
        #wersee-titlebar .wt-page {
          font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55);
          max-width: 40vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        /* ── Custom window control buttons (Win/Linux only) ── */
        #wersee-titlebar .wt-controls {
          display: ${isMac ? 'none' : 'flex'};
          height: 100%;
          -webkit-app-region: no-drag;
        }
        #wersee-titlebar .wt-btn {
          width: 46px; height: 100%;
          display: flex; align-items: center; justify-content: center;
          background: transparent; border: 0; padding: 0;
          color: rgba(255,255,255,0.75);
          cursor: pointer;
          transition: background 120ms ease, color 120ms ease;
          -webkit-app-region: no-drag;
        }
        #wersee-titlebar .wt-btn:hover { background: rgba(255,255,255,0.07); color: #fff; }
        #wersee-titlebar .wt-btn.wt-close:hover { background: #E81123; color: #fff; }
        #wersee-titlebar .wt-btn svg { width: 12px; height: 12px; }
      `;
      await mainWindow.webContents.insertCSS(css);
      await mainWindow.webContents.executeJavaScript(`
        (function() {
          if (document.getElementById('wersee-titlebar')) return;
          var bar = document.createElement('div');
          bar.id = 'wersee-titlebar';
          bar.innerHTML = [
            '<div class="wt-brand">',
              '<div class="wt-logo"></div>',
              '<span class="wt-title">${APP_NAME}</span>',
              '<span class="wt-sep"></span>',
              '<span class="wt-page" id="wt-page"></span>',
            '</div>',
            '<div class="wt-controls">',
              '<button class="wt-btn wt-min" title="Minimize" aria-label="Minimize">',
                '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1"><line x1="2" y1="6" x2="10" y2="6"/></svg>',
              '</button>',
              '<button class="wt-btn wt-max" title="Maximize" aria-label="Maximize">',
                '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1"><rect x="2.5" y="2.5" width="7" height="7"/></svg>',
              '</button>',
              '<button class="wt-btn wt-close" title="Close" aria-label="Close">',
                '<svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1"><line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/></svg>',
              '</button>',
            '</div>'
          ].join('');
          document.documentElement.appendChild(bar);

          // Wire up control buttons via preload bridge
          var wd = window.werseeDesktop;
          if (wd && wd.window) {
            bar.querySelector('.wt-min').addEventListener('click', function(){ wd.window.minimize(); });
            bar.querySelector('.wt-max').addEventListener('click', function(){ wd.window.maximizeToggle(); });
            bar.querySelector('.wt-close').addEventListener('click', function(){ wd.window.close(); });
          }

          var update = function() {
            var el = document.getElementById('wt-page');
            if (!el) return;
            var t = (document.title || '').replace(/\\s*[—|-]\\s*Wersee\\s*$/i, '').trim();
            el.textContent = t || location.pathname.replace(/^\\//, '') || '';
          };
          update();
          var obs = new MutationObserver(update);
          var titleEl = document.querySelector('title');
          if (titleEl) obs.observe(titleEl, { childList: true });
          window.addEventListener('popstate', update);
          setInterval(update, 1500);
        })();
      `);
    } catch (_) {}
  };

  mainWindow.webContents.on('did-finish-load', injectTitlebar);
  mainWindow.webContents.on('did-navigate-in-page', injectTitlebar);
  mainWindow.webContents.on('did-frame-finish-load', injectTitlebar);

  // ── Show window once page has loaded ────────────────────────────────────
  mainWindow.webContents.once('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
      splashWindow = null;
    }
    try { mainWindow.webContents.setZoomFactor(Number(store.get('zoomLevel')) || 1.0); } catch (_) {}
    if (!store.get('startMinimized')) {
      mainWindow.show();
      if (store.get('windowMaximized')) mainWindow.maximize();
    } else {
      mainWindow.hide();
    }
  });

  // ── Handle load failure (offline) ───────────────────────────────────────
  mainWindow.webContents.on('did-fail-load', (_event, code, desc) => {
    console.warn(`Page failed to load (${code}: ${desc}). Retrying in 3s...`);
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(APP_LANDING_URL);
      }
    }, 3000);
  });

  // ── Open external links in the system browser ────────────────────────────
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow wersee.com URLs to open inside the app; everything else → browser
    if (url.startsWith('https://wersee.com') || url.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // ── Persist window state ─────────────────────────────────────────────────
  mainWindow.on('resize', saveWindowState);
  mainWindow.on('move',   saveWindowState);
  mainWindow.on('maximize',   () => store.set('windowMaximized', true));
  mainWindow.on('unmaximize', () => store.set('windowMaximized', false));

  // ── Minimize to tray on close ────────────────────────────────────────────
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // ── DevTools in dev mode ─────────────────────────────────────────────────
  if (IS_DEV) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  return mainWindow;
}

// ── System Tray ────────────────────────────────────────────────────────────
function createTray() {
  const icon = nativeImage.createFromPath(ICON_PATH).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip(`${APP_NAME} ${APP_VERSION}`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Open ${APP_NAME}`,
      click: () => { mainWindow.show(); mainWindow.focus(); },
    },
    {
      label: 'Go to Workspace',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.loadURL(`${APP_BASE_URL}/workspace`);
      },
    },
    { type: 'separator' },
    {
      label: 'Marketplace',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.loadURL(`${APP_BASE_URL}/search`);
      },
    },
    {
      label: 'Learn',
      click: () => {
        mainWindow.show();
        mainWindow.webContents.loadURL(`${APP_BASE_URL}/learn`);
      },
    },
    { type: 'separator' },
    {
      label: 'Reload',
      click: () => mainWindow.webContents.reload(),
    },
    {
      label: `Version ${APP_VERSION}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `Quit ${APP_NAME}`,
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => { mainWindow.show(); mainWindow.focus(); });
}

// ── Application Menu ───────────────────────────────────────────────────────
function buildAppMenu() {
  const template = [
    {
      label: APP_NAME,
      submenu: [
        { label: `Version ${APP_VERSION}`, enabled: false },
        { type: 'separator' },
        { label: 'Homepage',  click: () => mainWindow.webContents.loadURL(APP_LANDING_URL) },
        { label: 'Workspace', click: () => mainWindow.webContents.loadURL(`${APP_BASE_URL}/workspace`) },
        { label: 'Search',    click: () => mainWindow.webContents.loadURL(`${APP_BASE_URL}/search`) },
        { label: 'Blog',      click: () => mainWindow.webContents.loadURL(`${APP_BASE_URL}/blog`) },
        { type: 'separator' },
        { role: 'quit', label: `Quit ${APP_NAME}` },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { type: 'separator' },
        { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(IS_DEV ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { role: 'close' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Support Center',
          click: () => shell.openExternal('https://wersee.com/support'),
        },
        {
          label: 'Open in Browser',
          click: () => shell.openExternal(APP_LANDING_URL),
        },
        { type: 'separator' },
        {
          label: 'Report a Bug',
          click: () => shell.openExternal('https://wersee.com/support'),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── IPC handlers ───────────────────────────────────────────────────────────
ipcMain.on('navigate', (_event, url) => {
  // If navigating from onboarding, mark as logged in and create main window
  if (!store.get('hasLoggedIn')) {
    store.set('hasLoggedIn', true);
    if (onboardingWindow && !onboardingWindow.isDestroyed()) {
      onboardingWindow.close();
      onboardingWindow = null;
    }
    if (!mainWindow) {
      createMainWindow();
    }
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.loadURL(`${APP_BASE_URL}${url}`);
    });
    return;
  }
  if (mainWindow) mainWindow.webContents.loadURL(`${APP_BASE_URL}${url}`);
});

ipcMain.on('show-notification', (_event, { title, body, url }) => {
  if (!store.get('notificationsEnabled')) return;
  if (!Notification.isSupported()) return;
  const n = new Notification({
    title: title || APP_NAME,
    body:  body  || '',
    icon:  ICON_PATH,
    silent: false,
  });
  n.on('click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
      if (typeof url === 'string' && url.length) {
        mainWindow.webContents.loadURL(url.startsWith('http') ? url : `${APP_BASE_URL}${url}`);
      }
    }
  });
  n.show();
});

// ── Window control IPC (custom titlebar buttons) ──────────────────────────
ipcMain.on('window:minimize', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});
ipcMain.on('window:maximize-toggle', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('window:close', () => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  // Minimize-to-tray behaviour (consistent with the `close` handler)
  if (store.get('minimizeToTray')) {
    mainWindow.hide();
  } else {
    app.isQuitting = true;
    app.quit();
  }
});

ipcMain.handle('get-version', () => APP_VERSION);
ipcMain.handle('get-platform', () => process.platform);

// ── Desktop settings IPC ──────────────────────────────────────────────────
const DESKTOP_SETTING_KEYS = new Set([
  'launchOnStartup',
  'minimizeToTray',
  'startMinimized',
  'hardwareAcceleration',
  'zoomLevel',
  'notificationsEnabled',
  'autoUpdate',
  'theme',
]);

ipcMain.handle('settings:get', (_e, key) => {
  if (!DESKTOP_SETTING_KEYS.has(key)) return null;
  return store.get(key);
});

ipcMain.handle('settings:getAll', () => {
  const out = {};
  DESKTOP_SETTING_KEYS.forEach((k) => { out[k] = store.get(k); });
  return out;
});

ipcMain.handle('settings:set', (_e, { key, value }) => {
  if (!DESKTOP_SETTING_KEYS.has(key)) return { ok: false, error: 'Unknown setting' };
  store.set(key, value);

  // Side-effects for certain keys that affect the running app
  try {
    if (key === 'launchOnStartup') {
      app.setLoginItemSettings({
        openAtLogin: !!value,
        openAsHidden: !!store.get('startMinimized'),
      });
    }
    if (key === 'startMinimized') {
      app.setLoginItemSettings({
        openAtLogin: !!store.get('launchOnStartup'),
        openAsHidden: !!value,
      });
    }
    if (key === 'zoomLevel' && mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.setZoomFactor(Number(value) || 1.0);
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }

  return { ok: true };
});

ipcMain.handle('app:sign-out', async () => {
  store.set('hasLoggedIn', false);
  try {
    await session.defaultSession.clearStorageData({
      storages: ['cookies', 'localstorage', 'indexdb', 'serviceworkers', 'cachestorage'],
    });
  } catch (_) {}
  app.relaunch();
  app.exit(0);
});

ipcMain.on('app:relaunch', () => {
  app.relaunch();
  app.exit(0);
});

ipcMain.on('app:quit', () => {
  app.isQuitting = true;
  app.quit();
});

// ── Deep-link protocol (wersee://) ────────────────────────────────────────
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('wersee', process.execPath, [process.argv[1]]);
  }
} else {
  app.setAsDefaultProtocolClient('wersee');
}

function handleDeepLink(url) {
  // wersee://workspace  →  https://wersee.com/workspace
  const path = url.replace('wersee://', '/');
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
    mainWindow.webContents.loadURL(`${APP_BASE_URL}${path}`);
  }
}

app.on('open-url', (_event, url) => handleDeepLink(url)); // macOS

// ── Second instance (Windows deep-link) ───────────────────────────────────
app.on('second-instance', (_event, argv) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  // Extract deep link from argv on Windows
  const deepLink = argv.find(a => a.startsWith('wersee://'));
  if (deepLink) handleDeepLink(deepLink);
});

// ── Persist window state helper ────────────────────────────────────────────
function saveWindowState() {
  if (!mainWindow || mainWindow.isMaximized()) return;
  store.set('windowBounds', mainWindow.getBounds());
}

// ── App lifecycle ──────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Block third-party navigation away from wersee.com
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (e, url) => {
      if (!url.startsWith('https://wersee.com') && !url.startsWith('http://localhost')) {
        e.preventDefault();
        shell.openExternal(url);
      }
    });
  });

  createSplash();
  createTray();
  buildAppMenu();

  const hasLoggedIn = store.get('hasLoggedIn');
  if (!hasLoggedIn) {
    // First run: show onboarding login screen
    createOnboarding();
  } else {
    createMainWindow();
  }
});

app.on('window-all-closed', () => {
  // On macOS, keep the process alive even when all windows are closed (tray behaviour).
  if (process.platform !== 'darwin') {
    // We hide instead of quitting; actual quit is via tray menu.
  }
});

app.on('activate', () => {
  // macOS: re-open window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
