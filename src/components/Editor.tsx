import { useEffect, useRef, useState } from "react"
import { useYjs, type MarginNote, type Question } from "../hooks/useYjs"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"
import InviteButton from "./InviteButton"
import PresenceBar from "./PresenceBar";

interface Props {
  roomID: string,
}

type EditorMode = "lecture" | "discussion" | "revision"

type Role = "lecturer" | "student"

export default function Editor(props: Props) {
  const navigate = useNavigate()
  const { ytext, ymeta, yquestions, ymargin, awarenessRef, ready } = useYjs(props.roomID)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [mode, setMode] = useState<EditorMode>("discussion")
  const [text, setText] = useState("")
  const [title, setTitle] = useState<string>("")
  const [role, setRole] = useState<Role | null>(null)
  const [roleLoading, setRoleLoading] = useState(true)
  const [questions, setQuestions] = useState<Question[]>([])
  const [marginNotes, setMarginNotes] = useState<MarginNote[]>([])
  const [highlightPos, setHighlightPos] = useState<number | null>(null)

  useEffect(() => {
    const update = () => {
      setMarginNotes(ymargin.toArray())
    }

    ymargin.observe(update)
    update()

    return () => ymargin.unobserve(update)
  }, [ymargin])


  useEffect(() => {
    const update = () => {
      setQuestions(yquestions.toArray())
    }

    yquestions.observe(update)
    update()

    return () => yquestions.unobserve(update)
  }, [yquestions])

  useEffect(() => {
    if (!ready) return

    const updateMode = () => {
      const current = ymeta.get("mode") as EditorMode
      setMode(current ?? "discussion")
    }

    updateMode()
    ymeta.observe(updateMode)

    return () => {
      ymeta.unobserve(updateMode)
    }
  }, [ready, ymeta])

  useEffect(() => {
    const fetchRole = async () => {
      if (!props.roomID) return

      const { data, error } = await supabase
        .from("document_memberships")
        .select("role")
        .eq("document_id", props.roomID)
        .maybeSingle()

        
      if (error || !data) {
        console.log("Route documentId:", props.roomID)
        console.log(error)
        console.log(data)
        const {
          data: { user },
        } = await supabase.auth.getUser()

        console.log("Auth user id:", user?.id)
        setRole(null)
      } else {
        console.log("working")
        setRole(data.role)
      }

      setRoleLoading(false)
    }

    fetchRole()
    
  }, [props.roomID])

  useEffect(() => {
  const loadMeta = async () => {
    const { data } = await supabase
      .from("documents")
      .select("title")
      .eq("id", props.roomID)
      .single()

    if (data?.title) {
      setTitle(data.title)
    }
  }

  loadMeta()
}, [props.roomID])

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

    const setUserState = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    awareness.setLocalStateField("user", {
      name: user?.user_metadata?.full_name ?? user?.email ?? "Anonymous",
      color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      role: role === "lecturer" ? "Lecturer" : "Student",
    });
  };

  setUserState();

  }, [awarenessRef, ready, role])

  if (!ready) {
    return <div>Loading document…</div>
  }

  if (roleLoading) {
    return <div>Loading document…</div>
  }

  if (!role) {
    console.log("Role for this document:", role)
    return <div>Access denied</div>
  }
  
  const setEditorMode = (newMode: EditorMode) => {
    ymeta.set("mode", newMode)
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

  const handleAddMarginNote = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const index = textarea.selectionStart
    if (index === null) return

    const text = prompt("Add margin note")
    if (!text) return

    ymargin.push([{
      id: crypto.randomUUID(),
      author: "Anonymous",
      text,
      anchorIndex: index,
      resolved: false,
      // eslint-disable-next-line react-hooks/purity
      createdAt: Date.now(),
    }])
  }

  const addQuestion = (text: string) => {
    if (!text.trim()) return

    yquestions.push([{
      id: crypto.randomUUID(),
      author: "Anonymous",
      text,
      timestamp: Date.now(),
    }])
  }

  const canEditMainText = mode === "discussion" || (mode === "lecture" && role === "lecturer")
  console.log(mode)
  console.log(canEditMainText)

  const highlightAnchor = (index: number) => {
    setHighlightPos(index)
    setTimeout(() => setHighlightPos(null), 800)
  }

  const jumpToAnchor = (index: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    textarea.setSelectionRange(index, index)

    const lineHeight = 24
    const linesBefore = textarea.value.slice(0, index).split("\n").length
    textarea.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight)

    highlightAnchor(index)
  }

  const getCursorTopOffset = (index: number) => {
    const textarea = textareaRef.current
    if (!textarea) return 0

    const textBefore = textarea.value.slice(0, index)
    const lineCount = textBefore.split("\n").length
    const lineHeight = 24

    return lineCount * lineHeight
  }

  return (
    <div className="editor-page">

      <header className="editor-topbar">
        <button onClick={() => navigate("/dashboard")} className="back-button">Back to Dashboard</button>

        <div className="editor-meta">
          <span className="document-title">{title}</span>
          {role === "student" && (
            <span className="lecture-indicator">{mode}</span>
          )}
          {role === "lecturer" && (
            <InviteButton documentId={props.roomID} />
          )}
        </div>


        {role === "lecturer" && (
          <div className="editor-actions">
            <select
              className="mode-select"
              value={mode}
              onChange={e => setEditorMode(e.target.value as EditorMode)}
            >
              <option value="lecture">Lecture Mode</option>
              <option value="discussion">Discussion Mode</option>
              <option value="revision">Revision Mode</option>
            </select>
          </div>
        )}

        <PresenceBar awareness={awarenessRef.current!} />
      </header>


      <div className="editor-layout">
        <aside className="side-panel">
          {mode === "lecture" && (
            <div className="panel">
              <h3>Questions</h3>

              <div className="questions-list">
                {questions.map(q => (
                  <div key={q.id} className="question">
                    <div className="question-author">{q.author}</div>
                    <div className="question-text">{q.text}</div>
                  </div>
                ))}
              </div>

              {role === "student" && (
                <input
                  className="question-input"
                  placeholder="Ask a question…"
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      addQuestion(e.currentTarget.value)
                      e.currentTarget.value = ""
                    }
                  }}
                />
              )}
            </div>
          )}
          <div className="panel">
            <h3>Margin Notes</h3>
            {marginNotes.map(note => (
              <div key={note.id} className="margin-note" onClick={() => jumpToAnchor(note.anchorIndex)}>
                <strong>{note.author}</strong>
                <div>{note.text}</div>
              </div>
            ))}
          </div>
          {mode === "lecture" && (
            <button onClick={handleAddMarginNote} className="add-button">
              Add margin note
            </button>
          )}
          {highlightPos !== null && (
            <div
              className="cursor-highlight"
              style={{
                top: getCursorTopOffset(highlightPos),
              }}
            />
          )}
        </aside>


        <main className="editor-main">
          <h2 style={{ margin: 0 }}>{title || "Untitled document"}</h2>
          <textarea
            ref={textareaRef}
            className={mode === "lecture" && !canEditMainText ? "editor-textarea locked" : "editor-textarea"}
            value={text}
            onChange={handleChange}
            readOnly={!canEditMainText}
            onSelect={(e) => {
              const awareness = awarenessRef.current
              if (!awareness) return
              const target = e.target as HTMLTextAreaElement
              awareness.setLocalStateField("cursor", {
                index: target.selectionStart,
              })
            }}
            style={{ width: "100%", height: "80vh" }}
            placeholder="Start taking notes…"
          />
        </main>
      </div>

    </div>
  )
}
