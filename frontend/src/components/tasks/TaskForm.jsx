// shared create & edit form
import { useState, useEffect } from "react";
import { getUsers } from "../../api/usersApi";
import "../tasks/TaskForm.css";

const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const COMPLEXITIES = ["Simple", "Medium", "Complex"];

const PRIORITY_MAP = { Low: 1, Medium: 2, High: 3, Critical: 4 };
const COMPLEXITY_MAP = { Simple: 1, Medium: 2, Complex: 3 };

const empty = {
  title: "",
  description: "",
  assignedToId: "",
  priority: "Medium",
  complexity: "Medium",
  estimatedEffortHours: "",
  startDate: "",
  dueDate: "",
};

export default function TaskForm({ initial = {}, onSubmit, loading }) {
  const [form, setForm] = useState({ ...empty, ...initial });
  const [members, setMembers] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    getUsers()
      .then(({ data }) => setMembers(data.filter((u) => u.role === "Member")))
      .catch(() => setError("Could not load members."));
  }, []);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      priority: PRIORITY_MAP[form.priority],
      complexity: COMPLEXITY_MAP[form.complexity],
      estimatedEffortHours: parseFloat(form.estimatedEffortHours),
      startDate: new Date(form.startDate).toISOString(),
      dueDate: new Date(form.dueDate).toISOString(),
      assignedToId: form.assignedToId || null,
    });
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      {error && <p className="task-form__error">{error}</p>}

      <div className="task-form__field">
        <label className="task-form__label">Title *</label>
        <input
          className="task-form__input"
          value={form.title}
          onChange={set("title")}
          required
        />
      </div>

      <div className="task-form__field">
        <label className="task-form__label">Description</label>
        <textarea
          className="task-form__textarea"
          value={form.description}
          onChange={set("description")}
          rows={3}
        />
      </div>

      <div className="task-form__field">
        <label className="task-form__label">Assign To *</label>
        <select
          className="task-form__select"
          value={form.assignedToId}
          onChange={set("assignedToId")}
          required
        >
          <option value="">— select member —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.fullName} ({m.email})
            </option>
          ))}
        </select>
      </div>

      <div className="task-form__row">
        <div className="task-form__field">
          <label className="task-form__label">Priority *</label>
          <select
            className="task-form__select"
            value={form.priority}
            onChange={set("priority")}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="task-form__field">
          <label className="task-form__label">Complexity *</label>
          <select
            className="task-form__select"
            value={form.complexity}
            onChange={set("complexity")}
          >
            {COMPLEXITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="task-form__field">
        <label className="task-form__label">Estimated Effort (hours) *</label>
        <input
          className="task-form__input"
          type="number"
          min="0.5"
          step="0.5"
          value={form.estimatedEffortHours}
          onChange={set("estimatedEffortHours")}
          required
        />
      </div>

      <div className="task-form__row">
        <div className="task-form__field">
          <label className="task-form__label">Start Date *</label>
          <input
            className="task-form__input"
            type="date"
            value={form.startDate}
            onChange={set("startDate")}
            required
          />
        </div>

        <div className="task-form__field">
          <label className="task-form__label">Due Date *</label>
          <input
            className="task-form__input"
            type="date"
            value={form.dueDate}
            onChange={set("dueDate")}
            required
          />
        </div>
      </div>

      <button className="task-form__submit" type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save Task"}
      </button>
    </form>
  );
}
