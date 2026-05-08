import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getWorkloadSummary } from "../api/workloadApi";
import { getMemberWorkload } from "../api/workloadApi";
import { getMyTasks } from "../api/tasksApi";
import { AuthContext } from "../context/AuthContext";

const WEIGHT_CAP = 40;

const STATUS_COLOR = {
  Available: { bg: "#d1fae5", text: "#065f46", bar: "#10b981" },
  Moderate: { bg: "#fef3c7", text: "#92400e", bar: "#f59e0b" },
  Overloaded: { bg: "#fee2e2", text: "#991b1b", bar: "#ef4444" },
};

const PRIORITY_COLOR = {
  Low: "#10b981",
  Medium: "#f59e0b",
  High: "#f97316",
  Critical: "#ef4444",
};

const TASK_STATUS_COLOR = {
  New: "#3b82f6",
  InProgress: "#8b5cf6",
  Blocked: "#ef4444",
  Done: "#10b981",
  OnHold: "#94a3b8",
  Cancelled: "#94a3b8",
  Pending: "#f59e0b",
};

function Avatar({ name, size = 36 }) {
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
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue}, 55%, 52%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.35,
        fontWeight: 700,
        color: "#fff",
        flexShrink: 0,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {initials}
    </div>
  );
}

function WeightBar({ weight, cap = WEIGHT_CAP, color = "#3b82f6" }) {
  const pct = Math.min((weight / cap) * 100, 100);
  return (
    <div
      style={{
        height: 4,
        background: "#e2e8f0",
        borderRadius: 2,
        overflow: "hidden",
        marginTop: 6,
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: color,
          borderRadius: 2,
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────
function MemberCard({ member, onClick, selected }) {
  const sc = STATUS_COLOR[member.workloadStatus] ?? STATUS_COLOR.Available;
  return (
    <div
      onClick={onClick}
      style={{
        background: selected ? "#1e293b" : "#fff",
        border: `2px solid ${selected ? "#3b82f6" : "#e2e8f0"}`,
        borderRadius: 14,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "all 0.15s",
        minWidth: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 10,
        }}
      >
        <Avatar name={member.fullName} />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: selected ? "#fff" : "#1e293b",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {member.fullName}
          </div>
          <div
            style={{ fontSize: 11, color: selected ? "#94a3b8" : "#64748b" }}
          >
            {member.totalTasks} tasks · {member.totalEffortHours}h
          </div>
        </div>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 20,
            background: sc.bg,
            color: sc.text,
            whiteSpace: "nowrap",
          }}
        >
          {member.workloadStatus}
        </span>
      </div>
      <div
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: selected ? "#fff" : "#1e293b",
        }}
      >
        {member.totalWeight.toFixed(1)}
      </div>
      <WeightBar weight={member.totalWeight} color={sc.bar} />
    </div>
  );
}

// ── Slide-out panel ───────────────────────────────────────────────────────────
function MemberPanel({ member, detail, onClose, navigate }) {
  const sc = STATUS_COLOR[member.workloadStatus] ?? STATUS_COLOR.Available;
  const tasks = detail?.tasks ?? [];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: 420,
        background: "#fff",
        boxShadow: "-8px 0 40px rgba(0,0,0,0.12)",
        zIndex: 100,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Avatar name={member.fullName} size={44} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#1e293b" }}>
              {member.fullName}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 3,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: sc.bg,
                  color: sc.text,
                }}
              >
                {member.workloadStatus}
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {member.totalTasks} tasks · {member.totalEffortHours}h effort
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 20,
              color: "#94a3b8",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Weight bar */}
        <div style={{ marginTop: 16 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 4,
            }}
          >
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
              Total weight
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              of {WEIGHT_CAP} cap
            </span>
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "#1e293b",
              lineHeight: 1,
            }}
          >
            {member.totalWeight.toFixed(1)}
          </div>
          <WeightBar weight={member.totalWeight} color={sc.bar} />
        </div>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#94a3b8",
            letterSpacing: 1,
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Assigned Tasks
        </div>
        {tasks.length === 0 && (
          <p style={{ color: "#94a3b8", fontSize: 13 }}>
            No tasks in this period.
          </p>
        )}
        {tasks.map((t) => (
          <div
            key={t.id}
            onClick={() => navigate(`/tasks/${t.id}`)}
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              border: "1px solid #f1f5f9",
              marginBottom: 8,
              cursor: "pointer",
              transition: "border-color 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.borderColor = "#cbd5e1")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.borderColor = "#f1f5f9")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontWeight: 600,
                  fontSize: 13,
                  color: "#1e293b",
                  flex: 1,
                  marginRight: 8,
                }}
              >
                {t.title}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: TASK_STATUS_COLOR[t.statusLabel] ?? "#64748b",
                  whiteSpace: "nowrap",
                }}
              >
                {t.statusLabel}
              </span>
            </div>
            {t.description && (
              <div
                style={{
                  fontSize: 11,
                  color: "#94a3b8",
                  marginBottom: 6,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t.description}
              </div>
            )}
            <div
              style={{
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: PRIORITY_COLOR[t.priorityLabel] ?? "#64748b",
                  background: "#f8fafc",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {t.priorityLabel}
              </span>
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  background: "#f8fafc",
                  padding: "2px 6px",
                  borderRadius: 4,
                }}
              >
                {t.complexityLabel} complexity
              </span>
              <span style={{ fontSize: 10, color: "#64748b" }}>
                {t.estimatedEffortHours}h
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#1e293b",
                }}
              >
                w {t.weight}
              </span>
            </div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>
              Due {t.dueDate?.slice(0, 10)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isLeader = user?.role === "TeamLeader" || user?.role === "Admin";
  const isMember = user?.role === "Member";

  const [mode, setMode] = useState("current");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tick, setTick] = useState(0);

  const [state, setState] = useState({ summary: null, error: null });
  const [myTasks, setMyTasks] = useState({ tasks: null, error: null });

  const [selected, setSelected] = useState(null); // memberId
  const [detail, setDetail] = useState(null); // MemberWorkloadDto with tasks
  const [detailLoading, setDetailLoading] = useState(false);

  // Leader fetch
  useEffect(() => {
    if (!isLeader) return;
    if (mode === "custom" && (!from || !to)) return;
    let cancelled = false;
    const params = mode === "custom" ? { from, to } : { week: mode };
    getWorkloadSummary(params)
      .then(({ data }) => {
        if (!cancelled) setState({ summary: data, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setState({
            summary: null,
            error: err.response?.data?.message ?? "Failed to load workload.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [mode, from, to, isLeader, tick]);

  // Member fetch
  useEffect(() => {
    if (!isMember) return;
    let cancelled = false;
    getMyTasks()
      .then(({ data }) => {
        if (!cancelled) setMyTasks({ tasks: data, error: null });
      })
      .catch((err) => {
        if (!cancelled)
          setMyTasks({
            tasks: [],
            error: err.response?.data?.message ?? "Failed to load tasks.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [isMember, tick]);

  // Load member detail when card clicked
  const handleMemberClick = (member) => {
    if (selected === member.memberId) {
      setSelected(null);
      setDetail(null);
      return;
    }
    setSelected(member.memberId);
    setDetail(null);
    setDetailLoading(true);
    const params = mode === "custom" ? { from, to } : { week: mode };
    getMemberWorkload(member.memberId, params)
      .then(({ data }) => {
        setDetail(data);
        setDetailLoading(false);
      })
      .catch(() => setDetailLoading(false));
  };

  const { summary, error } = state;
  const selectedMember = summary?.members?.find((m) => m.memberId === selected);

  // ── Member view ──────────────────────────────────────────────────────────────
  if (isMember) {
    const { tasks, error: taskErr } = myTasks;
    return (
      <div style={{ fontFamily: "'Outfit', sans-serif", padding: 24 }}>
        <h2
          style={{
            fontWeight: 800,
            fontSize: 20,
            color: "#1e293b",
            marginBottom: 20,
          }}
        >
          My Tasks
        </h2>
        {taskErr && <p style={{ color: "red" }}>{taskErr}</p>}
        {tasks === null && <p style={{ color: "#94a3b8" }}>Loading…</p>}
        {tasks?.length === 0 && (
          <p style={{ color: "#94a3b8" }}>No tasks assigned to you.</p>
        )}
        {tasks?.length > 0 && (
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: "collapse", width: "100%" }}
          >
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th>Title</th>
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
              {tasks.map((t) => (
                <tr
                  key={t.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => navigate(`/tasks/${t.id}`)}
                >
                  <td>{t.title}</td>
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
      </div>
    );
  }

  // ── Leader / Admin view ───────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Outfit', sans-serif", padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 24,
              color: "#1e293b",
            }}
          >
            Team Workload
          </h2>
          {summary && (
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>
              {summary.periodFrom?.slice(0, 10)} →{" "}
              {summary.periodTo?.slice(0, 10)} · {summary.totalMembers} members
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={() => setTick((t) => t + 1)}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#fff",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            ↺
          </button>
          <button
            onClick={() => navigate("/tasks/new")}
            style={{
              padding: "7px 16px",
              borderRadius: 8,
              border: "none",
              background: "#ff9b31",
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            + Create Task
          </button>
        </div>
      </div>

      {/* Week selector */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 24,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {["current", "next", "custom"].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: "6px 14px",
              borderRadius: 20,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              background: mode === m ? "#ff9b31" : "#fff",
              color: mode === m ? "#fff" : "#64748b",
              boxShadow: mode === m ? "none" : "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            {m === "current"
              ? "Current Week"
              : m === "next"
                ? "Next Week"
                : "Custom Range"}
          </button>
        ))}
        {mode === "custom" && (
          <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
            <span style={{ color: "#94a3b8" }}>→</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              style={{
                padding: "5px 8px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                fontSize: 12,
              }}
            />
          </span>
        )}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {!summary && !error && <p style={{ color: "#94a3b8" }}>Loading…</p>}

      {summary && (
        <>
          {/* Stats row */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 16,
              marginBottom: 28,
            }}
          >
            {[
              {
                label: "Total weight",
                value: summary.totalWeight.toFixed(1),
                sub: `across ${summary.totalMembers} members · avg ${(summary.totalWeight / (summary.totalMembers || 1)).toFixed(1)}`,
              },
              {
                label: "Total effort",
                value: `${summary.totalEffortHours}h`,
                sub: `${summary.totalTasks} tasks in this week's window`,
              },
              {
                label: "Active tasks",
                value: summary.totalTasks,
                sub: `in this week's window`,
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#fff",
                  borderRadius: 14,
                  padding: "18px 20px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{ fontSize: 28, fontWeight: 800, color: "#1e293b" }}
                >
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Status legend */}
          <div
            style={{
              display: "flex",
              gap: 16,
              marginBottom: 20,
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#64748b" }}>
              Workload distribution
            </span>
            <span style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
              {[
                ["Available", "#10b981"],
                ["Moderate", "#f59e0b"],
                ["Overloaded", "#ef4444"],
              ].map(([l, c]) => (
                <span
                  key={l}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 11,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: c,
                      display: "inline-block",
                    }}
                  />
                  {l}
                </span>
              ))}
            </span>
          </div>

          {/* Member cards grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {summary.members.map((m) => (
              <MemberCard
                key={m.memberId}
                member={m}
                selected={selected === m.memberId}
                onClick={() => handleMemberClick(m)}
              />
            ))}
          </div>
        </>
      )}

      {/* Slide-out panel */}
      {selected && selectedMember && (
        <>
          <div
            onClick={() => {
              setSelected(null);
              setDetail(null);
            }}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.2)",
              zIndex: 99,
            }}
          />
          <MemberPanel
            member={selectedMember}
            detail={detailLoading ? null : detail}
            onClose={() => {
              setSelected(null);
              setDetail(null);
            }}
            navigate={navigate}
          />
        </>
      )}
    </div>
  );
}
