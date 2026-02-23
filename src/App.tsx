import { Routes, Route } from 'react-router-dom';
import { Shell } from './components/layout/Shell';
import Dashboard from './pages/Dashboard';
import { SetupWizard } from './pages/SetupWizard.tsx';
import SkillsEditor from './pages/SkillsEditor';
import RulesEditor from './pages/RulesEditor';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-[1200px]">
      <h1 className="mb-6 text-[1.25rem] font-semibold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="text-[var(--text-tertiary)]">This page is under construction.</p>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/setup" element={<SetupWizard />} />
        <Route path="/skills" element={<SkillsEditor />} />
        <Route path="/rules" element={<RulesEditor />} />
        <Route path="/analysis" element={<PlaceholderPage title="Analysis" />} />
        <Route path="/pr" element={<PlaceholderPage title="PR Navigator" />} />
        <Route path="/trends" element={<PlaceholderPage title="Trends" />} />
        <Route path="/docs-status" element={<PlaceholderPage title="Docs Status" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/changelog" element={<PlaceholderPage title="Changelog" />} />
      </Routes>
    </Shell>
  );
}
