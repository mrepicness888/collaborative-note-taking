import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import { type Text, type Doc } from "yjs";
import { useEffect } from "react";
import EditorToolbar from "./EditorToolbar";
import { Mathematics } from "@tiptap/extension-mathematics";
import { FontSize, TextStyle } from "@tiptap/extension-text-style";

interface Props {
  ydoc: Doc;
  ytext: Text;
  editable: boolean;
  onEditorReady?: (editor: Editor) => void;
}

export default function RichTextEditor(props: Props) {
  const editor = useEditor({
    editable: props.editable,
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Collaboration.configure({
        document: props.ydoc,
      }),
      Mathematics.configure({
        blockOptions: {
          onClick: (node, pos) => {
            const newCalculation = prompt(
              "Enter new calculation:",
              node.attrs.latex,
            );
            if (newCalculation) {
              editor
                .chain()
                .setNodeSelection(pos)
                .updateBlockMath({ latex: newCalculation })
                .focus()
                .run();
            }
          },
        },
        inlineOptions: {
          onClick: (node, pos) => {
            const newCalculation = prompt(
              "Enter new calculation:",
              node.attrs.latex,
            );
            if (newCalculation) {
              editor
                .chain()
                .setNodeSelection(pos)
                .updateInlineMath({ latex: newCalculation })
                .focus()
                .run();
            }
          },
        },
      }),
    ],
  });

  useEffect(() => {
    if (editor && props.onEditorReady) {
      props.onEditorReady(editor);
    }
  }, [editor, props]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(props.editable);
  }, [editor, props.editable]);

  if (!editor) return <div>Loading editor…</div>;

  return (
    <>
      <EditorToolbar editor={editor} disabled={!props.editable} />
      <EditorContent
        editor={editor}
        className={`editor-textarea ${!props.editable ? "locked" : ""}`}
      />
    </>
  );
}
