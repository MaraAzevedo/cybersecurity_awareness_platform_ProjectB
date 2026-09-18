require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const moduleRoutes = require("./routes/modules");
const assignmentRoutes = require("./routes/assignments");
const quizRoutes = require("./routes/quiz");
const phishingRoutes = require("./routes/phishing");
const reportRoutes = require("./routes/reports");

const app = express();
app.use(cors());
app.use(express.json());

// Simple request log — useful for demoing/debugging locally
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quiz-results", quizRoutes);
app.use("/api/phishing-campaigns", phishingRoutes);
app.use("/api/phishing-events", phishingRoutes.publicRouter); // unauthenticated click-tracking (Section 3.7.D)
app.use("/api/reports", reportRoutes);

// Central error handler — avoids leaking stack traces to the client
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`CyberAware API listening on http://localhost:${PORT}`);
});
