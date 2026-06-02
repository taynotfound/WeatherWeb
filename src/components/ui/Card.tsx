// Shared UI primitives. Use these instead of one-off styles.
import { ReactNode } from 'react';

type CardProps = {
  id?: string;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  tone?: 'default' | 'good' | 'fair' | 'poor' | 'warn' | 'severe';
  children: ReactNode;
  className?: string;
};

export function Card({ id, title, subtitle, icon, action, tone = 'default', children, className = '' }: CardProps) {
  return (
    <section id={id} className={`card card--${tone} ${className}`} aria-labelledby={id ? `${id}-h` : undefined}>
      {(title || action) && (
        <header className="card__header">
          <div className="card__title-wrap">
            {icon && <span className="card__icon" aria-hidden>{icon}</span>}
            <div>
              {title && <h2 id={id ? `${id}-h` : undefined} className="card__title">{title}</h2>}
              {subtitle && <p className="card__subtitle">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="card__action">{action}</div>}
        </header>
      )}
      <div className="card__body">{children}</div>
    </section>
  );
}

export function Pill({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'good' | 'fair' | 'poor' | 'warn' | 'severe' }) {
  return <span className={`pill pill--${tone}`}>{children}</span>;
}

export function Stat({ label, value, hint }: { label: ReactNode; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {hint && <div className="stat__hint">{hint}</div>}
    </div>
  );
}
