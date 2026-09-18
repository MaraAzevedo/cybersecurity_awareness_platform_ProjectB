const BASE = "/api";

async function request(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (email, password) => request("/auth/login", { method: "POST", body: { email, password } }),

  getMyAssignments: (token) => request("/assignments?user_id=me", { token }),
  getModule: (token, id) => request(`/modules/${id}`, { token }),
  getQuiz: (token, moduleId) => request(`/modules/${moduleId}/quiz`, { token }),
  submitQuiz: (token, module_id, answers) =>
    request("/quiz-results", { method: "POST", token, body: { module_id, answers } }),

  // Admin
  getUsers: (token) => request("/users", { token }),
  addUser: (token, user) => request("/users", { method: "POST", token, body: user }),
  getModules: (token) => request("/modules", { token }),
  assignModule: (token, user_id, module_id) =>
    request("/assignments", { method: "POST", token, body: { user_id, module_id } }),
  getDashboard: (token) => request("/reports/dashboard", { token }),
  getCampaigns: (token) => request("/phishing-campaigns", { token }),
  getCampaignEvents: (token, id) => request(`/phishing-campaigns/${id}/events`, { token }),
  launchCampaign: (token, payload) =>
    request("/phishing-campaigns", { method: "POST", token, body: payload }),
  getAllAssignments: async (token) => {
    // Convenience: admin overview needs every assignment across all users.
    const users = await request("/users", { token });
    const employees = users.filter((u) => u.role === "employee");
    const all = await Promise.all(employees.map((u) => request(`/assignments?user_id=${u.user_id}`, { token })));
    return all.flat();
  },
};
