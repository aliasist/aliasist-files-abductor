const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, spawnSync } = require('child_process');

if (process.platform === 'win32') app.setAppUserModelId('com.aliasist.files.abductor');

let mainWindow;
const DL_DIR = path.join(app.getPath('downloads'), 'Aliasist');
let currentProcess = null;
let abortRequested = false;

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function createWindow() {
  ensureDir(DL_DIR);
  mainWindow = new BrowserWindow({
    width: 800,
    height: 580,
    backgroundColor: '#05080d',
    icon: path.join(__dirname, 'assets', 'alien_icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // CRITICAL: Points to the bridge
      contextIsolation: true,
      nodeIntegration: false
    },
    frame: false,
    show: false
  });

  // Load the file ONLY once using an absolute path
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
}

// --- IPC LISTENERS (The Bridge Receivers) ---
ipcMain.on('win-minimize', () => mainWindow.minimize());
ipcMain.on('win-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('win-close', () => mainWindow.close());

ipcMain.handle('get-dl-dir', () => DL_DIR);

ipcMain.handle('browse-save', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: path.join(DL_DIR, defaultName)
  });
  return result.filePath; // Returns the string path back to renderer
});

ipcMain.handle('download-file', async (event, url, savePath) => {
  return new Promise((resolve, reject) => {
    // On Windows, it looks for yt-dlp.exe. On Linux, just yt-dlp.
    const cmd = process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
    
    abortRequested = false;

    // For merged mp4, make yt-dlp write to a deterministic template.
    // We treat the user-provided savePath as a "base" and let yt-dlp choose ext,
    // while we still report a finalPath of `${base}.mp4`.
    const parsedBase = savePath.replace(/\.[a-zA-Z0-9]+$/, "");
    const outTemplate = `${parsedBase}.%(ext)s`;
    const finalPath = `${parsedBase}.mp4`;
    const outDir = path.dirname(parsedBase);
    ensureDir(outDir);

    // Force downloading best video+audio and merging to mp4.
    const args = [
      url,
      '--newline',
      '--no-playlist',
      '--impersonate',
      'chrome',
      '--extractor-args',
      'generic:impersonate',
      '--format',
      // Prefer H.264/AAC, with fallback for silent clips, single streams, or pre-merged files.
      'bestvideo*[vcodec^=avc1]+bestaudio[acodec^=mp4a]/bestvideo*[vcodec^=avc1]+bestaudio[ext=m4a]/bestvideo*+bestaudio/bestvideo*/best',
      '--merge-output-format',
      'mp4',
      // Output template: `${base}.%(ext)s`
      '-o',
      outTemplate,
      // Emit progress updates more consistently.
      '--progress',
      '--no-warnings',
      '--restrict-filenames',
    ];
    // Parse yt-dlp progress output for smooth UX.
    // yt-dlp often writes progress to stderr, so we listen to both.
    const ls = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    currentProcess = ls;
    let stdoutBuffer = '';
    let stderrBuffer = '';
    let stderrTail = '';
    let stdoutTail = '';
    let lastProgressSentAt = 0;

    function parseSizeToBytes(sizeStr) {
      // Accepts values like: "12.3MiB", "450KiB", "1.2GB", "999B"
      const m = String(sizeStr).trim().match(/^([\d.]+)\s*([KMGTP]?i?B)$/i);
      if (!m) return null;
      const value = parseFloat(m[1]);
      const unit = m[2].toLowerCase();
      const isBinary = unit.includes('i');
      const base = isBinary ? 1024 : 1000;
      const exp = unit.startsWith('k') ? 1
        : unit.startsWith('m') ? 2
        : unit.startsWith('g') ? 3
        : unit.startsWith('t') ? 4
        : unit.startsWith('p') ? 5
        : 0;
      return Math.round(value * Math.pow(base, exp));
    }

    function extractProgress(line) {
      // With `--progress`, yt-dlp commonly outputs carriage-return updates that
      // may not include the literal "[download]" prefix.
      // We parse percent from any line that looks like a download progress line.
      if (!/%/.test(line)) return null;
      if (!/download/i.test(line)) return null;

      const pctMatch = line.match(/([\d.]+)%/);
      if (!pctMatch) return null;
      const pct = parseFloat(pctMatch[1]);

      // Total (after "of") and speed (after "at") if present.
      let total = null;
      const totalMatch = line.match(/\sof\s+([\d.]+\s*[KMGTP]?i?B)\b/i);
      if (totalMatch) total = parseSizeToBytes(totalMatch[1]);

      let speed = null;
      const speedMatch = line.match(/\sat\s+([\d.]+\s*[KMGTP]?i?B)\/s\b/i);
      if (speedMatch) speed = parseSizeToBytes(speedMatch[1]);

      return { pct, total, speed };
    }

    function feedChunk(isErr, chunk) {
      const buf = isErr ? stderrBuffer : stdoutBuffer;
      const next = buf + chunk.toString();
      // `--progress` often uses carriage returns (no newlines). Split on both
      // newline and carriage return so we can parse updates immediately.
      const parts = next.split(/\r?\n|\r/);
      const last = parts.pop();
      if (isErr) stderrBuffer = last;
      else stdoutBuffer = last;

      if (isErr) {
        // Keep a bounded tail for useful error messages.
        stderrTail = (stderrTail + chunk.toString()).slice(-8000);
      }
      if (!isErr) {
        // Some yt-dlp errors/progress end up on stdout depending on flags/version.
        stdoutTail = (stdoutTail + chunk.toString()).slice(-8000);
      }
      for (const line of parts) {
        const p = extractProgress(line);
        if (!p) continue;
        const now = Date.now();
        // Throttle IPC to keep UI smooth (and reduce message spam).
        if (p.pct < 100 && now - lastProgressSentAt < 120) continue;
        lastProgressSentAt = now;
        mainWindow?.webContents?.send('dl-progress', p);
      }
    }

    ls.stdout.on('data', (d) => feedChunk(false, d));
    ls.stderr.on('data', (d) => feedChunk(true, d));

    ls.on('close', (code) => {
      currentProcess = null;
      if (abortRequested) {
        return reject(new Error('abort'));
      }
      if (code !== 0) {
        const detailParts = [
          stderrTail,
          stdoutTail,
          stderrBuffer,
          stdoutBuffer,
        ]
          .map((s) => (s == null ? '' : String(s)))
          .join('\n')
          .trim();
        const tailMsg = detailParts ? `\n\n${detailParts}` : '\n\n(no yt-dlp output captured)'; // Helps debugging
        return reject(new Error(`Abduction failed: ${code}${tailMsg}`));
      }

      // Report the final merged artifact we expect from `--merge-output-format mp4`.
      let size = 0;
      try {
        if (!fs.existsSync(finalPath)) {
          return reject(new Error(`Download completed but expected file was not found: ${finalPath}`));
        }

        // Post-step: move MP4 "moov" atom to the beginning for broad player compatibility
        // (Totem/Ubuntu player is sensitive to this; mpv is usually not).
        try {
          const faststartPath = finalPath.replace(/\.mp4$/i, "_faststart.mp4");
          const remux = spawnSync(
            'ffmpeg',
            ['-y', '-i', finalPath, '-c', 'copy', '-movflags', '+faststart', faststartPath],
            { encoding: 'utf8' }
          );
          if (remux && remux.status === 0 && fs.existsSync(faststartPath)) {
            fs.unlinkSync(finalPath);
            fs.renameSync(faststartPath, finalPath);
          }
        } catch {
          // If ffmpeg/faststart fails, keep the original merged file.
        }

        // Post-download validation: ensure mp4 actually contains H.264 + AAC.
        // This prevents "audio-only remuxed to mp4" and also avoids AV1/Opus outputs
        // that can appear as a grey screen in Ubuntu's default player.
        try {
          const vProbe = spawnSync(
            'ffprobe',
            [
              '-v',
              'error',
              '-select_streams',
              'v:0',
              '-show_entries',
              'stream=codec_name',
              '-of',
              'default=nw=1:nk=1',
              finalPath,
            ],
            { encoding: 'utf8' }
          );
          const vCodec = (vProbe.stdout || '').toString().trim().toLowerCase();
          if (!vCodec) {
            return reject(new Error(`Download completed but output has no video stream: ${finalPath}`));
          }

          const aProbe = spawnSync(
            'ffprobe',
            [
              '-v',
              'error',
              '-select_streams',
              'a:0',
              '-show_entries',
              'stream=codec_name',
              '-of',
              'default=nw=1:nk=1',
              finalPath,
            ],
            { encoding: 'utf8' }
          );
          const aCodec = (aProbe.stdout || '').toString().trim().toLowerCase();
          if (!aCodec) {
            return reject(new Error(`Download completed but output has no audio stream: ${finalPath}`));
          }

          const looksH264 = vCodec.includes('h264') || vCodec.includes('avc');
          const looksAac = aCodec.includes('aac') || aCodec.includes('mp4a');

          if (!looksH264 || !looksAac) {
            return reject(
              new Error(
                `Download completed but codecs are not H.264 + AAC (video=${vCodec || 'unknown'}, audio=${aCodec || 'unknown'}): ${finalPath}`
              )
            );
          }
        } catch {
          // If ffprobe isn't available, skip the validation.
        }

        const stat = fs.statSync(finalPath);
        size = stat.size;
      } catch {
        // If for some reason the final path can't be stat'ed, keep size=0.
      }

      mainWindow?.webContents?.send('dl-meta', { finalPath, total: null });
      return resolve({ success: true, path: finalPath, size });
    });

    ls.on('error', (err) => reject(new Error(`Beam failure: ${err.message}`)));

  });
});

ipcMain.on('abort-download', () => {
  abortRequested = true;
  if (!currentProcess) return;
  try {
    currentProcess.kill('SIGTERM');
  } catch {
    // Best-effort abort.
  }
  // Escalate if needed (some processes ignore SIGTERM).
  setTimeout(() => {
    try {
      if (currentProcess) currentProcess.kill('SIGKILL');
    } catch {
      // ignore
    }
  }, 2000);
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });