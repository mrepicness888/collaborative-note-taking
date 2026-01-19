import { useEffect, useRef, useState } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { supabase } from "../lib/supabase"
import { Awareness } from "y-protocols/awareness"

export function useYjs(roomId: string) {
  const [ydoc] = useState(() => new Y.Doc())
  const [loaded, setLoaded] = useState(false)
  const awarenessRef = useRef<Awareness | null>(null)

  useEffect(() => {
    const loadDocument = async () => {
      const { data } = await supabase
        .from("documents")
        .select("content")
        .eq("room_id", roomId)
        .maybeSingle()

      if (data?.content && data.content.length > 0) {
        try {
          Y.applyUpdate(ydoc, new Uint8Array(data.content))
        } catch (e) {
          console.error("Failed to apply Yjs update, skipping:", e)
        }
      }

      setLoaded(true)
    }

    loadDocument()
  }, [roomId, ydoc])

  useEffect(() => {
    if (!loaded) return

    console.log("Connecting to room:", roomId)
    const provider = new WebsocketProvider(
      "ws://localhost:1234",
      roomId,
      ydoc
    )

    awarenessRef.current = provider.awareness

    return () => {
      provider.destroy()
    }
  }, [roomId, ydoc, loaded])

  

  useEffect(() => {
    if (!loaded) return

    const handler = async (update: Uint8Array) => {
      await supabase.from("documents").upsert({
        room_id: roomId,
        content: update,
        updated_at: new Date().toISOString(),
      })
    }

    ydoc.on("update", handler)
    return () => ydoc.off("update", handler)
  }, [loaded, roomId, ydoc])

  return {
    ytext: ydoc.getText("content"),
    awarenessRef,
    ready: loaded,
  }
}
