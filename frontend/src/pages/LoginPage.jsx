import { useState, useContext } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styling/LoginPage.css";

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get("invited") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__card">
        {/* Brand */}
        <div className="login-page__brand">
          <div className="login-page__logo">W</div>
          <div className="login-page__brand-text">
            <span className="login-page__brand-name">Team Workspace</span>
            <span className="login-page__brand-sub">Task Management</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="login-page__title">Welcome back</h2>
        <p className="login-page__subtitle">
          Sign in to your account to continue
        </p>

        {/* Banners */}
        {justRegistered && (
          <p className="login-page__success">
            Account created successfully! Please log in.
          </p>
        )}
        {error && <p className="login-page__error">{error}</p>}

        {/* Form */}
        <form className="login-page__form" onSubmit={handleSubmit}>
          <div className="login-page__field">
            <label className="login-page__label">Email</label>
            <input
              className="login-page__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="login-page__field">
            <label className="login-page__label">Password</label>
            <input
              className="login-page__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            className="login-page__submit"
            type="submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
