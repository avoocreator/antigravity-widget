'use strict';
// Proses utama Electron. Sengaja CommonJS polos (tanpa langkah build) supaya
// preload/main tidak bergantung pada plugin bundler. Hanya UI (src/) yang dibuild Vite.

const { app, BrowserWindow, Menu, Tray, nativeImage, screen, shell, ipcMain, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { spawn, execFile } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const WIDTH = 420; // lebar window = panel 400 + padding 10 kiri/kanan
const PAD = 10;
const EDGE_GAP = 14; // jarak panel ke tepi layar
const WALLPAPER_REFRESH_MS = 30_000;

app.setAppUserModelId('com.avoocreator.antigravity-widget');

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

let win = null;
let tray = null;
let quitting = false;
let settings = {};
let saveTimer = null;

// ---------------------------------------------------------------- settings

const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) || {};
  } catch {
    return {};
  }
}

function saveSettings(patch) {
  Object.assign(settings, patch);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
      fs.writeFileSync(settingsFile(), JSON.stringify(settings));
    } catch (e) {
      console.error('[settings]', e);
    }
  }, 250);
}

// ---------------------------------------------------------------- posisi window

function defaultBounds() {
  const wa = screen.getPrimaryDisplay().workArea;
  const off = EDGE_GAP - PAD;
  const height = Math.min(900, wa.height - 2 * off);
  return { x: wa.x + wa.width - WIDTH - off, y: wa.y + Math.round((wa.height - height) / 2), width: WIDTH, height };
}

function initialBounds() {
  const d = defaultBounds();
  const s = settings.bounds;
  if (!s || typeof s.x !== 'number' || typeof s.y !== 'number') return d;
  const rect = { x: s.x, y: s.y, width: WIDTH, height: d.height };
  // pakai posisi tersimpan hanya kalau masih terlihat di salah satu monitor
  const visible = screen.getAllDisplays().some((disp) => {
    const a = disp.workArea;
    const w = Math.min(rect.x + rect.width, a.x + a.width) - Math.max(rect.x, a.x);
    const h = Math.min(rect.y + rect.height, a.y + a.height) - Math.max(rect.y, a.y);
    return w > 160 && h > 160;
  });
  return visible ? rect : d;
}

function resetPosition() {
  if (!win) return;
  const d = defaultBounds();
  win.setBounds(d);
  saveSettings({ bounds: { x: d.x, y: d.y } });
  sendGeom();
}

// ---------------------------------------------------------------- wallpaper -> kaca buram

let backdrop = { dataUrl: null, file: null, mtime: 0 };

function execFileP(cmd, args, opts) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout) => (err ? reject(err) : resolve(String(stdout))));
  });
}

async function findWallpaperFile() {
  if (process.platform !== 'win32') return null;
  const candidates = [];
  // TranscodedWallpaper = gambar yang benar-benar tampil (sudah mengikuti fit / slideshow)
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Themes', 'TranscodedWallpaper'));
  }
  try {
    const out = await execFileP('reg', ['query', 'HKCU\\Control Panel\\Desktop', '/v', 'WallPaper'], {
      windowsHide: true,
      timeout: 4000,
    });
    const m = /WallPaper\s+REG_SZ\s+(.+?)\s*$/im.exec(out);
    if (m && m[1]) candidates.push(m[1].trim());
  } catch {
    /* abaikan */
  }
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      /* coba kandidat berikutnya */
    }
  }
  return null;
}

async function refreshBackdrop(force) {
  try {
    const file = await findWallpaperFile();
    if (!file) {
      if (backdrop.dataUrl) {
        backdrop = { dataUrl: null, file: null, mtime: 0 };
        send('backdrop', null);
      }
      return;
    }
    const mtime = fs.statSync(file).mtimeMs;
    if (!force && file === backdrop.file && mtime === backdrop.mtime) return;
    const img = nativeImage.createFromBuffer(fs.readFileSync(file));
    if (img.isEmpty()) return;
    // Cukup kecil: gambar ini akan di-blur 36px, detail tidak penting.
    const small = img.resize({ width: 1280, quality: 'good' });
    const dataUrl = 'data:image/jpeg;base64,' + small.toJPEG(70).toString('base64');
    backdrop = { dataUrl, file, mtime };
    send('backdrop', dataUrl);
  } catch (e) {
    console.error('[wallpaper]', e);
  }
}

function geom() {
  if (!win) return null;
  const b = win.getBounds();
  const d = screen.getDisplayMatching(b);
  return { dw: d.bounds.width, dh: d.bounds.height, ox: b.x - d.bounds.x, oy: b.y - d.bounds.y };
}

function sendGeom() {
  const g = geom();
  if (g) send('geom', g);
}

// ---------------------------------------------------------------- pembaca data Antigravity

let reader = null;
let lastPayload = null;
let readerFails = 0;
let restartTimer = null;

function readerScript() {
  const p = path.join(__dirname, 'reader.mjs');
  return p.replace(`app.asar${path.sep}`, `app.asar.unpacked${path.sep}`);
}

function publish(payload) {
  lastPayload = payload;
  send('data', payload);
}

function scheduleRestart() {
  if (quitting || restartTimer) return;
  const delay = Math.min(30_000, 2000 * 2 ** Math.min(readerFails, 4));
  readerFails++;
  restartTimer = setTimeout(() => {
    restartTimer = null;
    startReader();
  }, delay);
}

function startReader() {
  if (reader || quitting) return;
  const nodeBin = process.env.ANTIGRAVITY_WIDGET_NODE || 'node';
  let buf = '';
  const child = spawn(nodeBin, ['--no-warnings', readerScript(), '--watch'], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  reader = child;

  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (chunk) => {
    buf += chunk;
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      try {
        const payload = JSON.parse(line);
        if (payload.type === 'data') readerFails = 0;
        publish(payload);
      } catch (e) {
        console.error('[reader] baris tidak valid', e);
      }
    }
  });
  child.stderr.setEncoding('utf8');
  child.stderr.on('data', (d) => console.error('[reader]', String(d).trim()));
  child.on('error', (err) => {
    reader = null;
    publish({
      type: 'error',
      code: err.code === 'ENOENT' ? 'NO_NODE' : 'SPAWN',
      message: err.code === 'ENOENT' ? 'Node.js tidak ditemukan di PATH.' : String(err.message),
    });
    scheduleRestart();
  });
  child.on('exit', () => {
    if (reader === child) reader = null;
    scheduleRestart();
  });
}

// ---------------------------------------------------------------- window

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

function createWindow() {
  const b = initialBounds();
  win = new BrowserWindow({
    ...b,
    title: 'Antigravity Widget',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true, // tidak muncul di taskbar
    show: false, // muncul tanpa mencuri fokus, lihat ready-to-show
    alwaysOnTop: !!settings.alwaysOnTop,
    icon: path.join(ROOT, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });
  win.setMenuBarVisibility(false);

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());

  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(ROOT, 'dist', 'index.html')).catch(() => {
      const html =
        '<body style="font:14px Segoe UI;color:#fff;background:#222;padding:24px">' +
        'Folder <b>dist</b> belum ada.<br>Jalankan <code>npm run build</code> lalu buka ulang widget.</body>';
      win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    });
  }

  win.once('ready-to-show', () => {
    win.show();
    win.focus();
    refreshBackdrop(true);
  });

  // Tutup = sembunyikan ke tray. Keluar sungguhan lewat menu tray.
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
  });

  let moveTimer = null;
  win.on('move', () => {
    sendGeom();
    clearTimeout(moveTimer);
    moveTimer = setTimeout(() => {
      if (!win || win.isDestroyed()) return;
      const [x, y] = win.getPosition();
      saveSettings({ bounds: { x, y } });
    }, 400);
  });
  win.on('show', () => {
    sendGeom();
    refreshBackdrop(false);
  });
}

function showWidget() {
  if (!win) return;
  win.show();
  win.focus();
}

function toggleWidget() {
  if (!win) return;
  if (win.isVisible()) win.hide();
  else showWidget();
}

function setPinned(on) {
  saveSettings({ alwaysOnTop: !!on });
  if (win) win.setAlwaysOnTop(!!on);
  send('pinned', !!on);
  refreshTrayMenu();
}

// ---------------------------------------------------------------- autostart + tray

const loginOpts = () => ({ path: process.execPath, args: app.isPackaged ? [] : [app.getAppPath()] });

function isAutoStart() {
  try {
    return app.getLoginItemSettings(loginOpts()).openAtLogin;
  } catch {
    return false;
  }
}

function setAutoStart(on) {
  try {
    app.setLoginItemSettings({ openAtLogin: on, ...loginOpts() });
  } catch (e) {
    console.error('[autostart]', e);
  }
  refreshTrayMenu();
}

function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Tampilkan / sembunyikan widget', click: toggleWidget },
      { label: 'Selalu di atas jendela lain', type: 'checkbox', checked: !!settings.alwaysOnTop, click: (i) => setPinned(i.checked) },
      { label: 'Jalankan saat Windows menyala', type: 'checkbox', checked: isAutoStart(), enabled: process.platform === 'win32', click: (i) => setAutoStart(i.checked) },
      { label: 'Kembalikan posisi default', click: resetPosition },
      { type: 'separator' },
      { label: 'Keluar', click: () => app.quit() },
    ]),
  );
}

function createTray() {
  try {
    const icon = nativeImage.createFromPath(path.join(ROOT, 'assets', 'tray.png'));
    tray = new Tray(icon);
    tray.setToolTip('Antigravity Widget');
    tray.on('click', toggleWidget);
    refreshTrayMenu();
  } catch (err) {
    console.warn('[tray] Gagal inisialisasi tray icon:', err);
  }
}

// ---------------------------------------------------------------- IPC

ipcMain.handle('widget:get-state', () => ({
  payload: lastPayload,
  backdrop: backdrop.dataUrl,
  geom: geom(),
  pinned: !!settings.alwaysOnTop,
}));

ipcMain.handle('widget:hide', () => {
  if (win) win.hide();
});

ipcMain.handle('widget:toggle-pin', () => {
  setPinned(!settings.alwaysOnTop);
  return !!settings.alwaysOnTop;
});

ipcMain.handle('widget:open-session', async (_e, _id, title) => {
  // Hanya buka kalau Antigravity memang terdaftar sebagai handler antigravity://
  // (kalau tidak, Windows memunculkan dialog "pilih aplikasi" yang mengganggu).
  try {
    if (app.getApplicationNameForProtocol('antigravity://')) {
      await shell.openExternal('antigravity://');
      return { ok: true };
    }
  } catch (e) {
    console.error('[open-session]', e);
  }
  clipboard.writeText(String(title || ''));
  return { ok: false, copied: true };
});

// ---------------------------------------------------------------- lifecycle

app.on('second-instance', showWidget);
app.on('window-all-closed', () => {
  /* tetap hidup di tray */
});
app.on('before-quit', () => {
  quitting = true;
  clearTimeout(restartTimer);
  if (reader) reader.kill();
});

app.whenReady().then(() => {
  settings = loadSettings();
  createWindow();
  createTray();
  startReader();
  setInterval(() => {
    if (win && win.isVisible()) refreshBackdrop(false);
  }, WALLPAPER_REFRESH_MS);
  screen.on('display-metrics-changed', () => {
    refreshBackdrop(true);
    sendGeom();
  });
});
