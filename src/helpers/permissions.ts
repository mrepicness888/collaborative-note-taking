export type EditorMode = "lecture" | "discussion" | "revision";
export type Role = "lecturer" | "student";

export function canEditMainText(mode: EditorMode, role: Role): boolean {
  return mode === "discussion" || (mode === "lecture" && role === "lecturer");
}