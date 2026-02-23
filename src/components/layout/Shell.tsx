import type { ReactNode } from 'react';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';

interface ShellProps {
  children: ReactNode;
}

export function Shell({ children }: ShellProps) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <TopNav />
      <Sidebar />
      <main className="ml-[220px] mt-12 p-6">{children}</main>
    </div>
  );
}
