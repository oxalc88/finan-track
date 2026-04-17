import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MobileHeaderProps {
  title: string;
  showBack?: boolean;
}

const NAV_ITEMS: readonly { to: string; label: string }[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/credit-cards', label: 'Credit Cards' },
  { to: '/cash-flow', label: 'Cash Flow' },
  { to: '/documents', label: 'Documents' },
  { to: '/conciliations', label: 'Conciliations' },
  { to: '/query', label: 'Ask' },
];

export default function MobileHeader({
  title,
  showBack = false,
}: MobileHeaderProps): JSX.Element {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm sticky top-0 z-10">
      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 active:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-neutral-700"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
                role="img"
                aria-hidden="true"
              >
                <title>Back arrow</title>
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Toggle navigation"
            aria-expanded={menuOpen}
            className="ml-auto p-2 -mr-2 active:bg-neutral-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-neutral-700"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
              role="img"
              aria-hidden="true"
            >
              <title>Menu</title>
              {menuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-neutral-200 bg-white">
          <ul className="flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'block px-6 py-3 text-sm font-medium',
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-neutral-700 active:bg-neutral-100'
                    )
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
