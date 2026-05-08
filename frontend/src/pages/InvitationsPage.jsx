import { useState, useEffect } from "react";
import {
  getInvitations,
  createInvitation,
  cancelInvitation,
} from "../api/invitationsApi";
import "../styling/InvitationsPage.css";

const ROLES = ["Member", "TeamLeader", "Admin"];
const emptyForm = { email: "", role: "Member", teamId: "" };

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getInvitations();
        setInvitations(data);
      } catch (err) {
        setError(err.response?.data?.message ?? "Failed to load invitations.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvitations();
  }, []);

  const refreshList = async () => {
    try {
      const { data } = await getInvitations();
      setInvitations(data);
    } catch {
      // silent
    }
  };

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      await createInvitation({
        ...form,
        teamId: form.teamId ? Number(form.teamId) : null,
      });
      setFormSuccess(`Invitation sent to ${form.email}.`);
      setForm(emptyForm);
      setShowForm(false);
      await refreshList();
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to send invitation.");
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async (id, email) => {
    if (!confirm(`Cancel invitation for ${email}?`)) return;
    setActionError(null);
    try {
      await cancelInvitation(id);
      await refreshList();
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to cancel.");
    }
  };

  return (
    <div className="invitations-page">
      {/* Header */}
      <div className="invitations-page__header">
        <h2 className="invitations-page__title">Invitations</h2>
        <button
          className={
            showForm
              ? "invitations-page__cancel-btn"
              : "invitations-page__send-btn"
          }
          onClick={() => {
            setShowForm((v) => !v);
            setFormError(null);
            setFormSuccess(null);
          }}
        >
          {showForm ? "Cancel" : "+ Send Invitation"}
        </button>
      </div>

      {/* Banners */}
      {formSuccess && (
        <p className="invitations-page__success">{formSuccess}</p>
      )}
      {actionError && <p className="invitations-page__error">{actionError}</p>}
      {error && <p className="invitations-page__error">{error}</p>}

      {/* Send form */}
      {showForm && (
        <div className="invitations-page__form-card">
          <div className="invitations-page__form-header">
            <h3 className="invitations-page__form-title">Send Invitation</h3>
          </div>
          <form className="invitations-page__form" onSubmit={handleSend}>
            {formError && (
              <p className="invitations-page__form-error">{formError}</p>
            )}

            <div className="invitations-page__field invitations-page__field--full">
              <label className="invitations-page__label">Email *</label>
              <input
                className="invitations-page__input"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="invitee@example.com"
                required
              />
            </div>

            <div className="invitations-page__field">
              <label className="invitations-page__label">Role *</label>
              <select
                className="invitations-page__select"
                value={form.role}
                onChange={set("role")}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="invitations-page__field">
              <label className="invitations-page__label">
                Team ID (optional)
              </label>
              <input
                className="invitations-page__input"
                type="number"
                value={form.teamId}
                onChange={set("teamId")}
                placeholder="e.g. 3"
              />
            </div>

            <div className="invitations-page__form-footer">
              <button
                className="invitations-page__submit-btn"
                type="submit"
                disabled={sending}
              >
                {sending ? "Sending…" : "Send Invite"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && <p className="invitations-page__loading">Loading…</p>}
      {!loading && invitations.length === 0 && (
        <p className="invitations-page__empty">No invitations yet.</p>
      )}

      {/* Table */}
      {invitations.length > 0 && (
        <div className="invitations-page__card">
          <table className="invitations-page__table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
                <th>Status</th>
                <th>Invited By</th>
                <th>Sent</th>
                <th>Expires</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((inv) => (
                <tr key={inv.id}>
                  <td>{inv.email}</td>
                  <td>{inv.role}</td>
                  <td>{inv.teamName ?? "—"}</td>
                  <td>
                    <span
                      className={`invitations-page__status invitations-page__status--${inv.status.toLowerCase()}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td>{inv.invitedByName}</td>
                  <td>{inv.createdAt?.slice(0, 10)}</td>
                  <td>{inv.expiresAt?.slice(0, 10)}</td>
                  <td>
                    {inv.status === "Pending" && (
                      <button
                        className="invitations-page__row-cancel"
                        onClick={() => handleCancel(inv.id, inv.email)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
