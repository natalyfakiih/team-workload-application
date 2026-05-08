import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { getTasks, getMyTasks } from "../api/tasksApi";
import { getWorkloadSummary } from "../api/workloadApi";
import "../styling/CalendarPage.css";

const isoDate = (d) => d.toISOString().slice(0, 10);
function startOfMonth(y, m) {
  return new Date(y, m, 1);
}
function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}
function firstDayOfWeek(y, m) {
  const d = new Date(y, m, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const TODAY = isoDate(new Date());

const PRIORITY_COLOR = {
  1: "#22c55e",
  2: "#eab308",
  3: "#f97316",
  4: "#ef4444",
};
const STATUS_BG = {
  0: "#dbeafe",
  1: "#fef9c3",
  2: "#fee2e2",
  3: "#dcfce7",
  4: "#f3f4f6",
  5: "#f3f4f6",
};
const WORKLOAD_COLOR = {
  Available: "#22c55e",
  Moderate: "#eab308",
  Overloaded: "#ef4444",
};

export default function CalendarPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isLeader = user?.role === "TeamLeader" || user?.role === "Admin";
  const isMember = user?.role === "Member";

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);

  const [taskState, setTaskState] = useState({ tasks: [], error: null });
  const [workload, setWorkload] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (isMember ? getMyTasks() : getTasks())
      .then(({ data }) => {
        if (!cancelled) setTaskState({ tasks: data, error: null });
      })
      .catch(() => {
        if (!cancelled)
          setTaskState({ tasks: [], error: "Failed to load tasks." });
      });
    return () => {
      cancelled = true;
    };
  }, [isMember]);

  useEffect(() => {
    if (!isLeader) return;
    let cancelled = false;
    const from = isoDate(startOfMonth(year, month));
    const to = isoDate(new Date(year, month, daysInMonth(year, month)));
    getWorkloadSummary({ from, to })
      .then(({ data }) => {
        if (!cancelled) setWorkload(data);
      })
      .catch(() => {
        if (!cancelled) setWorkload(null);
      });
    return () => {
      cancelled = true;
    };
  }, [isLeader, year, month]);

  const { tasks, error } = taskState;

  const days = daysInMonth(year, month);
  const offset = firstDayOfWeek(year, month);
  const cells = Array.from({ length: offset + days }, (_, i) =>
    i < offset ? null : i - offset + 1,
  );

  const tasksByDate = {};
  tasks.forEach((t) => {
    const s = t.startDate?.slice(0, 10);
    const e = t.dueDate?.slice(0, 10);
    if (s) {
      tasksByDate[s] = tasksByDate[s] || [];
      tasksByDate[s].push({ ...t, _mark: "start" });
    }
    if (e && e !== s) {
      tasksByDate[e] = tasksByDate[e] || [];
      tasksByDate[e].push({ ...t, _mark: "due" });
    }
  });

  const cellDate = (d) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const selectedTasks = selected ? tasksByDate[selected] || [] : [];

  const prevMonth = () => {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else setMonth((m) => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else setMonth((m) => m + 1);
    setSelected(null);
  };

  return (
    <div className="cal-page">
      {/* Header */}
      <div className="cal-page__header">
        <button className="cal-page__nav-btn" onClick={prevMonth}>
          ‹
        </button>
        <span className="cal-page__month-title">
          {MONTHS[month]} {year}
        </span>
        <button className="cal-page__nav-btn" onClick={nextMonth}>
          ›
        </button>
      </div>

      {error && <p className="cal-page__error">{error}</p>}

      {/* Grid */}
      <div className="cal-page__grid">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="cal-page__day-label">
            {d}
          </div>
        ))}

        {cells.map((d, i) => {
          if (!d) return <div key={`e-${i}`} />;
          const dateStr = cellDate(d);
          const isToday = dateStr === TODAY;
          const isSel = dateStr === selected;
          const dayTasks = tasksByDate[dateStr] || [];

          let cellClass = "cal-page__cell";
          if (isSel) cellClass += " cal-page__cell--selected";
          else if (isToday) cellClass += " cal-page__cell--today";

          return (
            <div
              key={dateStr}
              className={cellClass}
              onClick={() => setSelected(isSel ? null : dateStr)}
            >
              <div
                className={`cal-page__day-num${isSel ? " cal-page__day-num--selected" : ""}`}
              >
                {d}
              </div>
              {dayTasks.slice(0, 3).map((t, ti) => (
                <span
                  key={ti}
                  className="cal-page__tag"
                  style={{ background: STATUS_BG[t.status] ?? "#f3f4f6" }}
                >
                  {t._mark === "start" ? "▶ " : "⏹ "}
                  {t.title}
                </span>
              ))}
              {dayTasks.length > 3 && (
                <span className="cal-page__cell-overflow">
                  +{dayTasks.length - 3} more
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selected && (
        <div className="cal-page__panel">
          <div className="cal-page__panel-header">
            <h3 className="cal-page__panel-title">
              {selected} —{" "}
              {selectedTasks.length === 0
                ? "No tasks"
                : `${selectedTasks.length} task(s)`}
            </h3>
          </div>
          <div className="cal-page__panel-body">
            {selectedTasks.length === 0 ? (
              <p className="cal-page__panel-empty">No tasks on this day.</p>
            ) : (
              selectedTasks.map((t) => (
                <div
                  key={`${t.id}-${t._mark}`}
                  className="cal-page__task-row"
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <span
                    className="cal-page__task-dot"
                    style={{
                      background: PRIORITY_COLOR[t.priority] ?? "#94a3b8",
                    }}
                  />
                  <span className="cal-page__task-title">{t.title}</span>
                  <span className="cal-page__task-mark">
                    {t._mark === "start" ? "▶ Starts" : "⏹ Due"}
                  </span>
                  <span className="cal-page__task-meta">{t.statusLabel}</span>
                  {isLeader && (
                    <span className="cal-page__task-meta">
                      {t.assignedToName}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Workload section */}
      {isLeader && workload && (
        <div className="cal-page__workload">
          <div className="cal-page__workload-header">
            <h3 className="cal-page__workload-title">
              Member Workload — {MONTHS[month]} {year}
            </h3>
          </div>
          <div className="cal-page__workload-body">
            {workload.members.map((m) => (
              <div
                key={m.memberId}
                className="cal-page__member-row"
                onClick={() =>
                  navigate(
                    `/members/${m.memberId}?from=${isoDate(startOfMonth(year, month))}&to=${isoDate(new Date(year, month, daysInMonth(year, month)))}`,
                  )
                }
              >
                <span
                  className="cal-page__member-dot"
                  style={{
                    background: WORKLOAD_COLOR[m.workloadStatus] ?? "#94a3b8",
                  }}
                />
                <span className="cal-page__member-name">{m.fullName}</span>
                <span className="cal-page__member-stat">
                  {m.totalTasks} tasks
                </span>
                <span className="cal-page__member-stat">
                  {m.totalEffortHours} hrs
                </span>
                <span className="cal-page__member-stat">
                  Weight: {m.totalWeight}
                </span>
                <span
                  className="cal-page__member-status"
                  style={{
                    color: WORKLOAD_COLOR[m.workloadStatus] ?? "#94a3b8",
                  }}
                >
                  {m.workloadStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
