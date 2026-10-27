import type { ReactNode } from 'react';
import type { SectionId } from '../types';
import { formatDay, SECTION_META } from '../lib/daily';
import { href } from '../lib/router';

export function ChallengeHeading({ section, isDaily, today, title, meta }: { section: SectionId; isDaily: boolean; today: number; title: string; meta: ReactNode }) {
  const m = SECTION_META[section];
  return (
    <div className="challenge-heading">
      <div className="kicker">
        <span className="numeral">{m.numeral}</span>
        {isDaily ? `${m.label} of the day · ${formatDay(today, { day: 'numeric', month: 'long', year: 'numeric' })}` : `${m.label} · practice from the archive`}
        {!isDaily && (
          <a className="kicker-link" href={href(section)}>
            Go to today’s {m.label.toLowerCase()} →
          </a>
        )}
      </div>
      <h1>{title}</h1>
      <div className="meta-row">{meta}</div>
    </div>
  );
}

export function Badge({ children, tone }: { children: ReactNode; tone?: 'ok' | 'bad' | 'muted' | 'accent' }) {
  return <span className={`badge ${tone ?? ''}`}>{children}</span>;
}
