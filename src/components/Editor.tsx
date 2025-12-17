import { useEffect, useState } from 'react'
import { createYDoc } from '../lib/yjs'

export default function Editor() {
  const [text, setText] = useState('')
  const { ytext } = createYDoc('demo-room')

  useEffect(() => {
    const update = () => setText(ytext.toString())
    ytext.observe(update)
    return () => ytext.unobserve(update)
  }, [ytext])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    ytext.delete(0, ytext.length)
    ytext.insert(0, e.target.value)
  }

  return (
    <>
    dfhgjklaks;dfgaksdhjflahskdjfakhsdfkjahsdfb
    <textarea
      value={text}
      onChange={handleChange}
      style={{ width: '100%', height: '80vh' }}
    />
    </>
  )
}