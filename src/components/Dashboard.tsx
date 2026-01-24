import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

type DocumentRow = {
  id: string
  title: string
  room_id: string
  updated_at: string
}

export default function Dashboard() {
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [title, setTitle] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const loadDocs = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, room_id, updated_at")
        .order("updated_at", { ascending: false })

      setDocs(data ?? [])
    }

    loadDocs()
  }, [])

  const createDoc = async () => {
    if (!title.trim()) return

    const roomId = crypto.randomUUID()

    const { data } = await supabase
      .from("documents")
      .insert({
        title,
        room_id: roomId,
        content: null,
      })
      .select()
      .single()

    navigate(`/docs/${data.id}`)
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Your documents</h2>

      <input
        placeholder="New document title"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <button onClick={createDoc}>Create</button>

      <ul>
        {docs.map(doc => (
          <li key={doc.id}>
            <button onClick={() => navigate(`/docs/${doc.id}`)}>
              {doc.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
