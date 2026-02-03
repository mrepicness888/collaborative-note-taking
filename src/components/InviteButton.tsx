import { useState } from "react"
import { supabase } from "../lib/supabase"

interface Props {
  documentId: string,
}

export default function InviteButton(props: Props) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const invite = async () => {
    setLoading(true)
    setError(null)
    console.log(email)

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("email", email.trim().toLowerCase())
      .maybeSingle()

    console.log(profile)

    if (!profile) {
      setError("User not found")
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from("document_memberships")
      .insert({
        document_id: props.documentId,
        user_id: profile.user_id,
        role: "student",
      })

    if (error) {
      setError(error.message)
    } else {
      setEmail("")
    }

    setLoading(false)
  }

  return (
    <div>
      <input
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="student@email.ac.uk"
      />
      <button onClick={invite} disabled={loading}>
        Invite
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </div>
  )
}

