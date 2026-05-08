import { useState, useEffect } from "react";
import { getTeams, createTeam, renameTeam, deleteTeam } from "../api/teamsApi";
import { getUsers, assignTeam } from "../api/usersApi";
import "../styling/TeamsPage.css";

export default function TeamsPage() {
  const [teams, setTeams] = useState(null);
  const [users, setUsers] = useState([]);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([getTeams(), getUsers()])
      .then(([t, u]) => {
        if (!cancelled) {
          setTeams(t.data);
          setUsers(u.data);
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError(err.response?.data?.message ?? "Failed to load.");
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createTeam(newName.trim());
      setNewName("");
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to create team.");
    }
  };

  const handleRename = async (id) => {
    setActionError(null);
    try {
      await renameTeam(id, editName.trim());
      setEditId(null);
      setEditName("");
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to rename team.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this team?")) return;
    setActionError(null);
    try {
      await deleteTeam(id);
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to delete team.");
    }
  };

  const handleAssignTeam = async (userId, teamId) => {
    setActionError(null);
    try {
      await assignTeam(userId, teamId ? Number(teamId) : null);
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to assign team.");
    }
  };

  const members = users.filter((u) => u.role === "Member");

  return (
    <div className="teams-page">
      {/* Header */}
      <div className="teams-page__header">
        <h2 className="teams-page__title">Teams</h2>
      </div>

      {/* Errors */}
      {actionError && <p className="teams-page__error">{actionError}</p>}
      {error && <p className="teams-page__error">{error}</p>}
      {teams === null && !error && (
        <p className="teams-page__loading">Loading…</p>
      )}

      {/* Create form */}
      <form className="teams-page__create-form" onSubmit={handleCreate}>
        <input
          className="teams-page__create-input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New team name"
          required
        />
        <button className="teams-page__create-btn" type="submit">
          + Create Team
        </button>
      </form>

      {/* Teams table */}
      {teams !== null && teams.length === 0 && (
        <p className="teams-page__empty">No teams yet.</p>
      )}
      {teams !== null && teams.length > 0 && (
        <div className="teams-page__card">
          <div className="teams-page__section-title">All Teams</div>
          <table className="teams-page__table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Members</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((t) => (
                <tr key={t.id}>
                  <td>{t.id}</td>
                  <td>
                    {editId === t.id ? (
                      <div className="teams-page__rename-row">
                        <input
                          className="teams-page__rename-input"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                        />
                        <button
                          className="teams-page__save-btn"
                          onClick={() => handleRename(t.id)}
                        >
                          Save
                        </button>
                        <button
                          className="teams-page__cancel-btn"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      t.name
                    )}
                  </td>
                  <td>
                    <span className="teams-page__count-badge">
                      {t.memberCount}
                    </span>
                  </td>
                  <td>
                    <div className="teams-page__actions-cell">
                      {editId !== t.id && (
                        <button
                          className="teams-page__rename-btn"
                          onClick={() => {
                            setEditId(t.id);
                            setEditName(t.name);
                          }}
                        >
                          Rename
                        </button>
                      )}
                      <button
                        className="teams-page__delete-btn"
                        onClick={() => handleDelete(t.id)}
                        disabled={t.memberCount > 0}
                        title={
                          t.memberCount > 0 ? "Reassign members first" : ""
                        }
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Member assignments */}
      {members.length === 0 ? (
        <p className="teams-page__empty">No members found.</p>
      ) : (
        <div className="teams-page__card">
          <div className="teams-page__section-title">
            Member Team Assignments
          </div>
          <table className="teams-page__table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Team</th>
                <th>Assign Team</th>
              </tr>
            </thead>
            <tbody>
              {members.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName}</td>
                  <td>{u.email}</td>
                  <td>{u.teamName ?? "—"}</td>
                  <td>
                    <select
                      className="teams-page__assign-select"
                      value={u.teamId ?? ""}
                      onChange={(e) => handleAssignTeam(u.id, e.target.value)}
                    >
                      <option value="">— unassigned —</option>
                      {(teams ?? []).map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
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
