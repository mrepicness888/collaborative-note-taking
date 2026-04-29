/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a test file, so we can be a bit more flexible with types
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Dashboard from "./Dashboard";
import { supabase } from "../lib/supabase";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock("yjs", () => ({
  Doc: vi.fn(),
  encodeStateAsUpdate: vi.fn(() => new Uint8Array([1, 2, 3])),
}));

const mockFrom = vi.mocked(supabase.from);
const mockGetUser = vi.mocked(supabase.auth.getUser);

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: "user-123",
        },
      },
      error: null,
    } as any);
  });

  function setupSupabaseMocks(options?: {
    role?: string;
    documents?: { id: string; title: string; updated_at: string }[];
    createdDocument?: { id: string; title: string };
    existingMembership?: unknown;
    membershipError?: { message: string } | null;
  }) {
    const role = options?.role ?? "professor";
    const documents = options?.documents ?? [];
    const createdDocument = options?.createdDocument ?? {
      id: "doc-new",
      title: "New Document",
    };

    mockFrom.mockImplementation((table: string) => {
      if (table === "documents") {
        return {
          select: vi.fn((columns?: string) => {
            if (columns === "id, title, updated_at") {
              return {
                order: vi.fn().mockResolvedValue({
                  data: documents,
                  error: null,
                }),
              };
            }

            return {
              single: vi.fn().mockResolvedValue({
                data: createdDocument,
                error: null,
              }),
            };
          }),

          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: createdDocument,
                error: null,
              }),
            })),
          })),
        } as any;
      }

      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn().mockResolvedValue({
                data: { account_role: role },
                error: null,
              }),
            })),
          })),
        } as any;
      }

      if (table === "document_memberships") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: options?.existingMembership ?? null,
                  error: null,
                }),
              })),
            })),
          })),

          insert: vi.fn().mockResolvedValue({
            error: options?.membershipError ?? null,
          }),
        } as any;
      }

      throw new Error(`Unexpected table: ${table}`);
    });
  }

  it("renders documents loaded from Supabase", async () => {
    setupSupabaseMocks({
      documents: [
        {
          id: "doc-1",
          title: "Lecture Notes",
          updated_at: "2026-04-01T10:00:00.000Z",
        },
      ],
    });

    render(<Dashboard />);

    expect(await screen.findByText("Lecture Notes")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Total Documents")).toBeInTheDocument();
  });

  it("shows create document controls for professors", async () => {
    setupSupabaseMocks({ role: "professor" });

    render(<Dashboard />);

    expect(
      await screen.findByPlaceholderText("New Document title...")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: /create document/i })
    ).toBeInTheDocument();
  });

  it("does not show create document controls for non-professors", async () => {
    setupSupabaseMocks({ role: "student" });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByPlaceholderText("New Document title...")
    ).not.toBeInTheDocument();

    expect(
      screen.queryByRole("button", { name: /create document/i })
    ).not.toBeInTheDocument();
  });

  it("navigates to a document when Open is clicked", async () => {
    const user = userEvent.setup();

    setupSupabaseMocks({
      documents: [
        {
          id: "doc-1",
          title: "Lecture Notes",
          updated_at: "2026-04-01T10:00:00.000Z",
        },
      ],
    });

    render(<Dashboard />);

    await screen.findByText("Lecture Notes");

    await user.click(screen.getByRole("button", { name: /open/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/docs/doc-1");
  });

  it("creates a document and navigates to it", async () => {
    const user = userEvent.setup();

    setupSupabaseMocks({
      role: "professor",
      createdDocument: {
        id: "doc-new",
        title: "New Lecture",
      },
    });

    render(<Dashboard />);

    const input = await screen.findByPlaceholderText("New Document title...");

    await user.type(input, "New Lecture");
    await user.click(screen.getByRole("button", { name: /create document/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/docs/doc-new");
    });
  });

  it("shows an empty state when no documents exist", async () => {
    setupSupabaseMocks({
      documents: [],
      role: "professor",
    });

    render(<Dashboard />);

    expect(await screen.findByText("No documents yet.")).toBeInTheDocument();
    expect(
      screen.getByText("Create your first collaborative lecture to get started.")
    ).toBeInTheDocument();
  });
});