// New / In Progress / Blocked / Done chip
// New / InProgress / Blocked / Done chip
const STATUS_COLORS = {
  New: { bg: "#e0f2fe", color: "#0369a1" },
  InProgress: { bg: "#fef9c3", color: "#854d0e" },
  Blocked: { bg: "#fee2e2", color: "#b91c1c" },
  Done: { bg: "#dcfce7", color: "#166534" },
};

export default function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] ?? { bg: "#f3f4f6", color: "#374151" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 12,
        fontSize: 12,
        fontWeight: 600,
        background: style.bg,
        color: style.color,
      }}
    >
      {status}
    </span>
  );
}
