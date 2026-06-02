'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'tomato:installPromptDismissed';

export default function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = typeof window !== 'undefined' && localStorage.getItem(DISMISS_KEY);
    if (dismissed) return;
    const onBIP = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  if (!visible || !evt) return null;

  return (
    <div className="install-prompt" role="dialog" aria-label="Install Tomato">
      <div className="install-prompt__body">
        <span className="install-prompt__title">Install Tomato</span>
        <span className="install-prompt__sub">Add to home screen for offline + fast launch.</span>
      </div>
      <div className="install-prompt__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={async () => {
            await evt.prompt();
            await evt.userChoice;
            setVisible(false);
          }}
        >
          <Download size={14} /> Install
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Dismiss"
          onClick={() => {
            localStorage.setItem(DISMISS_KEY, '1');
            setVisible(false);
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
