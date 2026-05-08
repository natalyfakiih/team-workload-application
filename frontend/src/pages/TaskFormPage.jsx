import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTaskById, createTask, updateTask } from "../api/tasksApi";
import TaskForm from "../components/tasks/TaskForm";
import "../styling/TaskFormPage.css";

export default function TaskFormPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(taskId);

  const [initial, setInitial] = useState({});
  const [loadingTask, setLoadingTask] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isEdit) return;

    const fetchTask = async () => {
      setLoadingTask(true);
      try {
        const { data } = await getTaskById(taskId);
        setInitial({
          ...data,
          startDate: data.startDate?.slice(0, 10),
          dueDate: data.dueDate?.slice(0, 10),
        });
      } catch {
        setError("Failed to load task.");
      } finally {
        setLoadingTask(false);
      }
    };

    fetchTask();
  }, [taskId, isEdit]);

  const handleSubmit = async (data) => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateTask(taskId, data);
        navigate(`/tasks/${taskId}`);
      } else {
        const { data: created } = await createTask(data);
        navigate(`/tasks/${created.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save task.");
      setSaving(false);
    }
  };

  if (loadingTask) return <p className="task-form-page__loading">Loading…</p>;

  return (
    <div className="task-form-page">
      <div className="task-form-page__container">
        <div className="task-form-page__header">
          <button className="task-form-page__back" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        <h2 className="task-form-page__title">
          {isEdit ? "Edit Task" : "Create Task"}
        </h2>

        {error && <p className="task-form-page__error">{error}</p>}

        {isEdit && (
          <p className="task-form-page__note">
            Note: changing owner, due date, or increasing effort requires an
            approved Change Request first.
          </p>
        )}

        <TaskForm initial={initial} onSubmit={handleSubmit} loading={saving} />
      </div>
    </div>
  );
}
