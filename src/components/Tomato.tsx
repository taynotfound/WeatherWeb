'use client';

import { useState } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };

export function Tomato({ weather }: { weather: any }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = text.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs(next);
    setText('');
    setBusy(true);
    try {
      const r = await fetch('/api/tomato', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ messages: next, weather }),
      });
      const j = await r.json();
      setMsgs(m => [...m, { role: 'assistant', content: j.reply ?? '…' }]);
    } catch {
      setMsgs(m => [...m, { role: 'assistant', content: 'I died for a second. Try again.' }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="tomato-fab" onClick={() => setOpen(true)} aria-label="Open Tomato">
        <MessageSquare size={14} />
        Ask Tomato
      </button>
    );
  }

  return (
    <div className="tomato-panel" role="dialog" aria-label="Tomato">
      <div className="tomato-head">
        <strong style={{ fontSize: 14 }}>Tomato</strong>
        <button className="btn-icon" onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
      </div>
      <div className="tomato-body">
        {msgs.length === 0 && (
          <p style={{ color: 'var(--ink-mute)', fontSize: 13 }}>Ask anything about the weather. I'm a sentient tomato and slightly sharp.</p>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`tomato-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>
        ))}
        {busy && <div className="tomato-msg bot" style={{ color: 'var(--ink-mute)' }}>…</div>}
      </div>
      <div className="tomato-foot">
        <input
          className="input"
          placeholder="Type a question"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          style={{ padding: '8px 10px' }}
        />
        <button className="btn btn-primary" onClick={send} disabled={busy} aria-label="Send"><Send size={14} /></button>
      </div>
    </div>
  );
}
