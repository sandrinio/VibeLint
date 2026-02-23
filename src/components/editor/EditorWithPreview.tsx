import { useState } from 'react';
import MarkdownEditor from './MarkdownEditor';
import FilePreview from './FilePreview';

interface EditorWithPreviewProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  layout?: 'side-by-side' | 'tabbed';
  className?: string;
}

type Tab = 'edit' | 'preview';

export default function EditorWithPreview({
  value,
  onChange,
  readOnly = false,
  layout = 'tabbed',
  className = '',
}: EditorWithPreviewProps) {
  const [activeTab, setActiveTab] = useState<Tab>('edit');

  if (layout === 'side-by-side') {
    return (
      <div className={`flex h-full ${className}`}>
        <div className="flex-1 min-w-0 border-r border-[var(--border-primary)]">
          <MarkdownEditor
            value={value}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
        <div className="flex-1 min-w-0">
          <FilePreview content={value} className="h-full" />
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors duration-100 cursor-pointer ${
            activeTab === 'edit'
              ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]'
              : 'text-[var(--text-tertiary)] border-b-2 border-transparent hover:text-[var(--text-secondary)]'
          }`}
          onClick={() => setActiveTab('edit')}
        >
          Edit
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium transition-colors duration-100 cursor-pointer ${
            activeTab === 'preview'
              ? 'text-[var(--accent-primary)] border-b-2 border-[var(--accent-primary)] bg-[var(--bg-primary)]'
              : 'text-[var(--text-tertiary)] border-b-2 border-transparent hover:text-[var(--text-secondary)]'
          }`}
          onClick={() => setActiveTab('preview')}
        >
          Preview
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {activeTab === 'edit' ? (
          <MarkdownEditor
            value={value}
            onChange={onChange}
            readOnly={readOnly}
            className="h-full"
          />
        ) : (
          <FilePreview content={value} className="h-full" />
        )}
      </div>
    </div>
  );
}
