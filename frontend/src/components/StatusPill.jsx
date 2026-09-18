const MAP = {
  assigned: ["amber", "Assigned"],
  in_progress: ["blue", "In Progress"],
  completed: ["green", "Completed"],
  sent: ["gray", "Sent"],
  clicked: ["red", "Clicked"],
  reported: ["green", "Reported"],
  no_action: ["gray", "No Action"],
};

export default function StatusPill({ status }) {
  const [cls, label] = MAP[status] || ["gray", status];
  return <span className={`pill ${cls}`}>{label}</span>;
}
