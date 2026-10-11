// Tomato, the red rabbit: brand mark + mascot. Geometry lives in lib/rabbit.ts; the mascot's face and ears follow the sky.
import { useId, useMemo, type CSSProperties } from 'react';
import { rabbitSvg, type Mood } from '@/lib/rabbit';

export { moodFor } from '@/lib/rabbit';
export type { Mood };

export function TomatoMark({ size = 40, face = false, mood = 'happy', className = '', style, title }: {
  size?: number; face?: boolean; mood?: Mood; className?: string; style?: CSSProperties; title?: string;
}) {
  // unique per instance: a duplicate gradient id inside a display:none subtree renders as no fill
  const id = 'tm' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const html = useMemo(() => rabbitSvg({ id, face, mood, whiskers: face && size >= 44 }), [id, face, mood, size]);
  return (
    <svg width={size} height={size} viewBox="0 0 128 128" className={`rabbit ${className}`} style={style} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}
