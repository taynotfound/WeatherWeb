'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';

export function Icon({ name, fill, className = '', style }: { name: string; fill?: boolean; className?: string; style?: React.CSSProperties }) {
  return <span className={`ms ${fill ? 'fill' : ''} ${className}`} style={style} aria-hidden="true">{name}</span>;
}

export type Shape = 'cookie7' | 'cookie9' | 'cookie12' | 'sunny' | 'clover' | 'flower' | 'burst';

export function Card({ title, icon, shape = 'cookie9', sub, tone, className = '', action, children, id }: {
  title?: string; icon?: string; shape?: Shape; sub?: string; tone?: 'primary' | 'tertiary' | 'secondary' | 'error' | 'low' | 'high' | 'brand';
  className?: string; action?: ReactNode; children: ReactNode; id?: string;
}) {
  return (
    <section id={id} className={`card ${tone ?? ''} ${className}`}>
      {title && (
        <header className="card-h">
          {icon && <span className={`ibadge sh-${shape}`}><Icon name={icon} /></span>}
          <div className="grow">
            <h2>{title}</h2>
            {sub && <p className="sub">{sub}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/** Element size in CSS px, so charts can draw at 1:1 instead of scaling text with a viewBox. */
export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, number, number] {
  const ref = useRef<T>(null);
  const [sz, setSz] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setSz([Math.round(e.contentRect.width), Math.round(e.contentRect.height)]));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, sz[0], sz[1]];
}
export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const [ref, w] = useSize<T>();
  return [ref, w];
}

export function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button role="switch" aria-checked={on} aria-label={label} className="switch" onClick={() => onChange(!on)} />;
}

export function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string; icon?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg" role="group">
      {options.map(o => (
        <button key={o.id} className={`state ${value === o.id ? 'on' : ''}`} onClick={() => onChange(o.id)} aria-pressed={value === o.id}>
          {value === o.id ? <Icon name="check" className="sm" /> : o.icon ? <Icon name={o.icon} className="sm" /> : null}{o.label}
        </button>
      ))}
    </div>
  );
}

function useEscape(onClose: () => void) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [onClose]);
}

export function Sheet({ title, icon, onClose, children, footer, header, className = '' }: {
  title: string; icon?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; header?: ReactNode; className?: string;
}) {
  useEscape(onClose);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className={`sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        {header ?? (
          <div className="sheet-h">
            {icon && <span className="ibadge sh-cookie9"><Icon name={icon} /></span>}
            <h2 className="title-l grow">{title}</h2>
            <button className="icon-btn state" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
          </div>
        )}
        {header ? children : <div className="sheet-b">{children}</div>}
        {footer}
      </div>
    </>
  );
}

export function Dialog({ title, icon, onClose, children }: { title: string; icon?: string; onClose: () => void; children: ReactNode }) {
  useEscape(onClose);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <>
      <div className="scrim" onClick={onClose} />
      <div className="dialog" role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>
        <div className="row">
          {icon && <Icon name={icon} style={{ color: 'var(--md-secondary)' }} />}
          <h2 className="headline-s grow">{title}</h2>
          <button className="icon-btn state" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
        {children}
      </div>
    </>
  );
}

export function Snack({ text }: { text: string | null }) {
  return text ? <div className="snack body-m" role="status">{text}</div> : null;
}

export const fmtTime = (iso?: string | null, opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' }) =>
  iso ? new Date(iso).toLocaleTimeString([], opts) : '–';
// Open-Meteo returns local wall-clock strings (no offset); parse as-is without tz shifting.
export const localParts = (iso: string) => {
  const [d, t = '00:00'] = iso.split('T');
  const [y, mo, da] = d.split('-').map(Number);
  const [h, mi] = t.split(':').map(Number);
  return { y, mo, da, h, mi };
};
export const hour12 = (iso: string) => { const { h } = localParts(iso); return `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`; };
export const hhmm = (iso?: string | null) => { if (!iso) return '–'; const { h, mi } = localParts(iso); return `${h % 12 || 12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`; };
export const dayName = (iso: string, i = 1) => {
  if (i === 0) return 'Today';
  const { y, mo, da } = localParts(iso);
  return new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'short' });
};
export const dayLong = (iso: string) => { const { y, mo, da } = localParts(iso); return new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }); };
