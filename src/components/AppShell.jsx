import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function AppShell({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-shell">
      <header className="shell-rail" aria-label="Application chrome">
        <Link className="brand-lockup" to="/">
          <span className="brand-lockup__mark" aria-hidden="true">
            <span className="brand-lockup__slice" />
          </span>
          <span className="brand-lockup__copy">
            <strong>Daniel J Invoice</strong>
          </span>
        </Link>

        <div className="shell-rail__meta">
          <span className="shell-rail__route">
            {isHome ? 'Invoice desk' : 'Invoice detail'}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <main className="shell-stage">{children}</main>
    </div>
  );
}
