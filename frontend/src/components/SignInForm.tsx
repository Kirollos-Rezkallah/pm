"use client";

import { useRef, useState, type FormEvent } from "react";

type SignInFormProps = {
  onSignIn: (username: string, password: string) => Promise<void>;
  error?: string;
};

export const SignInForm = ({ onSignIn, error }: SignInFormProps) => {
  const usernameRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setFieldError("Enter your username and password.");
      usernameRef.current?.focus();
      return;
    }
    setFieldError("");
    setIsSubmitting(true);
    try {
      await onSignIn(username.trim(), password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibleError = fieldError || error;

  return (
    <main className="signin-shell">
      <section className="signin-panel" aria-labelledby="signin-title">
        <p className="eyebrow">Project control room</p>
        <h1 id="signin-title">Kanban Studio</h1>
        <p className="signin-intro">Sign in to keep your project board moving.</p>
        {visibleError ? (
          <div className="form-alert" role="alert">
            {visibleError}
          </div>
        ) : null}
        <form noValidate onSubmit={handleSubmit} className="signin-form">
          <div className="field-group">
            <label htmlFor="username">Username</label>
            <input
              ref={usernameRef}
              id="username"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={visibleError ? "signin-error" : undefined}
            />
          </div>
          <div className="field-group">
            <label htmlFor="password">Password</label>
            <div className="secret-field">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldError)}
                aria-describedby={visibleError ? "signin-error" : undefined}
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          {visibleError ? <p id="signin-error" className="sr-only">{visibleError}</p> : null}
          <button className="button button-primary" type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
            <span>{isSubmitting ? "Signing in…" : "Sign in"}</span>
          </button>
        </form>
        <p className="signin-hint">MVP access: user / password</p>
      </section>
    </main>
  );
};
