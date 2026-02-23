import { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from 'tiptap-markdown';

interface RichMarkdownEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

export function RichMarkdownEditor({
  value,
  onChange,
  readOnly = false,
  className = '',
}: RichMarkdownEditorProps) {
  const isExternalUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value,
    editable: !readOnly,
    onUpdate: ({ editor: ed }) => {
      if (isExternalUpdate.current) return;
      const md = ed.storage.markdown.getMarkdown();
      onChange?.(md);
    },
  });

  // Sync external value changes (e.g. switching skills)
  useEffect(() => {
    if (!editor) return;
    const currentMd = editor.storage.markdown.getMarkdown();
    if (currentMd !== value) {
      isExternalUpdate.current = true;
      editor.commands.setContent(value);
      isExternalUpdate.current = false;
    }
  }, [value, editor]);

  // Sync readOnly
  useEffect(() => {
    if (editor) {
      editor.setEditable(!readOnly);
    }
  }, [readOnly, editor]);

  return (
    <div className={`rich-editor overflow-auto bg-[var(--bg-primary)] text-[var(--text-primary)] ${className}`}>
      <EditorContent editor={editor} className="h-full" />
    </div>
  );
}

export default RichMarkdownEditor;
