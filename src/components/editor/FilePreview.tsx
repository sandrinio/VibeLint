import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface FilePreviewProps {
  content: string;
  className?: string;
}

// Configure marked for synchronous parsing
marked.use({ async: false });

/**
 * Map each top-level HTML block back to its source line number.
 * We split the markdown source into lines, then walk the tokens
 * produced by marked's lexer — each token carries a raw string
 * that we can match against the source to find its starting line.
 */
function addLineNumbers(content: string): string {
  const tokens = marked.lexer(content);
  const lines = content.split('\n');

  // Build a lookup: for each char offset → line number
  const offsetToLine: number[] = [];
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    offsetToLine.push(offset);
    offset += lines[i].length + 1; // +1 for \n
  }

  function charOffsetToLine(charOffset: number): number {
    for (let i = offsetToLine.length - 1; i >= 0; i--) {
      if (charOffset >= offsetToLine[i]) return i + 1; // 1-indexed
    }
    return 1;
  }

  // Walk tokens and find their position in source
  let searchFrom = 0;
  const blocks: string[] = [];

  for (const token of tokens) {
    if (token.type === 'space') continue;

    const raw = token.raw;
    const idx = content.indexOf(raw, searchFrom);
    const lineNum = idx >= 0 ? charOffsetToLine(idx) : '';
    if (idx >= 0) searchFrom = idx + raw.length;

    // Count how many source lines this token spans
    const rawLines = raw.split('\n').filter((l: string) => l !== '' || raw.endsWith('\n')).length;
    const endLine = lineNum && rawLines > 1 ? Number(lineNum) + rawLines - 1 : '';

    const html = DOMPurify.sanitize(
      marked.parser([token] as ReturnType<typeof marked.lexer>),
    );

    const lineLabel = endLine && endLine !== lineNum
      ? `${lineNum}-${endLine}`
      : `${lineNum}`;

    blocks.push(
      `<div class="preview-line-row">` +
        `<span class="preview-line-gutter">${lineLabel}</span>` +
        `<div class="preview-line-content">${html}</div>` +
      `</div>`,
    );
  }

  return blocks.join('');
}

export default function FilePreview({
  content,
  className = '',
}: FilePreviewProps) {
  const html = useMemo(() => addLineNumbers(content), [content]);

  return (
    <div
      className={`preview-container overflow-auto p-4 bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
