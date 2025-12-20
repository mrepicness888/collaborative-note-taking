import { useState } from "react"
import { supabase } from "../lib/supabase"

export default function Signup() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const signUp = async () => {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      alert("Signup successful! You can now log in.")
    }

    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto" }}>
      <h2>Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ display: "block", width: "100%", marginBottom: "1rem" }}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}

      <button onClick={signUp} disabled={loading}>
        {loading ? "Signing up..." : "Sign Up"}
      </button>

    <p style={{ marginTop: "1rem" }}>
        ALready have an account? <a href="/login">Login</a>
      </p>
    </div>
  )
}
