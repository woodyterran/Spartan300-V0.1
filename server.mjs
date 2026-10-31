import http from 'node:http';
import { createBackend } from './backend.mjs';
import { mobileEntry } from './mobile-entry.mjs';
import { codespacesOrigin } from './codespaces.mjs';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { networkInterfaces } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const publicOrigin = codespacesOrigin();
function wifiAddress() {
  if (process.platform !== 'darwin') return null;
  try {
    const ports = execFileSync('/usr/sbin/networksetup', ['-listallhardwareports'], { encoding: 'utf8' });
    const device = ports.match(/Hardware Port: (?:Wi-Fi|AirPort)\nDevice: (\S+)/)?.[1];
    if (device) return { interface: device, address: execFileSync('/usr/sbin/ipconfig', ['getifaddr', device], { encoding: 'utf8' }).trim(), verifiedWifi: true };
  } catch {}
  const fallback = Object.entries(networkInterfaces()).flatMap(([name, entries]) => entries.filter(e => e.family === 'IPv4' && !e.internal).map(e => ({ interface: name, address: e.address, verifiedWifi: false })));
  return fallback[0] || null;
}
const backend = await createBackend({ dataPath: path.join(process.env.SPARTAN_DATA_DIR || path.join(root, '.data'), 'store.json') });
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.json': 'application/json', '.jpg':'image/jpeg', '.png':'image/png' };
const server = http.createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/mobile-entry' && req.method === 'GET') {
    try { const entry = mobileEntry({ wifi: publicOrigin ? null : wifiAddress(), publicOrigin, destination: url.searchParams.get('destination') }); res.writeHead(200, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(entry)); }
    catch(error) { res.writeHead(error.status || 500, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify({error:error.message})); }
    return;
  }
  if (await backend.handle(req, res, url)) return;
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); res.end('Method not allowed'); return; }
  if (url.pathname === '/api/health') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true, app: 'Spartan300', version: '0.1.0', host: '0.0.0.0', port: 3000, wifi: wifiAddress(), backend: 'local-demo-json', settlementBackend: true })); return; }
  const allowed = ['/admin', '/admin/', '/admin.html', '/admin.js', '/admin.css', '/', '/index.html', '/preview.html', '/app.js', '/viewport.js', '/styles.css', '/assets/expert-chef.jpg', '/assets/expert-hero-wide.jpg', '/assets/skill-cooking.jpg', '/assets/skill-assembly.jpg', '/assets/expert-work.jpg', '/assets/skill-electrical.svg', '/assets/deepreach-logo.png'];
  if (!allowed.includes(url.pathname)) { res.writeHead(404); res.end('Not found'); return; }
  try {
    const file = url.pathname === '/' ? 'index.html' : ['/admin', '/admin/'].includes(url.pathname) ? 'admin.html' : url.pathname.slice(1);
    const data = await readFile(path.join(root, file));
    res.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
server.on('error', err => { console.error(err.code === 'EADDRINUSE' ? 'Port 3000 is occupied. No existing process was stopped.' : err); process.exit(1); });
server.listen(3000, '0.0.0.0', () => {
  console.log('Spartan300 V0.1 — local prototype');
  console.log('Local: http://localhost:3000');
  if (publicOrigin) console.log(`Codespaces: ${publicOrigin}`);
  const wifi = wifiAddress();
  console.log(wifi ? `${wifi.verifiedWifi ? 'Wi-Fi' : 'Network (Wi-Fi unverified)'} (${wifi.interface}): http://${wifi.address}:3000` : 'No active LAN IPv4 detected');
  console.log('Admin: http://localhost:3000/admin');
  console.log('Listening on 0.0.0.0:3000. User and settlement data are saved locally. AI, video upload, income and payments remain demonstrations.');
});
