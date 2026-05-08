import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTasks } from "../api/tasksApi";
import "../styling/TasksPage.css";

const STATUS_LABELS = {
  0: "New",
  1: "InProgress",
  2: "Blocked",
  3: "Done",
  4: "OnHold",
  5: "Cancelled",
};
const PRIORITY_LABELS = { 1: "Low", 2: "Medium", 3: "High", 4: "Critical" };

export default function TasksPage() {
  const navigate = useNavigate();

  const [state, setState] = useState({ tasks: null, error: null });
  const [tick, setTick] = useState(0);

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");

  useEffect(() => {
    let cancelled = false;
    getTasks()
      .then(({ data }) => {
        if (!cancelled) setState({ tasks: data, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            tasks: [],
            error: err.response?.data?.message ?? "Failed to load tasks.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const { tasks, error } = state;

  const filtered = (tasks ?? []).filter((t) => {
    const matchSearch =
      !search ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.assignedToName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || String(t.status) === filterStatus;
    const matchPriority =
      !filterPriority || String(t.priority) === filterPriority;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="tasks-page">
      {/* Header */}
      <div className="tasks-page__header">
        <h2 className="tasks-page__title">Tasks</h2>
        <button
          className="tasks-page__create-btn"
          onClick={() => navigate("/tasks/new")}
        >
          + Create Task
        </button>
      </div>

      {/* Filters */}
      <div className="tasks-page__filters">
        <input
          className="tasks-page__search"
          placeholder="Search title or assignee…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="tasks-page__select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="tasks-page__select"
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          {Object.entries(PRIORITY_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </select>
        <button
          className="tasks-page__refresh-btn"
          onClick={() => setTick((t) => t + 1)}
        >
          ↺ Refresh
        </button>
      </div>

      {/* States */}
      {tasks === null && !error && (
        <p className="tasks-page__loading">Loading…</p>
      )}
      {error && <p className="tasks-page__error">{error}</p>}
      {tasks !== null && filtered.length === 0 && (
        <p className="tasks-page__empty">No tasks found.</p>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <table className="tasks-page__table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Complexity</th>
              <th>Effort</th>
              <th>Weight</th>
              <th>Status</th>
              <th>Due Date</th>
              <th>Acknowledged</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)}>
                <td>{t.title}</td>
                <td>{t.assignedToName}</td>
                <td>{t.priorityLabel}</td>
                <td>{t.complexityLabel}</td>
                <td>{t.estimatedEffortHours} hrs</td>
                <td>{t.weight}</td>
                <td>{t.statusLabel}</td>
                <td>{t.dueDate?.slice(0, 10)}</td>
                <td>{t.isAcknowledged ? "✓" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Count */}
      {tasks !== null && (
        <p className="tasks-page__count">
          Showing {filtered.length} of {tasks.length} tasks
        </p>
      )}
    </div>
  );
}
