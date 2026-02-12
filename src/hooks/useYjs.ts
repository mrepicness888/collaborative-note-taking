import { useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { supabase } from "../lib/supabase"
import { Awareness } from "y-protocols/awareness"

export type MarginNote = {
  id: string
  author: string
  text: string
  anchorIndex: number
  resolved: boolean
  createdAt: number
}

export type Question = {
  id: string
  author: string
  text: string
  timestamp: number
}

export function useYjs(documentId: string) {
  const [ydoc] = useState(() => new Y.Doc())
  const [loaded, setLoaded] = useState(false)
  const awarenessRef = useRef<Awareness | null>(null)
  const ymeta = ydoc.getMap("meta")
  const yquestions = ydoc.getArray<Question>("questions")
  const ymargin = ydoc.getArray<MarginNote>("margin_notes")
  const hasHydrated = useRef(false)

  useEffect(() => {
    if (!documentId) return

    const loadDocument = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("content")
        .eq("id", documentId)
        .single()

      if (error) {
        console.error("Failed to load document:", error)
        setLoaded(true)
        return
      }
      console.log("Loaded Yjs content type:", typeof data.content, data.content)

      if (data?.content) {
        const bytes = Uint8Array.from(atob(data.content), c => c.charCodeAt(0));
        Y.applyUpdate(ydoc, bytes);
      }

      hasHydrated.current = true
      setLoaded(true)
    }

    loadDocument()
  }, [documentId, ydoc])

  useEffect(() => {
    if (!loaded) return

    console.log("Connecting to Yjs room:", documentId)

    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      documentId,
      ydoc
    )

    awarenessRef.current = provider.awareness

    return () => {
      provider.destroy()
    }
  }, [documentId, ydoc, loaded])

  useEffect(() => {
    if (!loaded) return

    let timeout: ReturnType<typeof setTimeout> | null = null
    let saving = false

    const scheduleSave = () => {
      if (saving) return
      if (!hasHydrated.current) return
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(async () => {
        saving = true

        const snapshot = Y.encodeStateAsUpdate(ydoc); // Uint8Array
        const base64 = btoa(String.fromCharCode(...snapshot));


        const { error } = await supabase
          .from("documents")
          .update({
            content: base64,
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentId)

        if (error) {
          console.error("Failed to save document:", error)
        }

        saving = false
      }, 1000)
    }

    ydoc.on("update", scheduleSave)

    return () => {
      if (timeout) clearTimeout(timeout)
      ydoc.off("update", scheduleSave)
    }
  }, [documentId, ydoc, loaded])

  return {
    ydoc,
    ytext: ydoc.getText("content"),
    ymeta, 
    yquestions,
    ymargin,
    awarenessRef,
    ready: loaded,
  }
}
