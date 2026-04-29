/* eslint-disable @typescript-eslint/no-explicit-any */
// This is a test file, so we can be a bit more flexible with types
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Signup from "./Signup";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

import { supabase } from "../lib/supabase";

describe("Signup page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs up successfully with valid credentials and navigates", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      error: null,
      data: {} as any,
    });

    render(<Signup />);

    await user.type(screen.getByPlaceholderText("Email"), "  Test@Email.COM ");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "test@email.com",
        password: "password123",
      });
    });

    expect(mockNavigate).toHaveBeenCalled();
  });

  it("shows an error message when signup fails", async () => {
    const user = userEvent.setup();

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      error: { message: "User already registered" },
      data: null,
    } as any);

    render(<Signup />);

    await user.type(screen.getByPlaceholderText("Email"), "test@email.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByRole("button", { name: /sign up/i }));

    expect(
      await screen.findByText("User already registered")
    ).toBeInTheDocument();

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("has a login link that points to the login page", () => {
    render(<Signup />);

    const loginLink = screen.getByRole("link", { name: /login/i });

    expect(loginLink).toHaveAttribute("href", "/login");
  });
});