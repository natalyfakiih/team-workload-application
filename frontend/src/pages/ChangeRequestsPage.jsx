import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAll,
  getPending,
  approveRequest,
  rejectRequest,
} from "../api/changeRequestsApi";
import "../styling/ChangeRequestsPage.css";

export default function ChangeRequestsPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("pending");
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ requests: null, error: null });
  const [actionError, setActionError] = useState(null);
  const [rejectNotes, setRejectNotes] = useState({});

  useEffect(() => {
    let cancelled = false;
    (tab === "pending" ? getPending() : getAll())
      .then(({ data }) => {
        if (!cancelled) setState({ requests: data, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            requests: [],
            error:
              err.response?.data?.message ?? "Failed to load change requests.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [tab, tick]);

  const handleApprove = async (id) => {
    setActionError(null);
    try {
      await approveRequest(id);
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to approve.");
    }
  };

  const handleReject = async (id) => {
    setActionError(null);
    try {
      await rejectRequest(id, rejectNotes[id] ?? "");
      setTick((t) => t + 1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to reject.");
    }
  };

  const { requests, error } = state;

  return (
    <div className="cr-page">
      {/* Header */}
      <div className="cr-page__header">
        <h2 className="cr-page__title">Change Requests</h2>
      </div>

      {/* Tabs */}
      <div className="cr-page__tabs">
        <button
          className={`cr-page__tab${tab === "pending" ? " cr-page__tab--active" : ""}`}
          onClick={() => setTab("pending")}
          disabled={tab === "pending"}
        >
          Pending
        </button>
        <button
          className={`cr-page__tab${tab === "all" ? " cr-page__tab--active" : ""}`}
          onClick={() => setTab("all")}
          disabled={tab === "all"}
        >
          All Requests
        </button>
      </div>

      {/* States */}
      {actionError && <p className="cr-page__error">{actionError}</p>}
      {requests === null && !error && (
        <p className="cr-page__loading">Loading…</p>
      )}
      {error && <p className="cr-page__error">{error}</p>}
      {requests !== null && requests.length === 0 && !error && (
        <p className="cr-page__empty">
          {tab === "pending" ? "No pending requests." : "No requests found."}
        </p>
      )}

      {/* Table */}
      {requests !== null && requests.length > 0 && (
        <div className="cr-page__card">
          <table className="cr-page__table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Type</th>
                <th>Old Value</th>
                <th>New Value</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                {tab === "pending" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    <button
                      className="cr-page__task-link"
                      onClick={() => navigate(`/tasks/${r.taskId}`)}
                    >
                      {r.taskTitle}
                    </button>
                  </td>
                  <td>{r.typeLabel}</td>
                  <td>{r.oldValue}</td>
                  <td>{r.newValue}</td>
                  <td>{r.reason ?? "—"}</td>
                  <td>{r.requestedByName}</td>
                  <td>{r.requestedAt?.slice(0, 10)}</td>
                  <td>
                    <span
                      className={`cr-page__status cr-page__status--${r.statusLabel?.toLowerCase()}`}
                    >
                      {r.statusLabel}
                    </span>
                  </td>
                  {tab === "pending" && (
                    <td>
                      <div className="cr-page__actions">
                        <button
                          className="cr-page__approve-btn"
                          onClick={() => handleApprove(r.id)}
                        >
                          Approve
                        </button>
                        <input
                          className="cr-page__reject-input"
                          placeholder="Rejection note"
                          value={rejectNotes[r.id] ?? ""}
                          onChange={(e) =>
                            setRejectNotes((n) => ({
                              ...n,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          className="cr-page__reject-btn"
                          onClick={() => handleReject(r.id)}
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
