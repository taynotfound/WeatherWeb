'use client';

import { useEffect, useRef, useState } from 'react';
import { Icon, Sheet } from './ui';
import { usePrefs } from '@/lib/prefs';

type Msg = { role: 'user' | 'assistant'; content: string };
const SUGGEST = ['What should I wear?', 'Will it rain today?', 'Best time to go out?', 'Is it a good laundry day?'];

export function TomatoFab({ onClick }: { onClick: () => void }) {
  return (
    <button className="fab state" onClick={onClick} aria-label="Ask Tomato"><span className="tomato-emoji">🍅</span>Ask Tomato</button>
  );
}

export function TomatoChat({ weather, onClose }: { weather: any; onClose: () => void }) {
  const { attitude } = usePrefs();
  const [msgs, setMsgs] = useState<Msg[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('tomato-chat') || '[]'); } catch { return []; }
  });
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); try { sessionStorage.setItem('tomato-chat', JSON.stringify(msgs.slice(-20))); } catch {} }, [msgs, busy]);

  async function send(q = text) {
    q = q.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next); setText(''); setBusy(true);
    try {
      const r = await fetch('/api/tomato', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: next, weather, attitude }) });
      const j = await r.json();
      setMsgs(m => [...m, { role: 'assistant', content: j.reply ?? '…' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'I wilted for a second. Try again.' }]);
    } finally { setBusy(false); }
  }

  return (
    <Sheet title="Tomato" icon="chat_bubble" onClose={onClose}
      footer={
        <form className="composer" onSubmit={e => { e.preventDefault(); send(); }}>
          <input autoFocus placeholder="Ask about the weather…" value={text} onChange={e => setText(e.target.value)} aria-label="Message" />
          <button type="submit" className="icon-btn filled" style={{ width: 48, height: 48 }} disabled={busy || !text.trim()} aria-label="Send"><Icon name="send" fill /></button>
        </form>
      }>
      <div className="chat" aria-live="polite">
        {msgs.length === 0 && (
          <>
            <div className="msg bot">Hi. I'm Tomato, a small round weather expert with opinions. I can see your forecast. Ask me anything.</div>
            <div className="chips" style={{ marginTop: 4 }}>{SUGGEST.map(s => <button key={s} className="chip state" onClick={() => send(s)}>{s}</button>)}</div>
          </>
        )}
        {msgs.map((m, i) => <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>)}
        {busy && <div className="msg bot"><span className="typing"><i /><i /><i /></span></div>}
        <div ref={end} />
      </div>
    </Sheet>
  );
}
