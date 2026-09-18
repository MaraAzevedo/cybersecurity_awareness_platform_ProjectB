import { useEffect, useState } from "react";
import { api } from "../api";
import StatusPill from "./StatusPill";

export default function AdminPhishing({ token, toast }) {
  const [employees, setEmployees] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignDetails, setCampaignDetails] = useState({});
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [targets, setTargets] = useState([]);

  async function refresh() {
    const [userList, campaignList] = await Promise.all([api.getUsers(token), api.getCampaigns(token)]);
    setEmployees(userList.filter((u) => u.role === "employee"));
    setCampaigns(campaignList);
    const details = {};
    for (const c of campaignList) {
      details[c.campaign_id] = await api.getCampaignEvents(token, c.campaign_id);
    }
    setCampaignDetails(details);
  }

  useEffect(() => {
    refresh();
  }, []);

  function toggleTarget(id) {
    setTargets((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));
  }

  async function launch(e) {
    e.preventDefault();
    if (!name || !subject || targets.length === 0) {
      toast("Fill in name, subject, and pick at least one target");
      return;
    }
    try {
      await api.launchCampaign(token, {
        name,
        template_subject: subject,
        template_body: "This is a simulated phishing test email.",
        target_user_ids: targets,
      });
      toast("Campaign launched (simulated — no real email sent)");
      setName(""); setSubject(""); setTargets([]);
      refresh();
    } catch (err) {
      toast(err.message);
    }
  }

  async function simulateClick(eventId) {
    await fetch(`/api/phishing-events/${eventId}/click`);
    toast("Simulated click recorded");
    refresh();
  }

  return (
    <>
      <div className="page-header">
        <h1>Phishing Simulations</h1>
        <p>Launch a simulated phishing test and track results (FR-05, FR-06).</p>
      </div>
      <div className="card">
        <h2>Launch new campaign</h2>
        <form onSubmit={launch}>
          <div className="form-row">
            <label>Campaign name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q4 Delivery Notice" />
          </div>
          <div className="form-row">
            <label>Email subject line</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Package delivery failed — reschedule now" />
          </div>
          <div className="form-row">
            <label>Target employees</label>
            {employees.map((u) => (
              <div className="checkbox-row" key={u.user_id}>
                <input
                  type="checkbox"
                  id={`target_${u.user_id}`}
                  checked={targets.includes(u.user_id)}
                  onChange={() => toggleTarget(u.user_id)}
                />
                <label htmlFor={`target_${u.user_id}`} style={{ margin: 0, textTransform: "none", fontWeight: 400 }}>{u.full_name}</label>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" type="submit">Launch Campaign</button>
        </form>
      </div>

      {campaigns.slice().reverse().map((c) => {
        const detail = campaignDetails[c.campaign_id];
        if (!detail) return null;
        const clicked = detail.events.filter((e) => e.status === "clicked").length;
        const reported = detail.events.filter((e) => e.status === "reported").length;
        return (
          <div className="card" key={c.campaign_id}>
            <h2>
              {c.name} <span className="pill gray" style={{ fontWeight: 500 }}>{c.launched_at?.slice(0, 10)}</span>
            </h2>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: -8 }}>Subject line: "{c.template_subject}"</p>
            <table>
              <thead><tr><th>Employee</th><th>Status</th><th>Demo action</th></tr></thead>
              <tbody>
                {detail.events.map((e) => (
                  <tr key={e.event_id}>
                    <td>{e.full_name}</td>
                    <td><StatusPill status={e.status} /></td>
                    <td>
                      {e.status === "sent" ? (
                        <button className="btn btn-ghost btn-sm" onClick={() => simulateClick(e.event_id)}>Simulate click</button>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 12, marginBottom: 0 }}>
              {clicked} clicked · {reported} reported · {detail.events.length} total
            </p>
          </div>
        );
      })}
    </>
  );
}
