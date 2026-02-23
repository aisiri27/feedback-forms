import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const DEMO_EMAIL = "demo@chiac.local";
const DEMO_PASSWORD = "Demo@123";
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Login() {
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const completeLogin = useCallback((payload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    navigate("/");
  }, [navigate]);

  const handleGoogleCredential = useCallback(async (credentialResponse) => {
    try {
      const credential = credentialResponse?.credential;
      if (!credential) {
        setError("Google credential missing");
        return;
      }

      const res = await fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Google login failed");
        return;
      }

      completeLogin(data);
    } catch {
      setError("Google login failed. Check backend and client ID.");
    }
  }, [completeLogin]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (!window.google?.accounts?.id || !googleBtnRef.current) return;

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleCredential,
    });

    googleBtnRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      shape: "pill",
      text: "continue_with",
      width: 370,
    });
  }, [handleGoogleCredential]);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");

    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("token", "demo-token");
      localStorage.setItem(
        "user",
        JSON.stringify({
          name: "Demo User",
          email: DEMO_EMAIL,
        })
      );
      navigate("/");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        completeLogin(data);
      } else {
        setError(data.message || "Login failed");
      }
    } catch {
      setError("Unable to reach backend on port 5000");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={handleLogin} className="auth-card">
        <p className="brand-mark justify-center mb-3"><span className="brand-dot" /> LumaForms</p>
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 text-center">
          Sign in to your feedback workspace.
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mb-4 text-center">
          Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
        </p>

        <button
          type="button"
          onClick={() => {
            setEmail(DEMO_EMAIL);
            setPassword(DEMO_PASSWORD);
          }}
          className="auth-login-btn w-full mb-3"
        >
          Use Demo Credentials
        </button>

        <input
          type="email"
          placeholder="Email"
          className="input-base mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          className="input-base mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error ? <p className="error-message mb-3">{error}</p> : null}

        <button
          type="submit"
          onClick={handleLogin}
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>

        {GOOGLE_CLIENT_ID ? (
          <div className="mt-3">
            <div className="flex items-center gap-2 my-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-xs text-slate-500">OR</span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>
            <div ref={googleBtnRef} className="flex justify-center" />
          </div>
        ) : (
          <p className="text-xs text-[var(--color-text-secondary)] mt-3 text-center">
            Google login disabled. Set <code>VITE_GOOGLE_CLIENT_ID</code> in frontend <code>.env</code>.
          </p>
        )}

        <p className="mt-4 text-center">
          Do not have an account?{" "}
          <Link to="/register" className="text-[var(--color-primary)] font-semibold">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
