// Draws the shareable weather card onto a canvas (client only). Three formats, three looks.
import { rabbitDoc, type Mood } from './rabbit';

export type CardFormat = 'post' | 'story' | 'wide';
export type CardStyle = 'sky' | 'tomato' | 'night';

export const FORMATS: Record<CardFormat, { w: number; h: number; label: string; icon: string }> = {
  post: { w: 1080, h: 1080, label: 'Post', icon: 'crop_square' },
  story: { w: 1080, h: 1920, label: 'Story', icon: 'crop_portrait' },
  wide: { w: 1200, h: 630, label: 'Wide', icon: 'crop_landscape' },
};

export type CardData = {
  place: string; date: string; temp: string; condition: string; hiLo: string;
  metrics: { k: string; v: string }[]; line: string | null; mood: Mood; isDay: boolean; url: string;
};

type Palette = { bg: [string, string, string]; ink: string; muted: string; accent: string; bubble: string; bubbleInk: string; chip: string; glow: string };

function palette(style: CardStyle, isDay: boolean): Palette {
  if (style === 'tomato') return { bg: ['#fff1ea', '#ffd5c7', '#ffb4a1'], ink: '#3e0b04', muted: 'rgba(62,11,4,.62)', accent: '#d2321d', bubble: '#ffffff', bubbleInk: '#3e0b04', chip: 'rgba(62,11,4,.07)', glow: 'rgba(255,255,255,.65)' };
  if (style === 'night') return { bg: ['#2a1310', '#1b0f0e', '#120b0b'], ink: '#ffe9e2', muted: 'rgba(255,218,210,.62)', accent: '#ff6a52', bubble: 'rgba(255,233,226,.95)', bubbleInk: '#3e0b04', chip: 'rgba(255,233,226,.08)', glow: 'rgba(255,106,82,.30)' };
  // sky: follow the app's live Material colors (seeded from the weather)
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string, d: string) => cs.getPropertyValue(n).trim() || d;
  const pc = v('--md-primary-container', '#d4e3ff'), tc = v('--md-tertiary-container', '#f2daff'), on = v('--md-on-primary-container', '#224876');
  return {
    bg: isDay ? [pc, pc, tc] : [v('--md-surface-container-highest', '#33353a'), pc, tc],
    ink: on, muted: on, accent: v('--md-primary', '#3c6090'),
    bubble: 'rgba(255,255,255,.88)', bubbleInk: '#1a1b20', chip: 'rgba(255,255,255,.28)', glow: 'rgba(255,255,255,.45)',
  };
}

const loadImg = (src: string) => new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
const svgSrc = (svg: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/), lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(next).width > maxW && cur) { lines.push(cur); cur = w; } else cur = next;
  }
  if (cur) lines.push(cur);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    let last = lines[maxLines - 1];
    while (ctx.measureText(last + '…').width > maxW && last.includes(' ')) last = last.slice(0, last.lastIndexOf(' '));
    lines[maxLines - 1] = last + '…';
  }
  return lines;
}

// Shrinks the font until the text fits on one line.
function fit(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, maxW: number, family: string) {
  let s = size;
  do { ctx.font = `${weight} ${s}px ${family}`; s -= 2; } while (ctx.measureText(text).width > maxW && s > 18);
  return s + 2;
}

function bubble(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, lines: string[], fs: number, p: Palette, family: string, tail: 'bl' | 'br') {
  const lh = fs * 1.3, padX = fs * 0.9, padY = fs * 0.7;
  const h = lines.length * lh + padY * 2;
  const r = fs * 1.1, small = fs * 0.3;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = fs; ctx.shadowOffsetY = fs * 0.2;
  ctx.fillStyle = p.bubble;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, tail === 'bl' ? [r, r, r, small] : [r, r, small, r]);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = p.bubbleInk; ctx.font = `600 ${fs}px ${family}`; ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, x + padX, y + padY + i * lh + fs * 0.08));
  return h;
}

export async function drawCard(canvas: HTMLCanvasElement, d: CardData, format: CardFormat, style: CardStyle) {
  const { w: W, h: H } = FORMATS[format];
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const p = palette(style, d.isDay);
  const family = `${getComputedStyle(document.body).fontFamily || 'system-ui'}, system-ui, sans-serif`;
  await document.fonts?.ready;
  const [rabbit, mark] = await Promise.all([
    loadImg(svgSrc(rabbitDoc({ id: 'sc', face: true, mood: d.mood, whiskers: true }, 512))),
    loadImg(svgSrc(rabbitDoc({ id: 'sm' }, 128))),
  ]);

  // background + glow + soft "sky" circles
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, p.bg[0]); g.addColorStop(0.55, p.bg[1]); g.addColorStop(1, p.bg[2]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.86, H * 0.12, 0, W * 0.86, H * 0.12, Math.max(W, H) * 0.55);
  glow.addColorStop(0, p.glow); glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);

  const pad = format === 'wide' ? 64 : 84;
  ctx.textBaseline = 'alphabetic';
  const text = (s: string, x: number, y: number, size: number, weight: number, color: string, maxW?: number) => {
    const fs = maxW ? fit(ctx, s, weight, size, maxW, family) : size;
    ctx.font = `${weight} ${fs}px ${family}`; ctx.fillStyle = color; ctx.fillText(s, x, y);
    return fs;
  };

  // brand row
  const markS = format === 'wide' ? 44 : 60;
  ctx.drawImage(mark, pad - 4, pad - 8, markS, markS);
  text('Tomato', pad + markS + 8, pad + markS * 0.62, markS * 0.55, 700, p.ink);

  const metricChips = (x: number, y: number, cols: number, cw: number, ch: number, gap: number, fs: number) => {
    d.metrics.slice(0, 4).forEach((m, i) => {
      const cx = x + (i % cols) * (cw + gap), cy = y + Math.floor(i / cols) * (ch + gap);
      ctx.fillStyle = p.chip; ctx.beginPath(); ctx.roundRect(cx, cy, cw, ch, ch * 0.32); ctx.fill();
      text(m.k, cx + fs * 0.9, cy + ch * 0.42, fs * 0.72, 500, p.muted);
      text(m.v, cx + fs * 0.9, cy + ch * 0.8, fs * 1.05, 700, p.ink, cw - fs * 1.6);
    });
  };

  if (format === 'wide') {
    text(d.place, pad, 190, 54, 800, p.ink, 640);
    text(d.date, pad, 232, 26, 500, p.muted);
    text(d.temp, pad - 8, 420, 190, 800, p.ink);
    text(d.condition, pad, 478, 44, 700, p.accent, 640);
    text(d.hiLo, pad, 528, 30, 500, p.muted);
    const rs = 250;
    ctx.drawImage(rabbit, W - pad - rs + 10, H - rs - 52, rs, rs);
    if (d.line) {
      ctx.font = `600 26px ${family}`;
      const lines = wrap(ctx, d.line, 330, 3);
      bubble(ctx, W - pad - 380, 70, 380, lines, 26, p, family, 'br');
    }
    text(d.url, pad, H - 34, 22, 500, p.muted);
    return;
  }

  const story = format === 'story';
  const top = story ? 330 : 236;
  text(d.place, pad, top, story ? 78 : 66, 800, p.ink, W - pad * 2);
  text(d.date, pad, top + (story ? 60 : 52), story ? 36 : 32, 500, p.muted);
  const tempY = top + (story ? 410 : 330);
  text(d.temp, pad - 12, tempY, story ? 360 : 290, 800, p.ink);
  text(d.condition, pad, tempY + (story ? 96 : 78), story ? 62 : 52, 700, p.accent, W - pad * 2);
  text(d.hiLo, pad, tempY + (story ? 160 : 132), story ? 40 : 36, 500, p.muted);

  if (story) {
    metricChips(pad, tempY + 220, 2, (W - pad * 2 - 24) / 2, 128, 24, 40);
    const rs = 460;
    const ry = H - rs - 120;
    ctx.drawImage(rabbit, W - pad - rs + 30, ry, rs, rs);
    if (d.line) {
      ctx.font = `600 44px ${family}`;
      const lines = wrap(ctx, d.line, W - pad * 2 - 300 - 80, 4);
      const bw = Math.min(W - pad * 2 - 300, Math.max(...lines.map(l => ctx.measureText(l).width)) + 80);
      bubble(ctx, pad, ry + 40, bw, lines, 44, p, family, 'br');
    }
    text(d.url, pad, H - 76, 32, 500, p.muted);
  } else {
    const rs = 330;
    ctx.drawImage(rabbit, W - pad - rs + 26, H - rs - 70, rs, rs);
    metricChips(pad, H - 340, 2, 270, 104, 18, 32);
    if (d.line) {
      ctx.font = `600 34px ${family}`;
      const bw = 410;
      const lines = wrap(ctx, d.line, bw - 60, 3);
      const bh = lines.length * 34 * 1.3 + 48;
      bubble(ctx, W - pad - bw, H - rs - 70 - bh + 10, bw, lines, 34, p, family, 'br');
    }
    text(d.url, pad, H - 64, 28, 500, p.muted);
  }
}

export const canvasBlob = (c: HTMLCanvasElement) => new Promise<Blob>((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/png'));
