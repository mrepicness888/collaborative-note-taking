import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import type { Session } from "@supabase/supabase-js"
import { Navigate, Route, Routes } from "react-router-dom"

import Login from "./Auth/Login"
import Signup from "./Auth/Signup"
import EditorPage from "./components/EditorPage"
import Dashboard from "./components/Dashboard"
import ProtectedRoute from "./Auth/ProtectedRoute"

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route element={<ProtectedRoute session={session} />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/docs/:id" element={<EditorPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
