function initials(name) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

export default function Sidebar({ user, activeTab, onNav, onLogout }) {
  const isAdmin = user.role === "admin";
  const nav = isAdmin
    ? [
        ["overview", "Overview"],
        ["employees", "Employees"],
        ["training", "Training Modules"],
        ["phishing", "Phishing Simulations"],
      ]
    : [["dashboard", "My Training"]];

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="mark">EC</div>
        <div className="name">CyberAware</div>
      </div>
      <div className="sb-nav">
        {nav.map(([key, label]) => (
          <button key={key} className={activeTab === key ? "active" : ""} onClick={() => onNav(key)}>
            {label}
          </button>
        ))}
      </div>
      <div className="sb-user">
        <div className={`avatar sm ${isAdmin ? "admin" : ""}`}>{initials(user.full_name)}</div>
        <div className="info">
          <div className="n">{user.full_name}</div>
          <div className="r">{user.role}</div>
        </div>
        <button onClick={onLogout}>Switch</button>
      </div>
    </div>
  );
}
