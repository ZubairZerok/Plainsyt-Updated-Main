// Build step: derive small, correctly-sized brand images from the large source files in public/.
// Source art stays untouched in the repo; only optimised copies are written to dist/.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pub = (p) => path.join(root, 'public', p);
const out = (p) => path.join(root, 'dist', p);

if (!fs.existsSync(path.join(root, 'dist'))) {
  console.log('Skipping asset generation: dist/ does not exist yet.');
  process.exit(0);
}
fs.mkdirSync(out('logos'), { recursive: true });

const icon = fs.readFileSync(pub('logos/icon.png'));
const english = fs.readFileSync(pub('logos/English.png'));
const bangla = fs.readFileSync(pub('logos/Bangla.png'));
const png = (buf, w, h, opts = {}) => sharp(buf).resize(w, h, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, ...opts }).png({ compressionLevel: 9, palette: true });

// Square icons for browsers, iOS and the PWA manifest.
for (const size of [48, 180, 192, 512]) await png(icon, size, size).toFile(out(`logos/icon-${size}.png`));
await png(icon, 256, 256).toFile(out('logos/icon.png'));

// Maskable icon: artwork inside the 80% safe zone on the brand colour.
const inner = await png(icon, 358, 358).toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#061621' } })
  .composite([{ input: inner, left: 77, top: 77 }])
  .png({ compressionLevel: 9 })
  .toFile(out('logos/icon-maskable-512.png'));

// Wordmarks are displayed at ~200px wide; 800px covers retina.
await sharp(english).resize({ width: 800 }).png({ compressionLevel: 9, palette: true }).toFile(out('logos/English.png'));
await sharp(bangla).resize({ width: 800 }).png({ compressionLevel: 9, palette: true }).toFile(out('logos/Bangla.png'));

// Social share image (1200x630).
const wordmark = await sharp(english).resize({ width: 900 }).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#061621' } })
  .composite([{ input: wordmark, gravity: 'center' }])
  .png({ compressionLevel: 9, palette: true })
  .toFile(out('og-image.png'));

// A real .ico (PNG-in-ICO) for /favicon.ico requests.
const ico48 = await png(icon, 48, 48).toBuffer();
const ico32 = await png(icon, 32, 32).toBuffer();
const images = [ico32, ico48];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
let offset = 6 + 16 * images.length;
const entries = images.map((buf, i) => {
  const e = Buffer.alloc(16);
  const size = i === 0 ? 32 : 48;
  e.writeUInt8(size, 0); e.writeUInt8(size, 1); e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(buf.length, 8); e.writeUInt32LE(offset, 12);
  offset += buf.length;
  return e;
});
fs.writeFileSync(out('favicon.ico'), Buffer.concat([header, ...entries, ...images]));
console.log('✓ Brand assets generated.');
