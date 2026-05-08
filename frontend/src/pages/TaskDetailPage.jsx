import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  getTaskById,
  acknowledgeTask,
  updateStatus,
  deleteTask,
} from "../api/tasksApi";
import {
  getByTask,
  getMyTaskCRs,
  createChangeRequest,
  approveRequest,
  rejectRequest,
} from "../api/changeRequestsApi";
import "../styling/TaskDetailPage.css";

const STATUSES = [
  "New",
  "InProgress",
  "Blocked",
  "Done",
  "OnHold",
  "Cancelled",
];
const STATUS_MAP = {
  New: 0,
  InProgress: 1,
  Blocked: 2,
  Done: 3,
  OnHold: 4,
  Cancelled: 5,
};
const STATUS_LABEL_MAP = {
  0: "New",
  1: "InProgress",
  2: "Blocked",
  3: "Done",
  4: "OnHold",
  5: "Cancelled",
};
const CR_TYPES = [
  "ChangeOwner",
  "ChangeDueDate",
  "IncreaseEffort",
  "ChangePriority",
  "ChangeStatus",
];
const CR_TYPE_MAP = {
  ChangeOwner: 0,
  ChangeDueDate: 1,
  IncreaseEffort: 2,
  ChangePriority: 3,
  ChangeStatus: 4,
};

export default function TaskDetailPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [task, setTask] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);

  const [crForm, setCrForm] = useState({
    type: "ChangeOwner",
    newValue: "",
    reason: "",
  });
  const [showCrForm, setShowCrForm] = useState(false);
  const [rejectNotes, setRejectNotes] = useState({});

  useEffect(() => {
    const fetchTask = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getTaskById(taskId);
        setTask(data);
      } catch (err) {
        setError(err.response?.data?.message ?? "Task not found.");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role === "TeamLeader" || user?.role === "Admin") {
          const { data } = await getByTask(taskId);
          setRequests(data);
        } else if (user?.role === "Member") {
          const { data } = await getMyTaskCRs(taskId);
          setRequests(data);
        }
      } catch {
        // non-critical
      }
    };
    load();
  }, [taskId, user?.role]);

  const handleAcknowledge = async () => {
    try {
      await acknowledgeTask(taskId);
      const { data } = await getTaskById(taskId);
      setTask(data);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to acknowledge.");
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await updateStatus(taskId, STATUS_MAP[e.target.value]);
      const { data } = await getTaskById(taskId);
      setTask(data);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this task? This cannot be undone.",
      )
    )
      return;
    try {
      await deleteTask(taskId);
      navigate(-1);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to delete task.");
    }
  };

  const handleCreateCR = async (e) => {
    e.preventDefault();
    try {
      await createChangeRequest({
        taskId: Number(taskId),
        ...crForm,
        type: CR_TYPE_MAP[crForm.type],
      });
      setShowCrForm(false);
      setCrForm({ type: "ChangeOwner", newValue: "", reason: "" });
      if (user?.role === "TeamLeader" || user?.role === "Admin") {
        const { data } = await getByTask(taskId);
        setRequests(data);
      } else if (user?.role === "Member") {
        const { data } = await getMyTaskCRs(taskId);
        setRequests(data);
      }
    } catch (err) {
      setActionError(
        err.response?.data?.message ?? "Failed to submit request.",
      );
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveRequest(id);
      const [crRes, taskRes] = await Promise.all([
        getByTask(taskId),
        getTaskById(taskId),
      ]);
      setRequests(crRes.data);
      setTask(taskRes.data);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to approve.");
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectRequest(id, rejectNotes[id] ?? "");
      const { data } = await getByTask(taskId);
      setRequests(data);
    } catch (err) {
      setActionError(err.response?.data?.message ?? "Failed to reject.");
    }
  };

  if (loading) return <p className="task-detail__loading">Loading…</p>;
  if (error) return <p className="task-detail__error">{error}</p>;
  if (!task) return null;

  const isMember = user?.role === "Member";
  const isLeader = user?.role === "TeamLeader" || user?.role === "Admin";
  const isAssignedToMe = task.assignedToId === user?.userId;

  return (
    <div className="task-detail">
      {/* Header */}
      <div className="task-detail__header">
        <button className="task-detail__back" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h2 className="task-detail__title">{task.title}</h2>
        {isLeader && (
          <>
            <button
              className="task-detail__edit-btn"
              onClick={() => navigate(`/tasks/${taskId}/edit`)}
            >
              Edit Task
            </button>
            <button className="task-detail__delete-btn" onClick={handleDelete}>
              Delete Task
            </button>
          </>
        )}
      </div>

      {actionError && <p className="task-detail__error">{actionError}</p>}

      {/* Info */}
      <div className="task-detail__section">
        <h3 className="task-detail__section-title">Details</h3>
        <table className="task-detail__info-table">
          <tbody>
            <tr>
              <td>Description</td>
              <td>{task.description || "—"}</td>
            </tr>
            <tr>
              <td>Assigned To</td>
              <td>{task.assignedToName}</td>
            </tr>
            <tr>
              <td>Priority</td>
              <td>{task.priorityLabel}</td>
            </tr>
            <tr>
              <td>Complexity</td>
              <td>{task.complexityLabel}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>{task.statusLabel}</td>
            </tr>
            <tr>
              <td>Start Date</td>
              <td>{task.startDate?.slice(0, 10)}</td>
            </tr>
            <tr>
              <td>Due Date</td>
              <td>{task.dueDate?.slice(0, 10)}</td>
            </tr>
            <tr>
              <td>Acknowledged</td>
              <td>
                {task.isAcknowledged
                  ? `✓ ${task.acknowledgedAt?.slice(0, 10)}`
                  : "No"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Weight breakdown 
      <div className="task-detail__section">
        <h3 className="task-detail__section-title">Weight Breakdown</h3>
        <WeightBreakdown task={task} />
      </div> */}

      {/* Member actions */}
      {isMember && isAssignedToMe && (
        <div className="task-detail__section">
          <h3 className="task-detail__section-title">My Actions</h3>
          <div className="task-detail__actions">
            {!task.isAcknowledged && (
              <button
                className="task-detail__acknowledge-btn"
                onClick={handleAcknowledge}
              >
                Acknowledge Task
              </button>
            )}

            <div className="task-detail__status-row">
              <span className="task-detail__status-label">Update Status:</span>
              <select
                className="task-detail__select"
                value={STATUS_LABEL_MAP[task.status] ?? task.statusLabel}
                onChange={handleStatusChange}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="task-detail__cr-toggle"
              onClick={() => setShowCrForm((v) => !v)}
            >
              {showCrForm ? "Cancel" : "Request Change"}
            </button>

            {showCrForm && (
              <form className="task-detail__cr-form" onSubmit={handleCreateCR}>
                <div className="task-detail__cr-field">
                  <label className="task-detail__cr-field-label">Type</label>
                  <select
                    className="task-detail__select"
                    value={crForm.type}
                    onChange={(e) =>
                      setCrForm((f) => ({ ...f, type: e.target.value }))
                    }
                  >
                    {CR_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="task-detail__cr-field">
                  <label className="task-detail__cr-field-label">
                    New Value
                  </label>
                  {crForm.type === "ChangePriority" ? (
                    <select
                      className="task-detail__select"
                      value={crForm.newValue}
                      onChange={(e) =>
                        setCrForm((f) => ({ ...f, newValue: e.target.value }))
                      }
                      required
                    >
                      <option value="">— select priority —</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                      <option value="4">Critical</option>
                    </select>
                  ) : crForm.type === "ChangeStatus" ? (
                    <select
                      className="task-detail__select"
                      value={crForm.newValue}
                      onChange={(e) =>
                        setCrForm((f) => ({ ...f, newValue: e.target.value }))
                      }
                      required
                    >
                      <option value="">— select status —</option>
                      <option value="0">New</option>
                      <option value="1">InProgress</option>
                      <option value="2">Blocked</option>
                      <option value="3">Done</option>
                      <option value="4">OnHold</option>
                      <option value="5">Cancelled</option>
                    </select>
                  ) : (
                    <input
                      className="task-detail__cr-input"
                      value={crForm.newValue}
                      onChange={(e) =>
                        setCrForm((f) => ({ ...f, newValue: e.target.value }))
                      }
                      placeholder={
                        crForm.type === "ChangeDueDate"
                          ? "yyyy-mm-dd"
                          : crForm.type === "IncreaseEffort"
                            ? "12.5"
                            : "user ID"
                      }
                      required
                    />
                  )}
                </div>
                <div className="task-detail__cr-field">
                  <label className="task-detail__cr-field-label">Reason</label>
                  <input
                    className="task-detail__cr-input"
                    value={crForm.reason}
                    onChange={(e) =>
                      setCrForm((f) => ({ ...f, reason: e.target.value }))
                    }
                  />
                </div>
                <button className="task-detail__cr-submit" type="submit">
                  Submit Request
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Status history */}
      <div className="task-detail__section">
        <h3 className="task-detail__section-title">Status History</h3>
        {!task.statusHistory?.length ? (
          <p className="task-detail__empty">No history.</p>
        ) : (
          <table className="task-detail__table">
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Changed By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {task.statusHistory.map((h, i) => (
                <tr key={i}>
                  <td>{h.oldStatus}</td>
                  <td>{h.newStatus}</td>
                  <td>{h.changedBy}</td>
                  <td>{h.changedAt?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Change requests */}
      <div className="task-detail__section">
        <h3 className="task-detail__section-title">Change Requests</h3>
        {requests.length === 0 ? (
          <p className="task-detail__empty">No change requests.</p>
        ) : (
          <table className="task-detail__table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Old</th>
                <th>New</th>
                <th>Reason</th>
                <th>Requested By</th>
                <th>Status</th>
                {isLeader && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>{r.typeLabel}</td>
                  <td>{r.oldValue}</td>
                  <td>{r.newValue}</td>
                  <td>{r.reason ?? "—"}</td>
                  <td>{r.requestedByName}</td>
                  <td>{r.statusLabel}</td>
                  {isLeader && (
                    <td>
                      {r.status === 0 && (
                        <div className="task-detail__cr-actions">
                          <button
                            className="task-detail__approve-btn"
                            onClick={() => handleApprove(r.id)}
                          >
                            Approve
                          </button>
                          <input
                            className="task-detail__reject-input"
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
                            className="task-detail__reject-btn"
                            onClick={() => handleReject(r.id)}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
