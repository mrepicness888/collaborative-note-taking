import { useParams } from "react-router-dom"
import Editor from "../components/Editor"
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabase"

export default function EditorPage() {
  const { id } = useParams()
  const [roomId, setRoomId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("documents")
        .select("room_id")
        .eq("id", id)
        .single()

      setRoomId(data?.room_id)
    }

    load()
  }, [id])

  if (!roomId) return <div>Loading…</div>

  return <Editor roomID = {roomId} />
}
