import { test, expect } from "vitest"
import { normaliseEmail } from "./email"

test("normalises email correctly", () => {
  expect(normaliseEmail("  Student@Email.COM  "))
    .toBe("student@email.com")
})