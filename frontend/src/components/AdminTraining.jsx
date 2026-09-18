import { useEffect, useState } from "react";
import { api } from "../api";

export default function AdminTraining({ token, toast }) {
  const [modules, setModules] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [selectedMod, setSelectedMod] = useState("");

  async function refresh() {
    const [modList, userList, allAssignments] = await Promise.all([
      api.getModules(token),
      api.getUsers(token),
      api.getAllAssignments(token),
    ]);
    setModules(modList);
    const emps = userList.filter((u) => u.role === "employee");
    setEmployees(emps);
    setAssignments(allAssignments);
    if (!selectedEmp && emps.length) setSelectedEmp(String(emps[0].user_id));
    if (!selectedMod && modList.length) setSelectedMod(String(modList[0].module_id));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function assign(e) {
    e.preventDefault();
    try {
      await api.assignModule(token, Number(selectedEmp), Number(selectedMod));
      toast("Module assigned");
      refresh();
    } catch (err) {
      toast(err.message);
    }
  }

  return (
    <>
      <div className="page-header">
        <h1>Training Modules</h1>
        <p>Assign modules to employees (FR-02).</p>
      </div>
      <div className="card">
        <h2>Assign a module</h2>
        <form onSubmit={assign} style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div className="form-row" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Employee</label>
            <select value={selectedEmp} onChange={(e) => setSelectedEmp(e.target.value)}>
              {employees.map((u) => (
                <option key={u.user_id} value={u.user_id}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div className="form-row" style={{ flex: 1, minWidth: 180, marginBottom: 0 }}>
            <label>Module</label>
            <select value={selectedMod} onChange={(e) => setSelectedMod(e.target.value)}>
              {modules.map((m) => (
                <option key={m.module_id} value={m.module_id}>{m.title}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Assign</button>
        </form>
      </div>
      <div className="module-grid">
        {modules.map((m) => {
          const forModule = assignments.filter((a) => a.module_id === m.module_id);
          const done = forModule.filter((a) => a.status === "completed").length;
          return (
            <div className="module-card" key={m.module_id}>
              <div className="mtitle">{m.title}</div>
              <div className="mdesc">{m.description}</div>
              <div className="pill gray">{forModule.length} assigned · {done} completed</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
