import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PresenceBar from "./PresenceBar";

type UserRole = "Lecturer" | "Student";

type AwarenessUser = {
  name?: string;
  role?: UserRole;
  color?: string;
};

type AwarenessState = {
  user?: AwarenessUser;
  typing?: boolean;
};

type AwarenessLike = {
  getStates: () => Map<number, AwarenessState>;
  on: (event: "change", listener: () => void) => void;
  off: (event: "change", listener: () => void) => void;
};

describe("PresenceBar", () => {
  it("renders connected users from awareness state", () => {
    const awareness: AwarenessLike = {
      getStates: () =>
        new Map<number, AwarenessState>([
          [
            1,
            {
              user: {
                name: "Alice",
                role: "Lecturer",
                color: "#ff0000",
              },
              typing: true,
            },
          ],
          [
            2,
            {
              user: {
                name: "Bob",
                role: "Student",
                color: "#00ff00",
              },
              typing: false,
            },
          ],
        ]),
      on: vi.fn(),
      off: vi.fn(),
    };

    render(<PresenceBar awareness={awareness as never} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Lecturer")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
    expect(screen.getByText("typing…")).toBeInTheDocument();
  });

  it("falls back to Anonymous and Student when user data is missing", () => {
    const awareness: AwarenessLike = {
      getStates: () =>
        new Map<number, AwarenessState>([
          [
            1,
            {
              user: {},
              typing: false,
            },
          ],
        ]),
      on: vi.fn(),
      off: vi.fn(),
    };

    render(<PresenceBar awareness={awareness as never} />);

    expect(screen.getByText("Anonymous")).toBeInTheDocument();
    expect(screen.getByText("Student")).toBeInTheDocument();
  });

  it("registers and unregisters awareness listeners", () => {
    const on = vi.fn<(event: "change", listener: () => void) => void>();
    const off = vi.fn<(event: "change", listener: () => void) => void>();

    const awareness: AwarenessLike = {
      getStates: () => new Map<number, AwarenessState>(),
      on,
      off,
    };

    const { unmount } = render(<PresenceBar awareness={awareness as never} />);

    expect(on).toHaveBeenCalledWith("change", expect.any(Function));

    unmount();

    expect(off).toHaveBeenCalledWith("change", expect.any(Function));
  });
});
