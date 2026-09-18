import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminEmployees({ token, toast }) {
  const [users, setUsers] = useState([]);
  const [assignmentsByUser, setAssignmentsByUser] = useState({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function refresh() {
    const list = await api.getUsers(token);
    setUsers(list);
    const employees = list.filter((u) => u.role === "employee");
    // Fetch per-employee assignments via the same endpoint an admin can query for any user.
    const results = {};
    for (const u of employees) {
      const res = await fetch(`/api/assignments?user_id=${u.user_id}`, { headers: { Authorization: `Bearer ${token}` } });
      results[u.user_id] = res.ok ? await res.json() : [];
    }
    setAssignmentsByUser(results);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addEmployee(e) {
    e.preventDefault();
    if (!name || !email || !password) {
      toast("Enter a name, email, and password first");
      return;
    }
    try {
      await api.addUser(token, { full_name: name, email, password, role: "employee" });
      toast(`${name} added`);
      setName(""); setEmail(""); setPassword("");
      refresh();
    } catch (err) {
      toast(err.message);
    }
  }

  const employees = users.filter((u) => u.role === "employee");

  return (
    <>
      <div className="page-header">
        <h1>Employees</h1>
        <p>Manage employee accounts (FR-01).</p>
      </div>
      <div className="card">
        <h2>Add employee</h2>
        <form onSubmit={addEmployee} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-row" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label>Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Taylor Nguyen" />
          </div>
          <div className="form-row" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="taylor.nguyen@acme.test" />
          </div>
          <div className="form-row" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
            <label>Temporary password</label>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password123!" />
          </div>
          <button className="btn btn-primary" type="submit">Add</button>
        </form>
      </div>
      <div className="card">
        <h2>All employees</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Assigned</th><th>Completed</th></tr></thead>
          <tbody>
            {employees.map((u) => {
              const list = assignmentsByUser[u.user_id] || [];
              const done = list.filter((a) => a.status === "completed").length;
              return (
                <tr key={u.user_id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{list.length}</td>
                  <td>{done}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
