import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import { type Text, type Doc } from "yjs"
import { useEffect } from "react"
import EditorToolbar from "./EditorToolbar"

interface Props {
  ydoc: Doc  
  ytext: Text 
  editable: boolean
}

export default function RichTextEditor({ ydoc, editable }: Props) {
  const editor = useEditor({
    editable,
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
    ],
  })

  useEffect(() => {
    if (!editor) return
    editor.setEditable(editable)
  }, [editor, editable])

  if (!editor) return <div>Loading editor…</div>

  return (
    <>
      <EditorToolbar editor={editor} disabled={!editable} />
      <EditorContent
        editor={editor}
        className={`editor-textarea ${!editable ? "locked" : ""}`}
      />
    </>
  )
}