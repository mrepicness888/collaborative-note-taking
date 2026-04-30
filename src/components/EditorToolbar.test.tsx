/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import EditorToolbar from "./EditorToolbar";

function createMockEditor() {
  const run = vi.fn();

  const chain = {
    focus: vi.fn(() => chain),
    toggleBold: vi.fn(() => chain),
    toggleItalic: vi.fn(() => chain),
    toggleUnderline: vi.fn(() => chain),
    toggleHeading: vi.fn(() => chain),
    toggleBulletList: vi.fn(() => chain),
    toggleOrderedList: vi.fn(() => chain),
    undo: vi.fn(() => chain),
    redo: vi.fn(() => chain),
    setFontSize: vi.fn(() => chain),
    unsetFontSize: vi.fn(() => chain),
    insertInlineMath: vi.fn(() => chain),
    deleteInlineMath: vi.fn(() => chain),
    insertBlockMath: vi.fn(() => chain),
    deleteBlockMath: vi.fn(() => chain),
    run,
  };

  return {
    chain: vi.fn(() => chain),
    can: vi.fn(() => ({
      undo: vi.fn(() => true),
      redo: vi.fn(() => true),
    })),
    isActive: vi.fn(() => false),
    state: {
      selection: {
        empty: true,
        from: 0,
        to: 0,
      },
      doc: {
        textBetween: vi.fn(() => "x+y"),
      },
    },
    __chain: chain,
  };
}

describe("EditorToolbar", () => {
  it("renders nothing when editor is null", () => {
    const { container } = render(<EditorToolbar editor={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("calls toggleBold when bold button is clicked", async () => {
    const user = userEvent.setup();
    const editor = createMockEditor();

    render(<EditorToolbar editor={editor as any} />);

    await user.click(screen.getByRole("button", { name: "B" }));

    expect(editor.__chain.toggleBold).toHaveBeenCalled();
    expect(editor.__chain.run).toHaveBeenCalled();
  });

  it("calls toggleItalic when italic button is clicked", async () => {
    const user = userEvent.setup();
    const editor = createMockEditor();

    render(<EditorToolbar editor={editor as any} />);

    await user.click(screen.getByRole("button", { name: "I" }));

    expect(editor.__chain.toggleItalic).toHaveBeenCalled();
    expect(editor.__chain.run).toHaveBeenCalled();
  });

  it("calls setFontSize when font size is changed", async () => {
    const user = userEvent.setup();
    const editor = createMockEditor();

    render(<EditorToolbar editor={editor as any} />);

    await user.selectOptions(screen.getByRole("combobox"), "20px");

    expect(editor.__chain.setFontSize).toHaveBeenCalledWith("20px");
    expect(editor.__chain.run).toHaveBeenCalled();
  });

  it("disables toolbar buttons when disabled is true", () => {
    const editor = createMockEditor();

    render(<EditorToolbar editor={editor as any} disabled />);

    expect(screen.getByRole("button", { name: "B" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "I" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "U" })).toBeDisabled();
  });
});