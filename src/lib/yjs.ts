import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

export function createYDoc(roomId: string) {
  const doc = new Y.Doc()
  const provider = new WebsocketProvider(
    'wss://demos.yjs.dev',
    roomId,
    doc
  )

  const ytext = doc.getText('content')
  return { doc, provider, ytext }
}