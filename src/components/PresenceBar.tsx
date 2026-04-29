import { useEffect, useState } from "react";
import { Awareness } from "y-protocols/awareness";
import { generateColour } from "../helpers/generateColour";

type Props = {
  awareness: Awareness;
};

type UserState = {
  user?: {
    name?: string;
    role?: "Lecturer" | "Student";
    colour?: string;
  };
  typing?: boolean;
};

type UserPresence = {
  id: number;
  name: string;
  role: "Lecturer" | "Student";
  colour: string;
  typing?: boolean;
};

export default function PresenceBar({ awareness }: Props) {
  const [users, setUsers] = useState<UserPresence[]>([]);

  useEffect(() => {
    if (!awareness) return;

    const updateUsers = () => {
      const states: [number, UserState][] = Array.from(
        awareness.getStates().entries(),
      );

      const mapped: UserPresence[] = states.map(([id, state]) => {
        const user = state.user;

        return {
          id,
          name: user?.name ?? "Anonymous",
          role: user?.role ?? "Student",
          colour: user?.colour ?? generateColour(user?.name ?? "Anon"),
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
          <span className="presence-dot" style={{ backgroundColor: u.colour }} />
          <span className="presence-name">{u.name}</span>
          <span className="presence-role">{u.role}</span>
          {u.typing && <span className="presence-typing">typing…</span>}
        </div>
      ))}
    </div>
  );
}
