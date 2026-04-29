/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a test file, so we can be a bit more flexible with types
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Login from "./Login";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}));

import { supabase } from "../lib/supabase";

describe("Login page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs in successfully with valid credentials and navigates to dashboard", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: null,
      data: {} as any,
    });

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "  Test@Email.COM ");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@email.com",
        password: "password123",
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });


  it("shows an error message when login fails", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: "Invalid login credentials" } as any,
      data: null as any,
    });

    render(<Login />);

    await user.type(screen.getByPlaceholderText("Email"), "wrong@email.com");
    await user.type(screen.getByPlaceholderText("Password"), "wrongpassword");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(
      await screen.findByText("Invalid login credentials")
    ).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("has a sign up link that points to the signup page", () => {
    render(<Login />);

    const signUpLink = screen.getByRole("link", { name: "Sign up" });

    expect(signUpLink).toHaveAttribute("href", "/signup");
  });
});