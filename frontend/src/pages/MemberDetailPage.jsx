import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { getMemberWorkload } from "../api/workloadApi";

export default function MemberDetailPage() {
  const { memberId } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const week = search.get("week");
  const from = search.get("from");
  const to = search.get("to");

  // Build params: prefer from/to if present, else week, else default to current
  const params = from && to ? { from, to } : { week: week ?? "current" };

  const [workload, setWorkload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getMemberWorkload(memberId, params);
        setWorkload(data);
      } catch (err) {
        setError(
          err.response?.data?.message ?? "Failed to load member workload.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [memberId, week, from, to]);

  return (
    <div>
      <button onClick={() => navigate(-1)}>← Back</button>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {workload && (
        <>
          <h2>{workload.fullName}</h2>
          <p>
            Team: <strong>{workload.teamName ?? "—"}</strong> &nbsp;|&nbsp;
            Period:{" "}
            <strong>
              {workload.periodFrom?.slice(0, 10)} →{" "}
              {workload.periodTo?.slice(0, 10)}
            </strong>
          </p>
          <p>
            Tasks: <strong>{workload.totalTasks}</strong> &nbsp;|&nbsp; Effort:{" "}
            <strong>{workload.totalEffortHours} hrs</strong> &nbsp;|&nbsp;
            Weight: <strong>{workload.totalWeight}</strong> &nbsp;|&nbsp;
            Status: <strong>{workload.workloadStatus}</strong>
          </p>

          <h3>Tasks</h3>
          {workload.tasks.length === 0 ? (
            <p>No tasks in this period.</p>
          ) : (
            <table
              border="1"
              cellPadding="6"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Priority</th>
                  <th>Complexity</th>
                  <th>Effort</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <th>Acknowledged</th>
                </tr>
              </thead>
              <tbody>
                {workload.tasks.map((t) => (
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
                    <td>{t.isAcknowledged ? "✓" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </>
      )}
    </div>
  );
}
