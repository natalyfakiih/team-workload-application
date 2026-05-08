import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { validateToken, acceptInvitation } from "../api/invitationsApi";
import "../styling/AcceptInvitePage.css";

export default function AcceptInvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [validating, setValidating] = useState(Boolean(token));
  const [tokenError, setTokenError] = useState(
    token ? null : "No invitation token found in the URL.",
  );
  const [inviteInfo, setInviteInfo] = useState(null);

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    if (!token) return;
    const checkToken = async () => {
      try {
        const { data } = await validateToken(token);
        if (data.isValid) {
          setInviteInfo({ email: data.email, role: data.role });
        } else {
          setTokenError(data.errorMessage ?? "Invalid invitation.");
        }
      } catch {
        setTokenError("Could not validate invitation. Please try again.");
      } finally {
        setValidating(false);
      }
    };
    checkToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await acceptInvitation({ token, fullName, password });
      navigate("/login?invited=1");
    } catch (err) {
      setFormError(
        err.response?.data?.message ?? "Failed to complete registration.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Validating state ── */
  if (validating) {
    return (
      <div className="accept-invite">
        <div className="accept-invite__card">
          <div className="accept-invite__brand">
            <div className="accept-invite__logo">W</div>
            <div className="accept-invite__brand-text">
              <span className="accept-invite__brand-name">Workload</span>
              <span className="accept-invite__brand-sub">Team Management</span>
            </div>
          </div>
          <p className="accept-invite__validating">Validating invitation…</p>
        </div>
      </div>
    );
  }

  /* ── Token error state ── */
  if (tokenError) {
    return (
      <div className="accept-invite">
        <div className="accept-invite__card">
          <div className="accept-invite__brand">
            <div className="accept-invite__logo">W</div>
            <div className="accept-invite__brand-text">
              <span className="accept-invite__brand-name">Workload</span>
              <span className="accept-invite__brand-sub">Team Management</span>
            </div>
          </div>
          <h2 className="accept-invite__state-title">Invalid Invitation</h2>
          <p className="accept-invite__state-text accept-invite__state-text--error">
            {tokenError}
          </p>
          <p className="accept-invite__state-text">
            Please contact your administrator to send a new invitation.
          </p>
        </div>
      </div>
    );
  }

  /* ── Registration form ── */
  return (
    <div className="accept-invite">
      <div className="accept-invite__card">
        {/* Brand */}
        <div className="accept-invite__brand">
          <div className="accept-invite__logo">W</div>
          <div className="accept-invite__brand-text">
            <span className="accept-invite__brand-name">Workload</span>
            <span className="accept-invite__brand-sub">Team Management</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="accept-invite__title">Accept Invitation</h2>
        <p className="accept-invite__subtitle">
          You've been invited to join as a
          <span className="accept-invite__role-badge">{inviteInfo.role}</span>
        </p>

        {formError && <p className="accept-invite__error">{formError}</p>}

        <form className="accept-invite__form" onSubmit={handleSubmit}>
          <div className="accept-invite__field">
            <label className="accept-invite__label">Email</label>
            <input
              className="accept-invite__input accept-invite__input--readonly"
              type="email"
              value={inviteInfo.email}
              readOnly
            />
          </div>

          <div className="accept-invite__field">
            <label className="accept-invite__label">Role</label>
            <input
              className="accept-invite__input accept-invite__input--readonly"
              value={inviteInfo.role}
              readOnly
            />
          </div>

          <div className="accept-invite__field">
            <label className="accept-invite__label">Full Name *</label>
            <input
              className="accept-invite__input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="accept-invite__field">
            <label className="accept-invite__label">
              Password * (min 6 characters)
            </label>
            <input
              className="accept-invite__input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <div className="accept-invite__field">
            <label className="accept-invite__label">Confirm Password *</label>
            <input
              className="accept-invite__input"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button
            className="accept-invite__submit"
            type="submit"
            disabled={submitting}
          >
            {submitting ? "Creating account…" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
