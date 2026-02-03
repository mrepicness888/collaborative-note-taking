import { useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { supabase } from "../lib/supabase"
import { Awareness } from "y-protocols/awareness"

export function useYjs(documentId: string) {
  const [ydoc] = useState(() => new Y.Doc())
  const [loaded, setLoaded] = useState(false)
  const awarenessRef = useRef<Awareness | null>(null)

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

      if (data?.content?.length) {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(data.content))
        } catch (e) {
          console.error("Failed to apply Yjs update:", e)
        }
      }

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
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(async () => {
        saving = true

        const snapshot = Y.encodeStateAsUpdate(ydoc)

        const { error } = await supabase
          .from("documents")
          .update({
            content: snapshot,
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
    ytext: ydoc.getText("content"),
    awarenessRef,
    ready: loaded,
  }
}
