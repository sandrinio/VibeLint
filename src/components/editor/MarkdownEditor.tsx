import { useRef, useEffect } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
} from '@codemirror/view';
import { markdown } from '@codemirror/lang-markdown';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { bracketMatching } from '@codemirror/language';
import {
  searchKeymap,
  highlightSelectionMatches,
} from '@codemirror/search';

interface MarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const editorTheme = EditorView.theme({
  '&': { height: '100%', fontSize: '14px' },
  '.cm-content': {
    fontFamily: 'ui-monospace, monospace',
    padding: '8px 0',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-primary)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--bg-tertiary)',
  },
  '.cm-activeLine': {
    backgroundColor: 'var(--bg-tertiary)',
  },
});

export function MarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className = '',
}: MarkdownEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        markdown(),
        lineNumbers(),
        bracketMatching(),
        history(),
        highlightActiveLine(),
        highlightSelectionMatches(),
        keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        editorTheme,
        EditorView.editable.of(!readOnly),
        EditorState.readOnly.of(readOnly),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // Only run on mount/unmount -- value sync handled separately below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Sync external value changes into the editor without losing cursor position
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentDoc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-auto bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}
    />
  );
}

export default MarkdownEditor;
