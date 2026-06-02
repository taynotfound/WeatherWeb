'use client';

import { useRef, useState } from 'react';
import { X, Copy, Twitter, MessageCircle, Download, Link, Check, Loader } from 'lucide-react';

type WeatherData = {
  temp: string; feelsLike: string; condition: string;
  location: string; humidity: number; wind: string;
  code: number; isDay: boolean;
};

type Props = {
  title: string; text: string; url: string;
  weatherData?: WeatherData;
  onClose: () => void;
};

// WMO code → emoji
const WMO: Record<number, string> = {
  0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',
  51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',
  71:'❄️',73:'❄️',75:'❄️',77:'🌨',80:'🌦',81:'🌧',
  82:'⛈',85:'🌨',86:'🌨',95:'⛈',96:'⛈',99:'⛈',
};

async function renderCard(d: WeatherData | undefined): Promise<Blob> {
  const W = 1200, H = 630; // OG standard
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d')!;

  // Background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#13111c');
  bg.addColorStop(0.5, '#1a1625');
  bg.addColorStop(1, '#0f0d17');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Subtle noise dots
  ctx.fillStyle = 'rgba(157,124,216,0.03)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    ctx.beginPath(); ctx.arc(x, y, Math.random() * 2, 0, Math.PI * 2); ctx.fill();
  }

  // Left accent bar
  const bar = ctx.createLinearGradient(0, 0, 0, H);
  bar.addColorStop(0, '#9d7cd8');
  bar.addColorStop(1, '#7aa2f7');
  ctx.fillStyle = bar;
  ctx.fillRect(0, 0, 6, H);

  if (d) {
    // Big emoji
    ctx.font = '160px serif';
    ctx.textAlign = 'left';
    ctx.fillText(WMO[d.code] ?? '🌡', 80, 260);

    // Temperature — huge
    ctx.font = `bold 180px system-ui, -apple-system, Arial, sans-serif`;
    ctx.fillStyle = '#dcd7e8';
    ctx.fillText(d.temp, 80, 450);

    // Measure temp width for condition placement
    const tempW = ctx.measureText(d.temp).width;

    // Condition chip
    ctx.font = '40px system-ui, sans-serif';
    ctx.fillStyle = '#9d7cd8';
    ctx.fillText(d.condition, 80, 510);

    // Location — top right area
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillStyle = '#dcd7e8';
    ctx.textAlign = 'right';
    ctx.fillText(d.location, W - 80, 200);

    // Meta chips (feels, humidity, wind)
    const chips = [
      `feels ${d.feelsLike}`,
      `${d.humidity}% humidity`,
      `${d.wind}`,
    ];
    ctx.font = '34px system-ui, sans-serif';
    ctx.fillStyle = '#a89bc2';
    ctx.textAlign = 'right';
    chips.forEach((c, i) => ctx.fillText(c, W - 80, 260 + i * 52));
  } else {
    // No data — just branding
    ctx.font = 'bold 80px system-ui, sans-serif';
    ctx.fillStyle = '#dcd7e8';
    ctx.textAlign = 'center';
    ctx.fillText('🍅 Tomato Weather', W / 2, H / 2 - 20);
    ctx.font = '36px system-ui, sans-serif';
    ctx.fillStyle = '#a89bc2';
    ctx.fillText('your weather, made beautiful', W / 2, H / 2 + 50);
  }

  // Bottom branding strip
  ctx.fillStyle = 'rgba(157,124,216,0.08)';
  ctx.fillRect(0, H - 90, W, 90);
  // Branding
  ctx.font = 'bold 30px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(157,124,216,0.7)';
  ctx.textAlign = 'left';
  ctx.fillText('🍅 Tomato Weather', 80, H - 30);

  return new Promise(res => cv.toBlob(b => res(b!), 'image/png'));
}

export function ShareModal({ title, text, url, weatherData, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  async function handleCopy() {
    try { await navigator.clipboard.writeText(`${text}\n${url}`); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }
  async function handleCopyLink() {
    try { await navigator.clipboard.writeText(url); setCopiedLink(true); setTimeout(() => setCopiedLink(false), 2000); } catch {}
  }
  function handleTwitter() {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
  }
  function handleWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, '_blank', 'noopener');
  }
  async function handleDownload() {
    setGenerating(true);
    try {
      const blob = await renderCard(weatherData);
      const objUrl = URL.createObjectURL(blob);
      setPreviewUrl(objUrl);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `tomato-weather-${Date.now()}.png`;
      a.click();
    } finally { setGenerating(false); }
  }

  return (
    <div className="share-modal-backdrop" onClick={onClose}>
      <div className="share-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal aria-label="Share weather">
        <div className="share-modal__head">
          <span className="share-modal__title">Share</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>

        {previewUrl && (
          <img src={previewUrl} alt="Weather card" className="share-modal__png-preview" />
        )}

        <div className="share-modal__preview">
          <p className="share-modal__text">{text}</p>
        </div>

        <div className="share-modal__actions">
          <button className="share-btn" onClick={handleCopy}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button className="share-btn" onClick={handleCopyLink}>
            {copiedLink ? <Check size={16} /> : <Link size={16} />}
            <span>{copiedLink ? 'Copied!' : 'Link'}</span>
          </button>
          <button className="share-btn" onClick={handleTwitter}>
            <Twitter size={16} /><span>Twitter</span>
          </button>
          <button className="share-btn" onClick={handleWhatsApp}>
            <MessageCircle size={16} /><span>WhatsApp</span>
          </button>
          <button className="share-btn share-btn--wide" onClick={handleDownload} disabled={generating}>
            {generating ? <Loader size={16} className="spin" /> : <Download size={16} />}
            <span>{generating ? 'Rendering…' : 'Save as PNG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
