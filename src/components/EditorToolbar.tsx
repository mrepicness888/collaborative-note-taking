import { Editor } from "@tiptap/react"

interface Props {
  editor: Editor | null
  disabled?: boolean
}




export default function EditorToolbar({ editor, disabled }: Props) {
  if (!editor) return null
    const headingLevels: (1 | 2 | 3)[] = [1, 2, 3]
  const btn = (active: boolean) =>
    `toolbar-button ${active ? "active" : ""}`

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

      <span className="toolbar-divider" />

        {headingLevels.map(level => (
        <button
            key={level}
            className={btn(editor.isActive("heading", { level }))}
            onClick={() =>
            editor.chain().focus().toggleHeading({ level }).run()
            }
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
    </div>
  )
}
