import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getMyTasks } from "../api/tasksApi";
import "../styling/MyTasksPage.css";

function statusClass(label) {
  return `my-tasks__badge my-tasks__badge--${label?.toLowerCase().replace(/\s/g, "") ?? ""}`;
}

function priorityClass(label) {
  return `my-tasks__badge my-tasks__badge--${label?.toLowerCase() ?? ""}`;
}

export default function MyTasksPage() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMyTasks = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getMyTasks();
        setTasks(data);
      } catch (err) {
        setError(err.response?.data?.message ?? "Failed to load your tasks.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();
  }, []);

  return (
    <div className="my-tasks">
      <div className="my-tasks__header">
        <h2 className="my-tasks__title">My Tasks</h2>
      </div>

      {loading && <p className="my-tasks__loading">Loading…</p>}
      {error && <p className="my-tasks__error">{error}</p>}
      {!loading && tasks.length === 0 && (
        <p className="my-tasks__empty">No tasks assigned to you.</p>
      )}

      {tasks.length > 0 && (
        <div className="my-tasks__card">
          <table className="my-tasks__table">
            <thead>
              <tr>
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
                <tr key={t.id} onClick={() => navigate(`/tasks/${t.id}`)}>
                  <td>{t.title}</td>
                  <td>
                    <span className={priorityClass(t.priorityLabel)}>
                      {t.priorityLabel}
                    </span>
                  </td>
                  <td>{t.complexityLabel}</td>
                  <td>{t.estimatedEffortHours} hrs</td>
                  <td>{t.weight}</td>
                  <td>
                    <span className={statusClass(t.statusLabel)}>
                      {t.statusLabel}
                    </span>
                  </td>
                  <td>{t.dueDate?.slice(0, 10)}</td>
                  <td>
                    {t.isAcknowledged ? (
                      <span className="my-tasks__ack--yes">✓</span>
                    ) : (
                      <span className="my-tasks__ack--no">—</span>
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
