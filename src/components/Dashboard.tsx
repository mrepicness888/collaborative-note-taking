import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import * as Y from "yjs";

type DocumentRow = {
  id: string
  title: string
  room_id: string
  updated_at: string
}

export default function Dashboard() {
  const [docs, setDocs] = useState<DocumentRow[]>([])
  const [title, setTitle] = useState("")
  const [role, setRole] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const loadDocs = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, room_id, updated_at")
        .order("updated_at", { ascending: false })

      setDocs(data ?? [])
    }

    const fetchAccountRole = async () => {
      const { data: auth } = await supabase.auth.getUser()
      const user = auth.user
      if (!user) return

      const { data } = await supabase
        .from("profiles")
        .select("account_role")
        .eq("user_id", user.id)
        .single()

      setRole(data?.account_role ?? null)
    }

    loadDocs()
    fetchAccountRole()
    
  }, [])

  const handleCreateDocument = async () => {
    console.log("being called")
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return


    const ydoc = new Y.Doc();

    const snapshot = Y.encodeStateAsUpdate(ydoc); // Uint8Array
    const base64 = btoa(String.fromCharCode(...snapshot));

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title: title.trim(),
        created_by: user.id,
        content: base64,
      })
      .select()
      .single()


    if (docError || document == null) {
      console.error("Failed to create document:", docError)
      return
    }

    
      const { data: existingMembership } = await supabase
        .from("document_memberships")
        .select()
        .eq("document_id", document.id)
        .eq("user_id", user.id)
        .single();

      if (!existingMembership) {
        const { error: membershipError } = await supabase
          .from("document_memberships")
          .insert({
            document_id: document.id,
            user_id: user.id,
            role: "lecturer",
          });

        if (membershipError) {
          console.error("Failed to assign lecturer role:", membershipError);
          return;
        }
      }


    console.log(document)

    navigate(`/doc/${document.id}`);

    
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto" }}>
      <h2>Your documents</h2>
      <>{console.log(role)}</>
      {role === "professor" && (
        <>
          <input
            placeholder="New document title"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <button onClick={handleCreateDocument}>Create</button>
        </>
      )}

      <ul>
        {docs.map(doc => (
          <li key={doc.id} className="card">
            <button onClick={() => navigate(`/docs/${doc.id}`)}>
              {doc.title}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
