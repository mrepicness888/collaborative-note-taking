import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Props {
  documentId: string;
}

type InvitedUser = {
  user_id: string;
  email: string;
  role: string;
};

export default function InviteButton(props: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invitedUsers, setInvitedUsers] = useState<InvitedUser[]>([]);
  const [showInvited, setShowInvited] = useState(false);

  useEffect(() => {
    const invitedUsersList: InvitedUser[] = [];

    const fetchInvitedUsers = async () => {
      const { data, error } = await supabase
        .from("document_memberships")
        .select("user_id, role")
        .eq("document_id", props.documentId);

      if (error || !data) {
        return;
      }

      data.forEach(async (row) => {
        const { data: user } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", row.user_id);

        invitedUsersList.push({
          user_id: row.user_id,
          email: user?.[0]?.email ?? "Unknown user",
          role: row.role,
        });
      });
      
      setInvitedUsers(invitedUsersList);
    };

    fetchInvitedUsers();

  }, [props.documentId]);

  const invite = async () => {
    const normalisedEmail = email.trim().toLowerCase();

    if (!normalisedEmail) {
      setError("Please enter an email address.");
      return;
    }

    setLoading(true);
    setError(null);

    const alreadyInvited = invitedUsers.some(
      (user) => user.email.toLowerCase() === normalisedEmail,
    );

    if (alreadyInvited) {
      setError("That user is already invited to this document.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("user_id")
      .ilike("email", normalisedEmail)
      .maybeSingle();

    if (!profile) {
      setError("User not found.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("document_memberships")
      .insert({
        document_id: props.documentId,
        user_id: profile.user_id,
        role: "student",
      });

    if (insertError) {
      if (
        insertError.code === "23505" ||
        insertError.message.toLowerCase().includes("duplicate")
      ) {
        setError("That user is already invited to this document.");
      } else {
        setError("Unable to invite user. Please try again.");
      }
    } else {
      setEmail("");
      setInvitedUsers((prev) => [
        ...prev,
        { user_id: profile.user_id, email: normalisedEmail, role: "student" },
      ]);
    }

    setLoading(false);
  };


  return (
    <div className="invite-wrapper">
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="student@email.ac.uk"

        onClick={() => setShowInvited(true)}
        onBlur={() => {
          setTimeout(() => setShowInvited(false), 150);
        }}
        className="invite-input"
      />

      <button onClick={invite} disabled={loading} className="invite-button">
        {loading ? "Inviting..." : "Invite"}
      </button>

      {error && <div className="invite-error">{error}</div>}

      {showInvited && invitedUsers.length > 0 && (
        <div className="invite-dropdown">
          {invitedUsers.map((user) => (
            <div key={user.user_id} className="invite-dropdown-item">
              <div>{user.email}</div>
              <div className="invite-role">{user.role}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}