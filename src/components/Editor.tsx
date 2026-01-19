import { useEffect, useState } from "react"
import { useYjs } from "../hooks/useYjs"

type AwarenessUser = {
  name: string
  color: string
}

type AwarenessCursor = {
  index: number
}

type AwarenessState = {
  clientId: number
  user?: AwarenessUser
  cursor?: AwarenessCursor
}

export default function Editor() {
  const { ytext, awarenessRef, ready } = useYjs("demo-room")

  const [text, setText] = useState("")
  const [others, setOthers] = useState<AwarenessState[]>([])

  useEffect(() => {
    if (!ready) return

    const update = () => {
      setText(ytext.toString())
    }

    update()
    ytext.observe(update)
    return () => ytext.unobserve(update)
  }, [ytext, ready])

  useEffect(() => {
    if (!ready) return

    const awareness = awarenessRef.current
    if (!awareness) return

    awareness.setLocalStateField("user", {
      name: "User " + Math.floor(Math.random() * 1000),
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
    })
  }, [awarenessRef, ready])

  useEffect(() => {
    if (!ready) return

    const awareness = awarenessRef.current
    if (!awareness) return

    const update = () => {
      const states = Array.from(awareness.getStates().entries()).map(
        ([clientId, state]) => ({
          clientId,
          user: state?.user,
          cursor: state?.cursor,
        })
      )
      setOthers(states)
    }

    awareness.on("change", update)
    update()

    return () => {
      awareness.off("change", update)
    }
  }, [awarenessRef, ready])

  if (!ready) {
    return <div>Loading document…</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    const oldValue = ytext.toString()

    if (value === oldValue) return

    ytext.doc?.transact(() => {
      const minLen = Math.min(value.length, oldValue.length)

      let index = 0
      while (index < minLen && value[index] === oldValue[index]) {
        index++
      }

      if (oldValue.length > index) {
        ytext.delete(index, oldValue.length - index)
      }

      if (value.length > index) {
        ytext.insert(index, value.slice(index))
      }
    })
  }

  return (
    <>
      <div style={{ marginBottom: 8, fontSize: "0.9em" }}>
        <strong>Active users:</strong>{" "}
        {others.map(o => (
          <span
            key={o.clientId}
            style={{ color: o.user?.color, marginRight: 8 }}
          >
            
            {o.user?.name}
          </span>
        ))}
      </div>

      <textarea
        value={text}
        onChange={handleChange}
        onSelect={(e) => {
          const awareness = awarenessRef.current
          if (!awareness) return

          const target = e.target as HTMLTextAreaElement
          awareness.setLocalStateField("cursor", {
            index: target.selectionStart,
          })
        }}
        style={{ width: "100%", height: "80vh" }}
      />
    </>
  )
}
