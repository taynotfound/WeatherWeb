'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, Sheet } from './ui';
import { TomatoMark, moodFor } from './Tomato';
import { usePrefs } from '@/lib/prefs';
import { ATTITUDE_LABELS } from '@/lib/attitude';

type Msg = { role: 'user' | 'assistant'; content: string };
const SUGGEST = ['What should I wear?', 'Will it rain today?', 'Best time for a run?', 'Good laundry day?', 'How\'s tomorrow?'];

export function TomatoFab({ onClick, variant, compact = false }: { onClick: () => void; variant: 'rail' | 'float'; compact?: boolean }) {
  return (
    <button className={`fab state ${variant} ${compact ? 'compact' : ''}`} onClick={onClick} aria-label="Ask Tomato">
      <TomatoMark size={32} face mood="happy" /><span className="fab-label">Ask Tomato</span>
    </button>
  );
}

export function TomatoChat({ weather, rainSoonMin, onClose }: { weather: any; rainSoonMin: number | null; onClose: () => void }) {
  const { attitude, unit } = usePrefs();
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tomato-chat') || '[]'); } catch { return []; }
  });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
    try { sessionStorage.setItem('tomato-chat', JSON.stringify(msgs.slice(-20))); } catch {}
  }, [msgs, busy]);
  // focus without popping the keyboard over the sheet's opening animation on phones
  useEffect(() => { const id = setTimeout(() => { if (window.matchMedia('(pointer: fine)').matches) input.current?.focus(); }, 350); return () => clearTimeout(id); }, []);

  async function send(q = text) {
    q = q.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await fetch('/api/tomato', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: next, weather, attitude, unit, rainSoonMin }) });
      const j = await r.json();
      setMsgs(m => [...m, { role: 'assistant', content: j.reply ?? '…' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'I wilted for a second. Try again.' }]);
    } finally { setBusy(false); }
  }

  const mood = busy ? 'think' : moodFor(weather?.current);
  const place = weather?.location?.name;
  return (
    <Sheet title="Ask Tomato" onClose={onClose} className="chat-sheet"
      header={
        <div className="chat-head">
          <TomatoMark size={44} face mood={mood} />
          <div className="grow">
            <div className="who">Tomato</div>
            <div className="status"><i />{busy ? 'thinking…' : `${ATTITUDE_LABELS[attitude]} mode${place ? ` · ${place}` : ''}`}</div>
          </div>
          {msgs.length > 0 && <button className="icon-btn state" aria-label="Clear chat" title="Clear chat" onClick={() => setMsgs([])}><Icon name="delete_sweep" /></button>}
          <button className="icon-btn state" onClick={onClose} aria-label="Close"><Icon name="close" /></button>
        </div>
      }
      footer={
        <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
          <input ref={input} placeholder="Ask about the weather…" value={text} onChange={e => setText(e.target.value)} aria-label="Message" enterKeyHint="send" />
          <button type="submit" className="send" disabled={busy || !text.trim()} aria-label="Send"><Icon name="arrow_upward" /></button>
        </form>
      }>
      <div className="chat" ref={scroller} aria-live="polite">
        {msgs.length === 0 && (
          <div className="chat-hello">
            <TomatoMark size={96} face mood={moodFor(weather?.current)} />
            <div className="hi">Hi, I&apos;m Tomato.</div>
            <p className="body-m muted" style={{ maxWidth: '36ch' }}>A small round weather expert with opinions. I can see your forecast{place ? ` for ${place}` : ''}. Ask me anything.</p>
            <div className="suggest">{SUGGEST.map(s => <button key={s} className="chip state" onClick={() => send(s)}>{s}</button>)}</div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`msg-row ${m.role === 'user' ? 'user' : 'bot'}`}>
            {m.role === 'assistant' && <TomatoMark size={28} face mood={moodFor(weather?.current)} />}
            <div className="msg">{m.content}</div>
          </div>
        ))}
        {busy && <div className="msg-row bot"><TomatoMark size={28} face mood="think" /><div className="msg"><span className="typing"><i /><i /><i /></span></div></div>}
      </div>
    </Sheet>
  );
}
