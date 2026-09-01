import { describe, it, expect } from "vitest";
import { generateToken, hashToken, tokensMatch } from "./tokens";

describe("bearer tokens", () => {
  it("issues 256 bits of entropy as hex", () => {
    expect(generateToken().token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("never issues the same token twice", () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateToken().token));
    expect(seen.size).toBe(500);
  });

  it("stores a digest that is not the token", () => {
    // A database dump must hand an attacker nothing they can present as a cookie.
    const { token, hash } = generateToken();
    expect(hash).not.toBe(token);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("hashes deterministically, so a lookup is an indexed equality", () => {
    const { token, hash } = generateToken();
    expect(hashToken(token)).toBe(hash);
  });

  it("compares equal digests without leaking length through timing", () => {
    const { hash } = generateToken();
    expect(tokensMatch(hash, hash)).toBe(true);
    expect(tokensMatch(hash, hashToken("other"))).toBe(false);
    expect(tokensMatch(hash, "short")).toBe(false);
  });
});
