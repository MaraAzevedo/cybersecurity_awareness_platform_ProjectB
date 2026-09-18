import { useState, useCallback } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import EmployeeArea from "./components/EmployeeArea";
import AdminOverview from "./components/AdminOverview";
import AdminEmployees from "./components/AdminEmployees";
import AdminTraining from "./components/AdminTraining";
import AdminPhishing from "./components/AdminPhishing";

export default function App() {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [adminTab, setAdminTab] = useState("overview");
  const [toastMsg, setToastMsg] = useState("");

  const toast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 2200);
  }, []);

  function handleLogin(tok, u) {
    setToken(tok);
    setUser(u);
    setAdminTab("overview");
  }

  function handleLogout() {
    setToken(null);
    setUser(null);
  }

  return (
    <>
      <div className="demo-banner">
        REAL BACKEND — Node.js/Express + SQLite (dev). Data persists in the database, not just in the browser.
      </div>
      {!token || !user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <div id="app-shell">
          <Sidebar
            user={user}
            activeTab={user.role === "admin" ? adminTab : "dashboard"}
            onNav={setAdminTab}
            onLogout={handleLogout}
          />
          <main>
            {user.role === "admin" ? (
              <>
                {adminTab === "overview" && <AdminOverview token={token} />}
                {adminTab === "employees" && <AdminEmployees token={token} toast={toast} />}
                {adminTab === "training" && <AdminTraining token={token} toast={toast} />}
                {adminTab === "phishing" && <AdminPhishing token={token} toast={toast} />}
              </>
            ) : (
              <EmployeeArea token={token} user={user} />
            )}
          </main>
        </div>
      )}
      {toastMsg && <div className="toast">{toastMsg}</div>}
    </>
  );
}
