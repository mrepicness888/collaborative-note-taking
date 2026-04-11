import { useEffect, useState } from "react";
import {
  useYjs,
  type Question,
  type Suggestion,
} from "../hooks/useYjs";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import InviteButton from "./InviteButton";
import PresenceBar from "./PresenceBar";
import RichTextEditor from "./RichTextEditor";
import { Editor } from "@tiptap/react";

interface Props {
  roomID: string;
}

type EditorMode = "lecture" | "discussion" | "revision";

type Role = "lecturer" | "student";

export default function EditorMain(props: Props) {
  const navigate = useNavigate();
  const {
    ydoc,
    ytext,
    ymeta,
    yquestions,
    ysuggestions,
    awareness,
    ready,
  } = useYjs(props.roomID);
  const [mode, setMode] = useState<EditorMode>("discussion");
  const [title, setTitle] = useState<string>("");
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [editorInstance, setEditorInstance] = useState<Editor | null>(null);
  const [suggestionDraft, setSuggestionDraft] = useState<{
    from: number;
    to: number;
    original: string;
    replacement: string;
  } | null>(null);

  useEffect(() => {
    const update = () => {
      setQuestions(yquestions.toArray());
    };

    yquestions.observe(update);
    update();

    return () => yquestions.unobserve(update);
  }, [yquestions]);

  useEffect(() => {
    if (!ready) return;

    const updateMode = () => {
      const current = ymeta.get("mode") as EditorMode;
      setMode(current ?? "discussion");
    };

    updateMode();
    ymeta.observe(updateMode);

    return () => {
      ymeta.unobserve(updateMode);
    };
  }, [ready, ymeta]);

  useEffect(() => {
    const fetchRole = async () => {
      if (!props.roomID) return;

      const { data, error } = await supabase
        .from("document_memberships")
        .select("role")
        .eq("document_id", props.roomID)
        .maybeSingle();

      if (error || !data) {
        console.log("Route documentId:", props.roomID);
        console.log(error);
        console.log(data);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        console.log("Auth user id:", user?.id);
        setRole(null);
      } else {
        console.log("working");
        setRole(data.role);
      }

      setRoleLoading(false);
    };

    fetchRole();
  }, [props.roomID]);

  useEffect(() => {
    const loadMeta = async () => {
      const { data } = await supabase
        .from("documents")
        .select("title")
        .eq("id", props.roomID)
        .single();

      if (data?.title) {
        setTitle(data.title);
      }
    };

    loadMeta();
  }, [props.roomID]);


  useEffect(() => {
    if (!ready) return;

    if (!awareness) return;

    const setUserState = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      awareness.setLocalStateField("user", {
        name: user?.user_metadata?.full_name ?? user?.email ?? "Anonymous",
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
        role: role === "lecturer" ? "Lecturer" : "Student",
      });
    };

    setUserState();
  }, [awareness, ready, role]);

  if (!ready) {
    return <div>Loading document…</div>;
  }

  if (roleLoading) {
    return <div>Loading document…</div>;
  }

  if (!role) {
    console.log("Role for this document:", role);
    return <div>Access denied</div>;
  }

  const setEditorMode = (newMode: EditorMode) => {
    ymeta.set("mode", newMode);
  };


  const addQuestion = (text: string) => {
    if (!text.trim()) return;

    yquestions.push([
      {
        id: crypto.randomUUID(),
        author: "Anonymous",
        text,
        timestamp: Date.now(),
        resolved: false,
      },
    ]);
  };

  const canEditMainText =
    mode === "discussion" || (mode === "lecture" && role === "lecturer");
  console.log(mode);
  console.log(canEditMainText);

  
  const ToggleQuestion = (id: string) => {
    const questions = ydoc.getArray<Question>("questions");

    const index = questions.toArray().findIndex(q => q.id === id)
    if (index === -1) return

    const question = questions.get(index)
    question.resolved = !question.resolved

    questions.delete(index, 1)
    questions.insert(index, [question])
  }


  const openSuggestionModal = ({
    from,
    to,
    selectedText,
  }: {
    from: number;
    to: number;
    selectedText: string;
  }) => {
    setSuggestionDraft({
      from,
      to,
      original: selectedText,
      replacement: "",
    });
  };

  const handleCreateSuggestion = async () => {
    console.log("being called");
    console.log(editorInstance);
    if (!editorInstance) return;

    console.log("not being returned");

    const { from, to } = editorInstance.state.selection;

    if (from === to) {
      alert("Please select text to suggest a revision.");
      return;
    }

    const selectedText = editorInstance.state.doc.textBetween(from, to, " ");

    openSuggestionModal({
      from,
      to,
      selectedText,
    });
  };

  const handleAcceptSuggestion = (s: Suggestion) => {
    if (s.resolved) return;

    console.log("Accepting suggestion:", s);

    const index = ysuggestions.toArray().findIndex((x) => x.id === s.id);
    if (index === -1) return;

    ytext.doc?.transact(() => {
      ytext.delete(s.from, s.to - s.from);
      ytext.insert(s.from, s.text);

      const updated = {
        ...s,
        resolved: true,
        accepted: true,
      };

      ysuggestions.delete(index, 1);
      ysuggestions.insert(index, [updated]);
    });
  };

  return (
    <div className="editor-page">
      <header className="editor-topbar">
        <button onClick={() => navigate("/dashboard")} className="back-button">
          Back to Dashboard
        </button>

        <div className="editor-meta">
          <span className="document-title">{title}</span>
          {role === "student" && (
            <span className="lecture-indicator">{mode}</span>
          )}
          {role === "lecturer" && <InviteButton documentId={props.roomID} />}
        </div>

        {role === "lecturer" && (
          <div className="editor-actions">
            <select
              className="mode-select"
              value={mode}
              onChange={(e) => setEditorMode(e.target.value as EditorMode)}
            >
              <option value="lecture">Lecture Mode</option>
              <option value="discussion">Discussion Mode</option>
              <option value="revision">Revision Mode</option>
            </select>
          </div>
        )}

        {mode === "revision" && (
          <button className="suggest-btn" onClick={handleCreateSuggestion}>
            Suggest Change
          </button>
        )}

        <PresenceBar awareness={awareness!} />
      </header>

      <div className="editor-layout">
        <aside className="side-panel">
          {mode === "lecture" && (
            <div className="panel">
              <h3>Questions</h3>

              <div className="questions-list">
                {questions.map((q) => (
                  <div key={q.id}  className={`question ${q.resolved ? "resolved" : ""}`}>
                    <div className="question-author">{q.author}</div>
                    <div className="question-text">{q.text}</div>

                    {!q.resolved && role === "lecturer" && (
                      <button onClick={() => ToggleQuestion(q.id)}>
                        Resolve
                      </button>
                    )}

                    {q.resolved && <span className="resolved-label">Resolved</span>}

                    {q.resolved && role === "lecturer" && (
                      <button onClick={() => ToggleQuestion(q.id)}>
                        Reopen Question
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {role === "student" && (
                <input
                  className="question-input"
                  placeholder="Ask a question…"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      addQuestion(e.currentTarget.value);
                      e.currentTarget.value = "";
                    }
                  }}
                />
              )}
            </div>
          )}

          {mode === "revision" && (
            <div className="panel">
              <h3>Suggestions</h3>

              {ysuggestions.length === 0 && (
                <p className="empty-state">No suggestions yet.</p>
              )}

              {ysuggestions.map((s) => (
                <div
                  key={s.id}
                  className={`suggestion-card ${s.resolved ? "resolved" : ""}`}
                >
                  <div className="suggestion-meta">
                    <span className="author">{s.author}</span>
                  </div>

                  <div className="suggestion-body">
                    <p>
                      Replace text at {s.from}–{s.to}, with:
                    </p>
                    <div>{s.text}</div>
                  </div>

                  {!s.resolved && role == "lecturer" && (
                    <div className="suggestion-actions">
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptSuggestion(s)}
                      >
                        Accept
                      </button>

                      <button
                        className="reject-btn"
                        //onClick={() => handleRejectSuggestion(s)}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {s.resolved && (
                    <div className="suggestion-status">
                      {s.accepted ? "Accepted" : "Rejected"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </aside>

        <main className="editor-main">
          <h2 style={{ margin: 0 }}>{title || "Untitled document"}</h2>
          <>{console.log(ytext.doc)}</>
          {ready && (
            <RichTextEditor
              ydoc={ydoc}
              ytext={ytext}
              editable={canEditMainText}
              onEditorReady={setEditorInstance}
            />
          )}
        </main>
      </div>

      {suggestionDraft && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Suggest Revision</h3>

            <div className="diff-preview">
              <p className="original">
                <strong>Original:</strong> {suggestionDraft.original}
              </p>

              <p className="replacement">
                <strong>Replacement:</strong>{" "}
                {suggestionDraft.replacement || "—"}
              </p>
            </div>

            <textarea
              className="modal-input"
              placeholder="Enter revised text..."
              value={suggestionDraft.replacement}
              onChange={(e) =>
                setSuggestionDraft({
                  ...suggestionDraft,
                  replacement: e.target.value,
                })
              }
            />

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setSuggestionDraft(null)}
              >
                Cancel
              </button>

              <button
                className="confirm-btn"
                onClick={async () => {
                  const user = (await supabase.auth.getUser()).data.user;
                  if (!user) return;

                  ysuggestions.push([
                    {
                      id: crypto.randomUUID(),
                      author: user.email || "Anonymous",
                      from: suggestionDraft.from,
                      to: suggestionDraft.to,
                      text: suggestionDraft.replacement.trim(),
                      resolved: false,
                      accepted: false,
                      votes: [],
                    },
                  ]);

                  setSuggestionDraft(null);
                }}
              >
                Submit Suggestion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
