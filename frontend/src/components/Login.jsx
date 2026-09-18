import { useState } from "react";
import { api } from "../api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.login(email, password);
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function quickFill(demoEmail) {
    setEmail(demoEmail);
    setPassword("Password123!");
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <div className="mark">EC</div>
          <div className="name">CyberAware</div>
        </div>
        <h1>Sign in to your account</h1>
        <p className="sub">Employee Cybersecurity Awareness Platform</p>

        {error && <div className="error-box">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.test" required />
          </div>
          <div className="form-row">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="demo-hint">
          Demo accounts (password: Password123!)<br />
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, marginRight: 6 }} onClick={() => quickFill("alex.morgan@acme.test")}>Admin</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8, marginRight: 6 }} onClick={() => quickFill("jordan.lee@acme.test")}>Employee: Jordan</button>
          <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => quickFill("sam.rivera@acme.test")}>Employee: Sam</button>
        </div>
      </div>
    </div>
  );
}
