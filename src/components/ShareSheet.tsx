'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon, Sheet } from './ui';
import { TomatoMark, moodFor } from './Tomato';
import { usePrefs } from '@/lib/prefs';
import { condition } from '@/lib/wx';
import { tomatoVerdict } from '@/lib/attitude';
import { readTake, takeKey } from '@/lib/takeCache';
import { FORMATS, canvasBlob, drawCard, type CardData, type CardFormat, type CardStyle } from '@/lib/shareCard';

const STYLES: { id: CardStyle; label: string; swatch: string }[] = [
  { id: 'sky', label: 'Sky', swatch: 'linear-gradient(135deg, var(--md-primary-container), var(--md-tertiary-container))' },
  { id: 'tomato', label: 'Tomato', swatch: 'linear-gradient(135deg, #fff1ea, #ffb4a1)' },
  { id: 'night', label: 'Night', swatch: 'linear-gradient(135deg, #2a1310, #120b0b)' },
];
type Say = 'quip' | 'take' | 'none';

export function ShareSheet({ weather, place, lat, lon, rainSoonMin, onClose, toast }: {
  weather: any; place: string; lat: number; lon: number; rainSoonMin: number | null; onClose: () => void; toast: (s: string) => void;
}) {
  const { t, spd, spdUnit, unit, attitude } = usePrefs();
  const [format, setFormat] = useState<CardFormat>('post');
  const [style, setStyle] = useState<CardStyle>('sky');
  const [say, setSay] = useState<Say>('quip');
  const [img, setImg] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const canvas = useRef<HTMLCanvasElement | null>(null);
  const c = weather.current, d = weather.daily;

  const url = useMemo(() => {
    const q = new URLSearchParams({ lat: lat.toFixed(4), lon: lon.toFixed(4), name: place, u: unit === 'imperial' ? 'f' : 'c' });
    return `${window.location.origin}/?${q}`;
  }, [lat, lon, place, unit]);

  const quip = tomatoVerdict({ tempC: c.temperatureC, feelsLikeC: c.feelsLikeC, precipMm: c.precipitation, windKmh: c.windKmh, uv: c.uvIndex, isDay: c.isDay, weatherCode: c.weatherCode, rainSoonMin }, attitude);
  const take = readTake(takeKey(weather, unit, attitude))?.insights?.[0] ?? null;
  const line = say === 'quip' ? quip : say === 'take' ? (take ?? quip) : null;
  const cond = condition(c.weatherCode, c.isDay).label;
  const text = `${place}: ${t(c.temperatureC)} and ${cond.toLowerCase()}.${line ? ` Tomato says: “${line}”` : ''} 🐇`;

  const data: CardData = useMemo(() => ({
    place, temp: t(c.temperatureC), condition: cond,
    date: new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: weather.timezone }),
    hiLo: d?.temperature_2m_max?.[0] != null ? `H ${t(d.temperature_2m_max[0])} · L ${t(d.temperature_2m_min[0])}` : '',
    metrics: [
      { k: 'Feels like', v: t(c.feelsLikeC) },
      { k: 'Wind', v: `${spd(c.windKmh)} ${spdUnit}` },
      { k: 'Humidity', v: `${Math.round(c.humidity ?? 0)}%` },
      { k: 'Rain today', v: `${d?.precipitation_probability_max?.[0] ?? 0}%` },
    ],
    line, mood: moodFor(c), isDay: c.isDay, url: new URL(window.location.origin).host,
  }), [place, c, d, cond, line, t, spd, spdUnit, weather.timezone]);

  useEffect(() => {
    let alive = true, made: string | null = null;
    // a fresh canvas per draw, so overlapping async draws can't paint over each other
    const el = document.createElement('canvas');
    drawCard(el, data, format, style).then(() => canvasBlob(el)).then(b => {
      if (!alive) return;
      canvas.current = el;
      made = URL.createObjectURL(b);
      setImg(old => { if (old) URL.revokeObjectURL(old); return made; });
    }).catch(() => {});
    return () => { alive = false; };
  }, [data, format, style]);
  useEffect(() => () => { setImg(old => { if (old) URL.revokeObjectURL(old); return null; }); }, []);

  const file = async () => new File([await canvasBlob(canvas.current!)], `tomato-${place.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'weather'}.png`, { type: 'image/png' });
  const run = async (id: string, fn: () => Promise<void | string>) => {
    setBusy(id);
    try { const msg = await fn(); if (msg) toast(msg); } catch (e: any) { if (e?.name !== 'AbortError') toast('That didn’t work, try another option'); } finally { setBusy(null); }
  };

  const canNative = typeof navigator !== 'undefined' && !!navigator.share;
  const canCopyImg = typeof window !== 'undefined' && 'ClipboardItem' in window;
  const enc = encodeURIComponent;
  const social = [
    { id: 'wa', label: 'WhatsApp', icon: 'chat', bg: '#25D366', href: `https://wa.me/?text=${enc(`${text}\n${url}`)}` },
    { id: 'tg', label: 'Telegram', icon: 'send', bg: '#2AABEE', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { id: 'x', label: 'X', glyph: '𝕏', bg: '#000', href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(url)}` },
    { id: 'bs', label: 'Bluesky', icon: 'cloud', bg: '#1185FE', href: `https://bsky.app/intent/compose?text=${enc(`${text} ${url}`)}` },
    { id: 'mail', label: 'Email', icon: 'mail', bg: 'var(--md-tertiary)', href: `mailto:?subject=${enc(`Weather in ${place}`)}&body=${enc(`${text}\n\n${url}`)}` },
  ];

  return (
    <Sheet title="Share" onClose={onClose} className="share-sheet"
      header={
        <div className="sheet-h">
          <span className="ibadge sh-cookie9" style={{ background: 'var(--tm-container)' }}><TomatoMark size={28} face mood="happy" /></span>
          <div className="grow"><h2 className="title-l">Share the weather</h2><p className="body-s muted">{place}</p></div>
          <button className="icon-btn state" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
      }>
      <div className="sheet-b share-b">
        <div className={`share-preview ${format}`}>
          {img ? <img src={img} alt={`Weather card for ${place}`} /> : <div className="skel" />}
        </div>

        <div className="share-opts">
          <div className="seg" role="group" aria-label="Format">
            {(Object.keys(FORMATS) as CardFormat[]).map(f => (
              <button key={f} className={`state ${format === f ? 'on' : ''}`} aria-pressed={format === f} onClick={() => setFormat(f)}>
                <Icon name={format === f ? 'check' : FORMATS[f].icon} className="sm" />{FORMATS[f].label}
              </button>
            ))}
          </div>
          <div className="swatches" role="group" aria-label="Look">
            {STYLES.map(s => (
              <button key={s.id} className={`swatch ${style === s.id ? 'on' : ''}`} style={{ background: s.swatch }} aria-pressed={style === s.id} aria-label={s.label} title={s.label} onClick={() => setStyle(s.id)}>
                {style === s.id && <Icon name="check" />}
              </button>
            ))}
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="label-l muted" style={{ marginRight: 4 }}>Tomato says</span>
          {([['quip', 'Quip'], ['take', 'Today’s take'], ['none', 'Nothing']] as [Say, string][]).map(([id, l]) => (
            <button key={id} className={`chip state ${say === id ? 'selected' : ''}`} disabled={id === 'take' && !take} onClick={() => setSay(id)}>
              {say === id && <Icon name="check" />}{l}
            </button>
          ))}
        </div>

        <div className="share-actions">
          {canNative && (
            <button className="btn filled state has-icon" disabled={!img || !!busy} onClick={() => run('native', async () => {
              const f = await file();
              await navigator.share(navigator.canShare?.({ files: [f] }) ? { files: [f], title: `Weather in ${place}`, text: `${text}\n${url}` } : { title: `Weather in ${place}`, text, url });
            })}><Icon name="ios_share" />Share…</button>
          )}
          <button className="btn tonal state has-icon" disabled={!img || !!busy} onClick={() => run('dl', async () => {
            const a = document.createElement('a'); a.href = img!; a.download = (await file()).name; a.click();
            return 'Image saved';
          })}><Icon name="download" />Save image</button>
          {canCopyImg && (
            <button className="btn tonal state has-icon" disabled={!img || !!busy} onClick={() => run('ci', async () => {
              await navigator.clipboard.write([new ClipboardItem({ 'image/png': canvasBlob(canvas.current!) })]);
              return 'Image copied';
            })}><Icon name="image" />Copy image</button>
          )}
        </div>

        <div className="share-social">
          {social.map(s => (
            <a key={s.id} className="soc state" href={s.href} target="_blank" rel="noopener noreferrer">
              <span className="soc-i" style={{ background: s.bg }}>{s.glyph ? <b>{s.glyph}</b> : <Icon name={s.icon!} fill />}</span>
              <span className="label-m">{s.label}</span>
            </a>
          ))}
        </div>

        <div className="share-link">
          <Icon name="link" />
          <input readOnly value={url} aria-label="Share link" onFocus={e => e.currentTarget.select()} />
          <button className="btn text state" onClick={() => run('link', async () => { await navigator.clipboard.writeText(url); return 'Link copied'; })}>Copy</button>
        </div>
        <button className="btn text state has-icon" style={{ alignSelf: 'flex-start' }} onClick={() => run('txt', async () => { await navigator.clipboard.writeText(`${text}\n${url}`); return 'Text copied'; })}>
          <Icon name="content_copy" />Copy as text
        </button>
      </div>
    </Sheet>
  );
}
