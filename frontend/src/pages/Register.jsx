import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const trimmedEmail = email.trim();
      const displayName = name.trim() || trimmedEmail.split("@")[0];

      const res = await fetch("http://127.0.0.1:5000/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: displayName,
          email: trimmedEmail,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        setError(data.message || "Registration failed");
      }
    } catch {
      setError("Unable to reach server. Ensure backend is running on port 5000.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <form onSubmit={handleRegister} className="auth-card">
        <p className="brand-mark justify-center mb-3"><span className="brand-dot" /> LumaForms</p>
        <h2 className="text-2xl font-bold mb-2 text-center">Create Account</h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 text-center">
          Start building elegant feedback flows.
        </p>

        <input
          type="text"
          placeholder="Name"
          className="input-base mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

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
          minLength={6}
        />

        {error ? (
          <p className="error-message mb-3">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>

        <p className="mt-4 text-center">
          Already have an account? <Link to="/login" className="text-[var(--color-primary)]">Login</Link>
        </p>
      </form>
    </div>
  );
}
