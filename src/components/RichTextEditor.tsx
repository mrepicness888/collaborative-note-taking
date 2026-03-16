import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Collaboration from "@tiptap/extension-collaboration"
import { type Text, type Doc } from "yjs"
import { useEffect } from "react"
import EditorToolbar from "./EditorToolbar"

interface Props {
  ydoc: Doc  
  ytext: Text 
  editable: boolean
  onEditorReady?: (editor: Editor) => void
}

export default function RichTextEditor(props: Props) {



  const editor = useEditor({
    editable: props.editable,
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: props.ydoc,
      }),
    ],
  })

    useEffect(() => {
      if (editor && props.onEditorReady) {
        props.onEditorReady(editor)
      }
    }, [editor, props])


  useEffect(() => {
    if (!editor) return
    editor.setEditable(props.editable)
  }, [editor, props.editable])

  if (!editor) return <div>Loading editor…</div>

  return (
    <>
      <EditorToolbar editor={editor} disabled={!props.editable} />
      <EditorContent
        editor={editor}
        className={`editor-textarea ${!props.editable ? "locked" : ""}`}
      />
    </>
  )
}