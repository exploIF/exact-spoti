// Writes the bundled album art: assets/covers/0.png … 23.png.
// Run once with `bun tools/make-covers.ts`; the PNGs are committed.
// Each cover is a diagonal gradient with one soft glow, so art needs no network.
import { mkdirSync, writeFileSync } from 'node:fs';
import { crc32, deflateSync } from 'node:zlib';

const SIZE = 320;
const COVER_COUNT = 24;
const OUT_DIR = 'assets/covers';

type Rgb = [number, number, number];

/** Hue (0–360), saturation and lightness (0–1) to 8-bit RGB. */
function hsl(h: number, s: number, l: number): Rgb {
  const a = s * Math.min(l, 1 - l);
  const channel = (n: number) => {
    const k = (n + h / 30) % 12;
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [channel(0), channel(8), channel(4)];
}

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

function pngChunk(type: string, data: Buffer): Buffer {
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const out = Buffer.alloc(body.length + 8);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body), body.length + 4);
  return out;
}

function encodePng(rgb: Buffer): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(SIZE, 0);
  header.writeUInt32BE(SIZE, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(rgb, { level: 9 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function drawCover(index: number): Buffer {
  // Golden-angle hue steps keep neighbouring covers visibly different.
  const hue = (index * 137.5) % 360;
  const from = hsl(hue, 0.72, 0.56);
  const to = hsl((hue + 48) % 360, 0.68, 0.2);
  const glow = hsl((hue + 200) % 360, 0.85, 0.66);
  const glowX = 0.2 + ((index * 7) % 10) / 16;
  const glowY = 0.15 + ((index * 3) % 10) / 16;

  const row = 1 + SIZE * 3; // a filter byte, then RGB per pixel
  const pixels = Buffer.alloc(row * SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / (SIZE - 1);
      const v = y / (SIZE - 1);
      const distance = Math.hypot(u - glowX, v - glowY);
      const glowAmount = Math.max(0, 1 - distance / 0.55) ** 2 * 0.65;
      for (let c = 0; c < 3; c++) {
        const base = mix(from[c], to[c], (u + v) / 2);
        pixels[y * row + 1 + x * 3 + c] = Math.round(mix(base, glow[c], glowAmount));
      }
    }
  }
  return encodePng(pixels);
}

mkdirSync(OUT_DIR, { recursive: true });
for (let i = 0; i < COVER_COUNT; i++) writeFileSync(`${OUT_DIR}/${i}.png`, drawCover(i));
console.log(`Wrote ${COVER_COUNT} covers to ${OUT_DIR}`);
