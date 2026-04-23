import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import * as Y from "yjs";

type DocumentRow = {
  id: string;
  title: string;
  updated_at: string;
};

export default function Dashboard() {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const loadDocs = async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false });

      setDocs(data ?? []);

      if (error) {
        console.error("Supabase Error:", error.message);
        return;
      }
    };

    const fetchAccountRole = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("account_role")
        .eq("user_id", user.id)
        .single();

      setRole(data?.account_role ?? null);
    };

    loadDocs();
    fetchAccountRole();
  }, []);

  const handleCreateDocument = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const ydoc = new Y.Doc();

    const snapshot = Y.encodeStateAsUpdate(ydoc);
    const base64 = btoa(String.fromCharCode(...snapshot));

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title: title.trim(),
        created_by: user.id,
        content: base64,
      })
      .select()
      .single();

    if (docError || document == null) {
      console.error("Failed to create document:", docError);
      return;
    }

    const { data: existingMembership } = await supabase
      .from("document_memberships")
      .select()
      .eq("document_id", document.id)
      .eq("user_id", user.id)
      .single();

    if (!existingMembership) {
      const { error: membershipError } = await supabase
        .from("document_memberships")
        .insert({
          document_id: document.id,
          user_id: user.id,
          role: "lecturer",
        });

      if (membershipError) {
        console.error("Failed to assign lecturer role:", membershipError);
        return;
      }
    }

    navigate(`/docs/${document.id}`);
  };
  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Collabrative Note Taking</h1>
          <p className="role-badge">
            Logged in as: <strong>{role ?? "Loading..."}</strong>
          </p>
        </div>

        {role === "professor" && (
          <div className="create-section">
            <input
              className="create-input"
              placeholder="New Document title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button className="primary-button" onClick={handleCreateDocument}>
              Create Document
            </button>
          </div>
        )}
      </header>

      <section className="dashboard-stats">
        <div className="stat-card">
          <h3>{docs.length}</h3>
          <p>Total Documents</p>
        </div>
        <div className="stat-card">
          <h3>—</h3>
          <p>Active Sessions</p>
        </div>
        <div className="stat-card">
          <h3>—</h3>
          <p>Open Questions</p>
        </div>
      </section>

      <section className="documents-section">
        <h2>Your Documents</h2>

        {docs.length === 0 ? (
          <div className="empty-state">
            <p>No documents yet.</p>
            {role === "professor" && (
              <p>Create your first collaborative lecture to get started.</p>
            )}
          </div>
        ) : (
          <div className="documents-grid">
            {docs.map((doc) => (
              <div key={doc.id} className="document-card">
                <div className="document-info">
                  <h3 className="centre">{doc.title}</h3>
                  <p className="document-meta">
                    Last updated: {new Date(doc.updated_at).toLocaleString()}
                  </p>
                </div>

                <button
                  className="secondary-button"
                  onClick={() => navigate(`/docs/${doc.id}`)}
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
