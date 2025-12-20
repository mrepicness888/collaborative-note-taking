import { useEffect, useState } from "react"
import { supabase } from "./lib/supabase"
import Editor from "./components/Editor"
import Login from "./Auth/Login"
import type { Session } from "@supabase/supabase-js"
import { Navigate, Route, Routes } from "react-router-dom"
import Signup from "./Auth/Signup"

function App() {
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
  }, [])

  return (
    <Routes>
      {session ? (
        <Route path="/*" element={<Editor />} />
      ) : (
        <>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </>
      )}
    </Routes>
  )

}

export default App
