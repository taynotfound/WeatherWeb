'use client';

import { useRef, useState } from 'react';
import { X, Copy, Twitter, MessageCircle, Image as ImageIcon, Link, Check } from 'lucide-react';

type Props = {
  title: string;
  text: string;
  url: string;
  onClose: () => void;
};

export function ShareModal({ title, text, url, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [capturing, setCapturing] = useState(false);

  async function copyText() {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function saveAsPng() {
    setCapturing(true);
    try {
      const { toPng } = await import('html-to-image');
      const el = document.querySelector('.shell') as HTMLElement;
      if (!el) return;
      const dataUrl = await toPng(el, {
        backgroundColor: '#1a1625',
        pixelRatio: 2,
        filter: (node) => {
          // skip modals, toasts, nav
          const cls = (node as HTMLElement).className ?? '';
          if (typeof cls === 'string' && (
            cls.includes('share-modal') ||
            cls.includes('bottom-nav') ||
            cls.includes('app-header') ||
            cls.includes('search-wrap') ||
            cls.includes('tabs') ||
            cls.includes('install-prompt')
          )) return false;
          return true;
        },
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `tomato-weather-${Date.now()}.png`;
      a.click();
    } catch (e) {
      console.error(e);
    } finally {
      setCapturing(false);
    }
  }

  function openTwitter() {
    const t = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://twitter.com/intent/tweet?text=${t}`, '_blank', 'noopener');
  }

  function openWhatsApp() {
    const t = encodeURIComponent(`${text}\n${url}`);
    window.open(`https://wa.me/?text=${t}`, '_blank', 'noopener');
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

        <div className="share-modal__actions">
          <button className="share-btn" onClick={copyText}>
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span>{copied ? 'Copied!' : 'Copy text'}</span>
          </button>
          <button className="share-btn" onClick={copyLink}>
            <Link size={20} />
            <span>Copy link</span>
          </button>
          <button className="share-btn" onClick={openTwitter}>
            <Twitter size={20} />
            <span>Twitter</span>
          </button>
          <button className="share-btn" onClick={openWhatsApp}>
            <MessageCircle size={20} />
            <span>WhatsApp</span>
          </button>
          <button className="share-btn share-btn--wide" onClick={saveAsPng} disabled={capturing}>
            <ImageIcon size={20} />
            <span>{capturing ? 'Capturing…' : 'Save as PNG'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
