/**
 * Maps Auth.js error tokens (the `?error=` value NextAuth puts on the pages.error
 * route) and the page's own error codes to user-facing messages.
 *
 * Returns a display string, or null when the page has nothing specific to show
 * for the token (e.g. a missing `error` param). Messages are intentionally
 * helpful but deliberately never leak provider internals, stack traces or
 * configuration values.
 */

const MESSAGES: Record<string, string> = {
  // Page-level codes raised by the magic-link flow.
  too_many_requests:
    "Too many requests. Please wait a minute and try again.",
  invalid_email: "Enter a valid work email and try again.",
  // Auth.js token errors raised by the providers and callbacks.
  OAuthAccountNotLinked:
    "This email is already linked to a different sign-in method. Sign in with the method you originally used.",
  OAuthSignin: "Sign-in didn't complete. Please try again.",
  OAuthCallback: "Sign-in didn't complete. Please try again.",
  OAuthCreateAccount:
    "We couldn't finish creating your account. Please try again.",
  EmailSignin: "The sign-in link couldn't be sent. Please try again.",
  Verification:
    "That sign-in link has expired or was already used. Please request a new one.",
  AccessDenied: "Sign-in was not completed.",
  Configuration: "Sign-in isn't configured correctly on this site.",
  FacebookUnavailable:
    "Facebook sign-in isn't available on this instance.",
};

export function authErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  return MESSAGES[error] ?? "That sign-in link didn't work. Please try again.";
}