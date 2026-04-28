import { Editor } from "@tiptap/react";
import { useCallback } from "react";

interface Props {
  editor: Editor | null;
  disabled?: boolean;
}

export default function EditorToolbar({ editor, disabled }: Props) {
  const onInsertInlineMath = useCallback(() => {
    if (!editor) return;
    const hasSelection = !editor.state.selection.empty;

    if (hasSelection) {
      const latex = editor.state.doc.textBetween(
        editor.state.selection.from,
        editor.state.selection.to,
      );

      editor.chain().focus().insertInlineMath({ latex }).run();
    } else {
      const latex = prompt("Enter block math expression:", "");
      if (latex) {
        return editor?.chain().insertInlineMath({ latex }).focus().run();
      }
    }
  }, [editor]);

  const onRemoveInlineMath = useCallback(() => {
    editor?.chain().deleteInlineMath().focus().run();
  }, [editor]);

  const onInsertBlockMath = useCallback(() => {
    const latex = prompt("Enter block math expression:", "");
    if (latex) {
      return editor?.chain().insertBlockMath({ latex }).focus().run();
    }
  }, [editor]);

  const onRemoveBlockMath = useCallback(() => {
    editor?.chain().deleteBlockMath().focus().run();
  }, [editor]);

  if (!editor) {
    return null;
  }
  const headingLevels: (1 | 2 | 3)[] = [1, 2, 3];
  const btn = (active: boolean) => `toolbar-button ${active ? "active" : ""}`;

  return (
    <div className="editor-toolbar">
      <button
        className={btn(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={disabled}
      >
        B
      </button>

      <button
        className={btn(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={disabled}
      >
        I
      </button>

      <button
        className={btn(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        disabled={disabled}
      >
        U
      </button>

      <select
        onChange={(e) => {
          const size = e.target.value
          if (size === "default") {
            editor.chain().focus().unsetFontSize().run()
          } else {
            editor.chain().focus().setFontSize(size).run()
          }
        }}
        defaultValue="default"
      >
        <option value="default">Font Size</option>
        <option value="12px">12px</option>
        <option value="16px">16px</option>
        <option value="20px">20px</option>
        <option value="28px">28px</option>
      </select>

      <span className="toolbar-divider" />

      {headingLevels.map((level) => (
        <button
          key={level}
          className={btn(editor.isActive("heading", { level }))}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          disabled={disabled}
        >
          H{level}
        </button>
      ))}

      <span className="toolbar-divider" />

      <button
        className={btn(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        disabled={disabled}
      >
        • List
      </button>

      <button
        className={btn(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        disabled={disabled}
      >
        1. List
      </button>

      <span className="toolbar-divider" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo() || disabled}
      >
        Undo
      </button>

      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo() || disabled}
      >
        Redo
      </button>
      <button type="button" onClick={onInsertInlineMath}>
        Insert inline math
      </button>

      <button onClick={onRemoveInlineMath}>Remove inline math</button>

      <button onClick={onInsertBlockMath}>Insert block math</button>

      <button onClick={onRemoveBlockMath}>Remove block math</button>
    </div>
  );
}
