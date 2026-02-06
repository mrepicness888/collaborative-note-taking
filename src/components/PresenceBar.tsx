import React, { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness";

type Props = {
  awareness: Awareness;
};

type UserState = {
  user?: {
    name?: string;
    role?: "Lecturer" | "Student";
    color?: string;
  };
  typing?: boolean;
};

type UserPresence = {
  id: number; 
  name: string;
  role: "Lecturer" | "Student";
  color: string;
  typing?: boolean;
};

export default function PresenceBar({ awareness }: Props) {
  const [users, setUsers] = useState<UserPresence[]>([]);

  const generateColor = (name: string) => {
    const colors = ["#1abc9c", "#3498db", "#9b59b6", "#e67e22", "#e74c3c", "#f1c40f"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states: [number, UserState][] = Array.from(awareness.getStates().entries());

      const mapped: UserPresence[] = states.map(([id, state]) => {
        const user = state.user;
        console.log(user)

        return {
          id,
          name: user?.name ?? "Anonymous",
          role: user?.role ?? "Student",
          color: user?.color ?? generateColor(user?.name ?? "Anon"),
          typing: state.typing ?? false,
        };
      });

      setUsers(mapped);
    };

    awareness.on("change", updateUsers);
    updateUsers();

    return () => {
      awareness.off("change", updateUsers);
    };
  }, [awareness]);

  return (
    <div className="presence-bar">
      {users.map((u) => (
        <div key={u.id} className="presence-user">
          <span className="presence-dot" style={{ backgroundColor: u.color }} />
          <span className="presence-name">{u.name}</span>
          <span className="presence-role">{u.role}</span>
          {u.typing && <span className="presence-typing">typing…</span>}
        </div>
      ))}
    </div>
  );
}
