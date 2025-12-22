import { useEffect, useState } from "react"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { supabase } from "../lib/supabase"

export function useYjs(roomId: string) {
  const [ydoc] = useState(() => new Y.Doc())
  const [loaded, setLoaded] = useState(false)

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

    return () => {
      provider.destroy()
      ydoc.destroy()
    }
  }, [roomId, ydoc, loaded])

  useEffect(() => {
    if (!loaded) return

    const save = async () => {
      const update = Y.encodeStateAsUpdate(ydoc)

      await supabase
        .from("documents")
        .upsert({
          room_id: roomId,
          content: update,
          updated_at: new Date().toISOString(),
        })
    }

    ydoc.on("update", save)

    return () => {
      ydoc.off("update", save)
    }
  }, [roomId, ydoc, loaded])

  return {
    ytext: ydoc.getText("content"),
    ready: loaded,
  }
}
