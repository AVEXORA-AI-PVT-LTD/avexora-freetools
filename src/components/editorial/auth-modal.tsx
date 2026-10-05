"use client";

import { useState } from "react";

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: "login" | "signup";
  onClose: () => void;
}

export function AuthModal({ isOpen, initialMode = "login", onClose }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const isLogin = mode === "login";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError("");
    alert(`${isLogin ? "Logged in" : "Signed up"} successfully as ${email}`);
    onClose();
  };

  return (
    <div className="modal" id="authModal">
      <div className="modal-scrim" onClick={onClose} />
      <div
        className="auth"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authTitle"
      >
        <button
          className="icon-btn auth-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <use href="#ic-x" />
          </svg>
        </button>

        <span className="eyebrow-mono" id="authKicker">
          Avexora account
        </span>
        <h2 className="auth-title" id="authTitle">
          {isLogin ? "Welcome back." : "Create your account."}
        </h2>
        <p className="auth-copy">
          {isLogin
            ? "Log in to keep your saved tools and recent history."
            : "Sign up to unlock history, cloud sync and custom presets."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <label className="field-label" htmlFor="authEmail">
            Email
          </label>
          <input
            className="auth-input"
            id="authEmail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="field-label" htmlFor="authPass">
            Password
          </label>
          <div className="auth-pass">
            <input
              className="auth-input"
              id="authPass"
              name="password"
              type={showPass ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              className="auth-peek"
              type="button"
              aria-pressed={showPass}
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>

          {error && (
            <p className="auth-error" role="alert">
              {error}
            </p>
          )}

          <button className="btn btn-primary btn-lg auth-submit" type="submit">
            {isLogin ? "Log in" : "Create account"}
          </button>
        </form>

        <div className="auth-rule" aria-hidden="true">
          <span className="mono">or</span>
        </div>

        <button className="btn btn-secondary auth-google" type="button">
          <svg className="ico" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.3 14.3a7.1 7.1 0 0 1 0-4.6v-3h-4a12 12 0 0 0 0 10.7l4-3.1z"
            />
            <path
              fill="#EA4335"
              d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8z"
            />
          </svg>
          Continue with Google
        </button>

        <p className="auth-switch">
          <span>{isLogin ? "New here?" : "Already have an account?"}</span>
          <button
            type="button"
            onClick={() => {
              setMode(isLogin ? "signup" : "login");
              setError("");
            }}
          >
            {isLogin ? "Create an account" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}
