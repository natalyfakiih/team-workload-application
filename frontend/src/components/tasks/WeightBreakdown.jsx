// effort × complexity × priority table
export default function WeightBreakdown({ task }) {
  if (!task) return null;
  return (
    <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
          <th>Multiplier</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Effort Hours</td>
          <td>{task.estimatedEffortHours} hrs</td>
          <td>× 1</td>
        </tr>
        <tr>
          <td>Complexity ({task.complexityLabel})</td>
          <td>—</td>
          <td>× {task.complexityMultiplier}</td>
        </tr>
        <tr>
          <td>Priority ({task.priorityLabel})</td>
          <td>—</td>
          <td>× {task.priorityMultiplier}</td>
        </tr>
        <tr>
          <td>
            <strong>Total Weight</strong>
          </td>
          <td colSpan="2">
            <strong>{task.weight}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
