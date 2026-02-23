import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wand2,
  FileText,
  BookOpen,
  ScanSearch,
  GitPullRequest,
  TrendingUp,
  FileCheck,
  Settings,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: 'Main',
    items: [
      { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
      { to: '/setup', label: 'Setup Wizard', icon: <Wand2 size={16} /> },
    ],
  },
  {
    title: 'Editor',
    items: [
      { to: '/skills', label: 'Skills', icon: <BookOpen size={16} /> },
      { to: '/rules', label: 'Rules', icon: <FileText size={16} /> },
    ],
  },
  {
    title: 'Analysis',
    items: [
      { to: '/analysis', label: 'Analysis', icon: <ScanSearch size={16} /> },
      { to: '/pr', label: 'PR Navigator', icon: <GitPullRequest size={16} /> },
      { to: '/trends', label: 'Trends', icon: <TrendingUp size={16} /> },
      { to: '/docs-status', label: 'Docs Status', icon: <FileCheck size={16} /> },
    ],
  },
];

const linkBase =
  'flex items-center gap-2.5 rounded-[6px] px-3 py-2 text-[0.875rem] no-underline transition-colors duration-100 border-l-2';

const linkInactive =
  `${linkBase} border-l-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]`;

const linkActive =
  `${linkBase} border-l-[var(--accent-primary)] bg-[var(--accent-subtle)] font-medium text-[var(--accent-primary)]`;

export function Sidebar() {
  return (
    <aside className="fixed top-12 left-0 bottom-0 z-20 flex w-[220px] flex-col border-r border-[var(--border-primary)] bg-[var(--bg-secondary)]">
      <nav className="flex-1 overflow-y-auto p-3">
        {sections.map((section) => (
          <div key={section.title} className="mb-4">
            <h3 className="mb-2 mt-3 px-3 text-[0.6875rem] font-medium uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
              {section.title}
            </h3>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      isActive ? linkActive : linkInactive
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-[var(--border-primary)] p-3">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? linkActive : linkInactive
          }
        >
          <Settings size={16} />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}
