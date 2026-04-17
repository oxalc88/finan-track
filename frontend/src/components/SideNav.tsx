import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

const ITEMS: readonly { to: string; label: string; icon: string }[] = [
  { to: '/', label: 'Dashboard', icon: '📊' },
  { to: '/accounts', label: 'Accounts', icon: '🏦' },
  { to: '/credit-cards', label: 'Credit Cards', icon: '💳' },
  { to: '/cash-flow', label: 'Cash Flow', icon: '💸' },
  { to: '/documents', label: 'Documents', icon: '📄' },
  { to: '/conciliations', label: 'Conciliations', icon: '🔁' },
  { to: '/query', label: 'Ask', icon: '❓' },
];

export default function SideNav(): JSX.Element {
  return (
    <nav className="hidden lg:flex flex-col gap-1 w-56 border-r border-neutral-200 bg-white py-6 px-3 shrink-0">
      <h2 className="text-lg font-bold text-neutral-900 px-3 mb-4">
        FinanTrack
      </h2>
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-50 text-primary-700'
                : 'text-neutral-700 hover:bg-neutral-100'
            )
          }
        >
          <span aria-hidden="true">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
