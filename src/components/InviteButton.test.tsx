import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InviteButton from "./InviteButton";
import { supabase } from "../lib/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

type MembershipRow = {
  user_id: string;
  role: string;
};

type ProfileEmailRow = {
  email: string;
};

type ProfileLookupResult = {
  user_id: string;
} | null;

type InsertError = {
  code?: string;
  message: string;
} | null;

type DocumentMembershipsSelectQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => Promise<{ data: MembershipRow[] | null; error: null }>;
  };
  insert: (payload: {
    document_id: string;
    user_id: string;
    role: string;
  }) => Promise<{ error: InsertError }>;
};

type ProfilesEmailQuery = {
  select: (columns: string) => {
    eq: (
      column: string,
      value: string,
    ) => Promise<{ data: ProfileEmailRow[] | null }>;
    ilike: (
      column: string,
      value: string,
    ) => {
      maybeSingle: () => Promise<{ data: ProfileLookupResult }>;
    };
  };
};

type SupabaseTableName = "document_memberships" | "profiles";

type SupabaseFrom = (
  table: SupabaseTableName,
) => DocumentMembershipsSelectQuery | ProfilesEmailQuery;

const mockFrom = vi.mocked(supabase.from) as unknown as ReturnType<
  typeof vi.fn<SupabaseFrom>
>;

function setupSupabaseMocks(options?: {
  invitedMemberships?: MembershipRow[];
  profileEmailsByUserId?: Record<string, string>;
  lookupProfile?: ProfileLookupResult;
  insertError?: InsertError;
}) {
  const invitedMemberships = options?.invitedMemberships ?? [];
  const profileEmailsByUserId = options?.profileEmailsByUserId ?? {};
  const lookupProfile = options?.lookupProfile ?? null;
  const insertError = options?.insertError ?? null;

  const insertMock = vi.fn<
    (payload: {
      document_id: string;
      user_id: string;
      role: string;
    }) => Promise<{ error: InsertError }>
  >(async () => ({ error: insertError }));

  mockFrom.mockImplementation((table) => {
    if (table === "document_memberships") {
      return {
        select: () => ({
          eq: async () => ({
            data: invitedMemberships,
            error: null,
          }),
        }),
        insert: insertMock,
      };
    }

    return {
      select: () => ({
        eq: async (_column: string, value: string) => ({
          data: profileEmailsByUserId[value]
            ? [{ email: profileEmailsByUserId[value] }]
            : [],
        }),
        ilike: () => ({
          maybeSingle: async () => ({
            data: lookupProfile,
          }),
        }),
      }),
    };
  });

  return { insertMock };
}

describe("InviteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the email input and invite button", () => {
    setupSupabaseMocks();

    render(<InviteButton documentId="doc-123" />);

    expect(
      screen.getByPlaceholderText("student@email.ac.uk"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /invite/i }),
    ).toBeInTheDocument();
  });

  it("shows an error for an empty email", async () => {
    setupSupabaseMocks();

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(
      await screen.findByText("Please enter an email address."),
    ).toBeInTheDocument();
  });

  it("shows invited users in the dropdown when the input is clicked", async () => {
    setupSupabaseMocks({
      invitedMemberships: [
        { user_id: "user-1", role: "student" },
        { user_id: "user-2", role: "lecturer" },
      ],
      profileEmailsByUserId: {
        "user-1": "alice@email.ac.uk",
        "user-2": "bob@email.ac.uk",
      },
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    const input = screen.getByPlaceholderText("student@email.ac.uk");

    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("alice@email.ac.uk")).toBeInTheDocument();
      expect(screen.getByText("bob@email.ac.uk")).toBeInTheDocument();
      expect(screen.getByText("student")).toBeInTheDocument();
      expect(screen.getByText("lecturer")).toBeInTheDocument();
    });
  });

  it("shows an error when the user is not found", async () => {
    setupSupabaseMocks({
      lookupProfile: null,
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    await user.type(
      screen.getByPlaceholderText("student@email.ac.uk"),
      "missing@email.ac.uk",
    );
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(await screen.findByText("User not found.")).toBeInTheDocument();
  });

  it("inserts a membership and clears the input on success", async () => {
    const { insertMock } = setupSupabaseMocks({
      lookupProfile: { user_id: "user-456" },
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    const input = screen.getByPlaceholderText(
      "student@email.ac.uk",
    ) as HTMLInputElement;

    await user.type(input, "student@email.ac.uk");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    await waitFor(() => {
      expect(insertMock).toHaveBeenCalledWith({
        document_id: "doc-123",
        user_id: "user-456",
        role: "student",
      });
    });

    await waitFor(() => {
      expect(input.value).toBe("");
    });
  });

  it("shows a friendly duplicate message when the user is already invited locally", async () => {
    setupSupabaseMocks({
      invitedMemberships: [{ user_id: "user-1", role: "student" }],
      profileEmailsByUserId: {
        "user-1": "student@email.ac.uk",
      },
      lookupProfile: { user_id: "user-1" },
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    const input = screen.getByPlaceholderText("student@email.ac.uk");

    await user.click(input);

    await waitFor(() => {
      expect(screen.getByText("student@email.ac.uk")).toBeInTheDocument();
    });

    await user.clear(input);
    await user.type(input, "student@email.ac.uk");
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(
      await screen.findByText("That user is already invited to this document."),
    ).toBeInTheDocument();
  });

  it("shows a friendly duplicate message when the insert fails with a duplicate error", async () => {
    setupSupabaseMocks({
      lookupProfile: { user_id: "user-456" },
      insertError: {
        code: "23505",
        message: "duplicate key value violates unique constraint",
      },
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    await user.type(
      screen.getByPlaceholderText("student@email.ac.uk"),
      "student@email.ac.uk",
    );
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(
      await screen.findByText("That user is already invited to this document."),
    ).toBeInTheDocument();
  });

  it("shows a generic error message for other insert failures", async () => {
    setupSupabaseMocks({
      lookupProfile: { user_id: "user-456" },
      insertError: {
        message: "something went wrong",
      },
    });

    const user = userEvent.setup();
    render(<InviteButton documentId="doc-123" />);

    await user.type(
      screen.getByPlaceholderText("student@email.ac.uk"),
      "student@email.ac.uk",
    );
    await user.click(screen.getByRole("button", { name: /invite/i }));

    expect(
      await screen.findByText("Unable to invite user. Please try again."),
    ).toBeInTheDocument();
  });
});