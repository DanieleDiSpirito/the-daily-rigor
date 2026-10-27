import { dayNumber, formatDay, isReleased, msUntilTomorrow, pools } from './lib/daily';
import { href, useNow, useRoute } from './lib/router';
import type { SectionId } from './types';
import { Home } from './pages/Home';
import { MathPage } from './pages/MathPage';
import { CodePage } from './pages/CodePage';
import { PaperPage } from './pages/PaperPage';
import { Archive } from './pages/Archive';
import { Login } from './pages/Login';
import { authEnabled, signOut, useAuth } from './lib/auth';
import { useTheme } from './lib/theme';

const NAV: { to: string; label: string; section?: SectionId }[] = [
  { to: '', label: 'Today' },
  { to: 'math', label: 'I · Problem', section: 'math' },
  { to: 'code', label: 'II · Algorithm', section: 'code' },
  { to: 'papers', label: 'III · Paper', section: 'papers' },
  { to: 'archive', label: 'Archive' },
];

function countdown(ms: number) {
  const h = Math.floor(ms / 3_600_000), m = Math.floor((ms % 3_600_000) / 60_000);
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

export default function App() {
  const auth = useAuth();
  const [theme, toggleTheme] = useTheme();
  const route = useRoute();
  const now = useNow();
  const today = dayNumber(now);
  const [head, id] = route;

  let page;
  const locked = authEnabled && auth.status !== 'in';
  const known = (s: SectionId) => !id || (pools[s].some((x) => x.id === id) && isReleased(s, id, today));
  if (head === 'math' && known('math')) page = <MathPage today={today} id={id} />;
  else if (head === 'code' && known('code')) page = <CodePage today={today} id={id} />;
  else if (head === 'papers' && known('papers')) page = <PaperPage today={today} id={id} />;
  else if (head === 'archive') page = <Archive today={today} />;
  else page = <Home today={today} />;
  if (locked) page = <Login state={auth} />;

  const active = head && ['math', 'code', 'papers', 'archive'].includes(head) ? head : '';

  return (
    <div className="shell">
      <header className="masthead">
        <div className="masthead-meta">
          <span>No. {today + 1}</span>
          <span>{formatDay(today)}</span>
          <span>Next edition in {countdown(msUntilTomorrow(now))}</span>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? '☀ Light' : '☾ Dark'}
          </button>
          {authEnabled && auth.status === 'in' && (
            <span>
              {auth.user.email} · <button className="linklike" onClick={() => signOut()}>sign out</button>
            </span>
          )}
        </div>
        <a href={href()} className="masthead-title">
          The Daily Rigor
        </a>
        <p className="masthead-sub">A daily exercise in mathematics, algorithms and scholarship</p>
        <nav className="nav">
          {NAV.map((n) => (
            <a key={n.to} href={href(n.to)} className={active === n.to ? 'active' : ''}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main key={route.join('/') + today}>{page}</main>
      <footer className="colophon">
        <p>
          The Daily Rigor · early access edition. {authEnabled ? 'Your progress is saved to your account.' : 'Progress is stored in this browser only.'} A new set of challenges is released every day at midnight, local time.
        </p>
      </footer>
    </div>
  );
}
