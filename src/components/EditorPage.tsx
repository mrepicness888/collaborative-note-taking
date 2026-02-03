import { useParams } from "react-router-dom"
import Editor from "../components/Editor"

export default function EditorPage() {
  const { id } = useParams()

  if (!id) return <div>Loading…</div>

  return <Editor roomID = {id} />
}
