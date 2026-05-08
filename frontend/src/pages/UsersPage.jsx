import { useState, useEffect } from "react";
import { getUsers, createUser } from "../api/usersApi";
import "../styling/UsersPage.css";

const ROLES = ["Admin", "TeamLeader", "Member"];

const emptyForm = {
  fullName: "",
  email: "",
  password: "",
  role: "Member",
  teamId: "",
};

function Avatar({ name }) {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  const hue =
    [...(name || "")].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className="users-page__avatar"
      style={{ background: `hsl(${hue}, 55%, 52%)` }}
    >
      {initials}
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getUsers();
        setUsers(data);
      } catch {
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await createUser({
        ...form,
        teamId: form.teamId ? Number(form.teamId) : null,
      });
      setShowForm(false);
      setForm(emptyForm);
      const { data } = await getUsers();
      setUsers(data);
    } catch (err) {
      setFormError(err.response?.data?.message ?? "Failed to create user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-page__header">
        <h2 className="users-page__title">Users</h2>
        <button
          className={
            showForm ? "users-page__cancel-btn" : "users-page__create-btn"
          }
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Cancel" : "+ Create User"}
        </button>
      </div>

      {error && <p className="users-page__error">{error}</p>}

      {/* Create form */}
      {showForm && (
        <div className="users-page__form-card">
          <div className="users-page__form-header">
            <h3 className="users-page__form-title">New User</h3>
          </div>
          <form className="users-page__form" onSubmit={handleCreate}>
            {formError && <p className="users-page__form-error">{formError}</p>}

            <div className="users-page__field">
              <label className="users-page__label">Full Name *</label>
              <input
                className="users-page__input"
                value={form.fullName}
                onChange={set("fullName")}
                required
              />
            </div>

            <div className="users-page__field">
              <label className="users-page__label">Email *</label>
              <input
                className="users-page__input"
                type="email"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>

            <div className="users-page__field">
              <label className="users-page__label">Password *</label>
              <input
                className="users-page__input"
                type="password"
                value={form.password}
                onChange={set("password")}
                required
                minLength={6}
              />
            </div>

            <div className="users-page__field">
              <label className="users-page__label">Role *</label>
              <select
                className="users-page__select"
                value={form.role}
                onChange={set("role")}
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="users-page__field">
              <label className="users-page__label">Team ID (optional)</label>
              <input
                className="users-page__input"
                type="number"
                value={form.teamId}
                onChange={set("teamId")}
              />
            </div>

            <div className="users-page__form-footer">
              <button
                className="users-page__submit-btn"
                type="submit"
                disabled={saving}
              >
                {saving ? "Creating…" : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loading */}
      {loading && <p className="users-page__loading">Loading…</p>}

      {/* Table */}
      {!loading && (
        <div className="users-page__table-card">
          <table className="users-page__table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Team</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="users-page__avatar-cell">
                      <Avatar name={u.fullName} />
                      {u.fullName}
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`users-page__role-badge users-page__role-badge--${u.role.toLowerCase()}`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.teamName ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
