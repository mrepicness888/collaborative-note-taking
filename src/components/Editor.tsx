import { useEffect, useState } from "react"
import { useYjs } from "../hooks/useYjs"

export default function Editor() {
  const { ytext, ready } = useYjs("demo-room")

  const [text, setText] = useState(() => ytext.toString())

  useEffect(() => {
    if (!ready) return

    const update = () => {
      setText(ytext.toString())
    }

    ytext.observe(update)
    return () => ytext.unobserve(update)
  }, [ytext, ready])

  if (!ready) {
    return <div>Loading document…</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value

    ytext.doc?.transact(() => {
      ytext.delete(0, ytext.length)
      ytext.insert(0, value)
    })
  }

  return (
    <textarea
      value={text}
      onChange={handleChange}
      style={{ width: "100%", height: "80vh" }}
    />
  )
}
