import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface FilePreviewProps {
  content: string;
  className?: string;
}

// Configure marked for synchronous parsing
marked.use({ async: false });

export default function FilePreview({
  content,
  className = '',
}: FilePreviewProps) {
  const sanitizedHtml = useMemo(() => {
    const rawHtml = marked.parse(content, { async: false }) as string;
    return DOMPurify.sanitize(rawHtml);
  }, [content]);

  return (
    <div
      className={`overflow-auto p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      style={{
        lineHeight: '1.7',
      }}
    />
  );
}
