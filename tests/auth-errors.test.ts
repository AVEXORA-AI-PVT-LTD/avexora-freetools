import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/components/account/auth-errors";

describe("authErrorMessage", () => {
  it("returns null for a missing error token", () => {
    expect(authErrorMessage(undefined)).toBeNull();
  });

  it("maps the page's own magic-link error codes", () => {
    expect(authErrorMessage("too_many_requests")).toBe(
      "Too many requests. Please wait a minute and try again.",
    );
    expect(authErrorMessage("invalid_email")).toBe(
      "Enter a valid work email and try again.",
    );
  });

  it("maps Auth.js OAuth token errors to friendly copy", () => {
    expect(authErrorMessage("OAuthAccountNotLinked")).toContain(
      "already linked",
    );
    expect(authErrorMessage("OAuthSignin")).toBe(
      "Sign-in didn't complete. Please try again.",
    );
    expect(authErrorMessage("OAuthCallback")).toBe(
      "Sign-in didn't complete. Please try again.",
    );
    expect(authErrorMessage("AccessDenied")).toBe(
      "Sign-in was not completed.",
    );
  });

  it("maps magic-link verification failures", () => {
    expect(authErrorMessage("Verification")).toContain("expired");
    expect(authErrorMessage("EmailSignin")).toContain("couldn't be sent");
  });

  it("never leaks configuration values in the Configuration message", () => {
    const message = authErrorMessage("Configuration");
    expect(message).not.toMatch(/secret|id|key/i);
    expect(message).toBe("Sign-in isn't configured correctly on this site.");
  });

  it("falls back to a generic message for unknown tokens", () => {
    expect(authErrorMessage("SomeInternalToken")).toBe(
      "That sign-in link didn't work. Please try again.",
    );
  });

  it("returns null for an empty token", () => {
    expect(authErrorMessage("")).toBeNull();
  });
});