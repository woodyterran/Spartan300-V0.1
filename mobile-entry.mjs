import qrcode from './vendor/qrcode.mjs';

export const MOBILE_DESTINATIONS = new Set(['advisor', 'records', 'profile', 'login', 'register', 'shoot']);
export function mobileEntry({ wifi, destination = 'advisor', port = 3000, publicOrigin = null }) {
  if (!publicOrigin && (!wifi?.verifiedWifi || !/^\d{1,3}(\.\d{1,3}){3}$/.test(wifi.address || '') || wifi.address.split('.').some(v=>Number(v)>255) || wifi.address.startsWith('127.') || wifi.address === '0.0.0.0')) {
    const error = new Error('未检测到可用的 Wi-Fi 地址，请将 Mac 连接 Wi-Fi 后重试');
    error.status = 503; throw error;
  }
  const target = MOBILE_DESTINATIONS.has(destination) ? destination : 'advisor';
  const url = new URL(publicOrigin || `http://${wifi.address}:${port}/`);
  url.searchParams.set('continue', target);
  const qr = qrcode(0, 'M');
  qr.addData(url.href, 'Byte');qr.make();
  return { url: url.href, destination: target, qrSvg: qr.createSvgTag({cellSize:6,margin:24,scalable:true}), localNetwork: !publicOrigin };
}
