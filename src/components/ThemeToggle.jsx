import { useTheme } from '../context/ThemeContext';

function SunIcon() {
  return (
    <svg
      className="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.75v2.1M12 19.15v2.1M5.46 5.46l1.49 1.49M17.05 17.05l1.49 1.49M2.75 12h2.1M19.15 12h2.1M5.46 18.54l1.49-1.49M17.05 6.95l1.49-1.49" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="theme-toggle__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20.25 14.2A8.75 8.75 0 0 1 9.8 3.75a8.95 8.95 0 1 0 10.45 10.45Z" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const toggleLabel = nextTheme === 'light' ? 'Light' : 'Dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      {nextTheme === 'light' ? <SunIcon /> : <MoonIcon />}
      <span className="theme-toggle__label">{toggleLabel}</span>
    </button>
  );
}
