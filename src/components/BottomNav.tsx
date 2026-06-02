'use client';

import { Home, CalendarDays, Map, Star } from 'lucide-react';

export type Tab = 'today' | 'forecast' | 'map' | 'favorites';

const ITEMS: Array<{ id: Tab; label: string; Icon: any }> = [
  { id: 'today',     label: 'today',     Icon: Home },
  { id: 'forecast',  label: 'forecast',  Icon: CalendarDays },
  { id: 'map',       label: 'map',       Icon: Map },
  { id: 'favorites', label: 'saved',     Icon: Star },
];

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="bottomnav" aria-label="Sections">
      {ITEMS.map(({ id, label, Icon }) => (
        <button key={id} className={id === tab ? 'active' : ''} onClick={() => setTab(id)}>
          <Icon size={15} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
