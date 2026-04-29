import { describe, it, expect } from "vitest";
import { canEditMainText } from "./permissions";

describe("canEditMainText", () => {
  it("allows lecturers to edit in lecture mode", () => {
    expect(canEditMainText("lecture", "lecturer")).toBe(true);
  });

  it("does not allow students to edit in lecture mode", () => {
    expect(canEditMainText("lecture", "student")).toBe(false);
  });

  it("allows both roles to edit in discussion mode", () => {
    expect(canEditMainText("discussion", "student")).toBe(true);
    expect(canEditMainText("discussion", "lecturer")).toBe(true);
  });

  it("does not allow direct editing in revision mode", () => {
    expect(canEditMainText("revision", "student")).toBe(false);
    expect(canEditMainText("revision", "lecturer")).toBe(false);
  });
});