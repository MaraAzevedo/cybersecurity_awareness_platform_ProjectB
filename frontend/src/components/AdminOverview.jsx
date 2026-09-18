import { useEffect, useState } from "react";
import { api } from "../api";
import StatusPill from "./StatusPill";

export default function AdminOverview({ token }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [modulesById, setModulesById] = useState({});
  const [usersById, setUsersById] = useState({});

  useEffect(() => {
    (async () => {
      const [dashboard, users, modules, allAssignments] = await Promise.all([
        api.getDashboard(token),
        api.getUsers(token),
        api.getModules(token),
        api.getAllAssignments(token),
      ]);
      setStats(dashboard);
      setUsersById(Object.fromEntries(users.map((u) => [u.user_id, u])));
      setModulesById(Object.fromEntries(modules.map((m) => [m.module_id, m])));
      setRecent(allAssignments.slice().reverse());
    })();
  }, []);

  if (!stats) return <div className="empty">Loading overview…</div>;

  return (
    <>
      <div className="page-header">
        <h1>Overview</h1>
        <p>Organization-wide training and phishing simulation summary.</p>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Training Completion</div><div className="value primary">{stats.completion_rate}%</div></div>
        <div className="stat-card"><div className="label">Average Quiz Score</div><div className="value green">{stats.average_quiz_score}%</div></div>
        <div className="stat-card"><div className="label">Phishing Click Rate</div><div className="value red">{stats.phishing_click_rate}%</div></div>
        <div className="stat-card"><div className="label">Employees</div><div className="value">{Object.values(usersById).filter((u) => u.role === "employee").length}</div></div>
      </div>
      <div className="card">
        <h2>Recent assignment activity</h2>
        <table>
          <thead><tr><th>Employee</th><th>Module</th><th>Status</th><th>Score</th></tr></thead>
          <tbody>
            {recent.map((a) => (
              <tr key={a.assignment_id}>
                <td>{usersById[a.user_id]?.full_name}</td>
                <td>{modulesById[a.module_id]?.title}</td>
                <td><StatusPill status={a.status} /></td>
                <td>—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
