'use client';

import { useRef, useState } from 'react';
import { X, Copy, Twitter, MessageCircle, Download, Link, Check, Image as ImageIcon } from 'lucide-react';

type Props = {
  title: string;
  text: string;
  url: string;
  weatherData?: {
    temp: string;
    feelsLike: string;
    condition: string;
    location: string;
    humidity: number;
    wind: string;
    code: number;
    isDay: boolean;
  };
  onClose: () => void;
};

// WMO condition label
const WMO_EMOJI: Record<number, string> = {
  0: '☀️', 1: '🌤', 2: '⛅', 3: '☁️',
  45: '🌫', 48: '🌫',
  51: '🌦', 53: '🌦', 55: '🌧',
  61: '🌧', 63: '🌧', 65: '🌧',
  71: '❄️', 73: '❄️', 75: '❄️', 77: '🌨',
  80: '🌦', 81: '🌧', 82: '⛈',
  85: '🌨', 86: '🌨',
  95: '⛈', 96: '⛈', 99: '⛈',
};

function wmoEmoji(code: number): string {
  return WMO_EMOJI[code] ?? '🌡';
}

async function drawWeatherCard(data: Props['weatherData'], text: string, url: string): Promise<string> {
  const W = 640, H = 360;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // Background gradient — deep purple
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#1a1625');
  bg.addColorStop(1, '#2d2438');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle grid pattern
  ctx.strokeStyle = 'rgba(157,124,216,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  // Card surface
  ctx.fillStyle = 'rgba(45,36,56,0.95)';
  roundRect(ctx, 20, 20, W - 40, H - 40, 12);
  ctx.fill();

  // Card border
  ctx.strokeStyle = 'rgba(157,124,216,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 20, 20, W - 40, H - 40, 12);
  ctx.stroke();

  // Accent stripe top
  const stripe = ctx.createLinearGradient(20, 0, W - 20, 0);
  stripe.addColorStop(0, '#9d7cd8');
  stripe.addColorStop(1, '#7aa2f7');
  ctx.fillStyle = stripe;
  roundRect(ctx, 20, 20, W - 40, 3, 12);
  ctx.fill();

  if (data) {
    // Big weather emoji
    ctx.font = '72px serif';
    ctx.textAlign = 'left';
    ctx.fillText(wmoEmoji(data.code), 44, 130);

    // Temperature
    ctx.font = 'bold 72px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#dcd7e8';
    ctx.textAlign = 'left';
    ctx.fillText(data.temp, 130, 130);

    // Location
    ctx.font = '500 22px system-ui, sans-serif';
    ctx.fillStyle = '#9d7cd8';
    ctx.fillText(data.location, 44, 162);

    // Condition line
    ctx.font = '16px system-ui, sans-serif';
    ctx.fillStyle = '#a89bc2';
    ctx.fillText(`${data.condition}  ·  feels ${data.feelsLike}`, 44, 190);

    // Stats row
    const stats = [
      { icon: '💨', val: data.wind },
      { icon: '💧', val: `${data.humidity}%` },
    ];
    ctx.font = '15px system-ui, sans-serif';
    ctx.fillStyle = '#a89bc2';
    let sx = 44;
    for (const s of stats) {
      ctx.font = '15px serif';
      ctx.fillText(s.icon, sx, 220);
      ctx.font = '15px system-ui, sans-serif';
      ctx.fillText(s.val, sx + 24, 220);
      sx += 100;
    }

    // Divider
    ctx.strokeStyle = 'rgba(157,124,216,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(44, 238); ctx.lineTo(W - 44, 238); ctx.stroke();
  }

  // Share text (wrap)
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillStyle = '#a89bc2';
  ctx.textAlign = 'left';
  const lines = wrapText(ctx, text, W - 90, 14);
  lines.slice(0, 3).forEach((line, i) => ctx.fillText(line, 44, 258 + i * 20));

  // URL chip
  ctx.fillStyle = 'rgba(157,124,216,0.15)';
  roundRect(ctx, 44, H - 70, W - 88, 24, 6);
  ctx.fill();
  ctx.font = '12px monospace';
  ctx.fillStyle = '#9d7cd8';
  ctx.textAlign = 'center';
  ctx.fillText(url.slice(0, 60) + (url.length > 60 ? '…' : ''), W / 2, H - 52);

  // Branding
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(157,124,216,0.6)';
  ctx.textAlign = 'right';
  ctx.fillText('🍅 Tomato Weather', W - 44, H - 30);

  return canvas.toDataURL('image/png');
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number, _size: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = word; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function ShareModal({ title, text, url, weatherData, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const imgRef = useRef<HTMLAnchorElement>(null);

  async function copyText() {
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(url); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } catch {}
  }

  async function genAndDownload() {
    setGenerating(true);
    try {
      const dataUrl = await drawWeatherCard(weatherData, text, url);
      setPngUrl(dataUrl);
      // trigger download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tomato-${Date.now()}.png`;
      a.click();
    } finally {
      setGenerating(false);
    }
  }

  function openTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
  }

  function openWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-label="Share weather">
        <div className="share-modal__head">
          <span className="share-modal__title">Share</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        <div className="share-modal__preview">
          <p className="share-modal__text">{text}</p>
          <p className="share-modal__url">{url}</p>
        </div>

        {pngUrl && (
          <img src={pngUrl} alt="Weather card preview" className="share-modal__png-preview" />
        )}

        <div className="share-modal__actions">
          <button className="share-btn" onClick={copyText}>
            {copied ? <Check size={18} /> : <Copy size={18} />}
            <span>{copied ? 'Copied!' : 'Copy text'}</span>
          </button>
          <button className="share-btn" onClick={copyLink}>
            {copiedLink ? <Check size={18} /> : <Link size={18} />}
            <span>{copiedLink ? 'Copied!' : 'Copy link'}</span>
          </button>
          <button className="share-btn" onClick={openTwitter}>
            <Twitter size={18} />
            <span>Twitter / X</span>
          </button>
          <button className="share-btn" onClick={openWhatsApp}>
            <MessageCircle size={18} />
            <span>WhatsApp</span>
          </button>
          <button className="share-btn share-btn--wide" onClick={genAndDownload} disabled={generating}>
            {generating ? <ImageIcon size={18} /> : <Download size={18} />}
            <span>{generating ? 'Drawing card…' : pngUrl ? 'Download again' : 'Save as PNG'}</span>
          </button>
        </div>
        <a ref={imgRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
}
