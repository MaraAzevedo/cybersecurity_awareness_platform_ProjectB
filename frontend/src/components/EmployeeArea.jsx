import { useEffect, useState } from "react";
import { api } from "../api";
import StatusPill from "./StatusPill";

export default function EmployeeArea({ token, user }) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("dashboard"); // dashboard | module | quiz
  const [activeModuleId, setActiveModuleId] = useState(null);

  async function refresh() {
    setLoading(true);
    const data = await api.getMyAssignments(token);
    setAssignments(data);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading) return <div className="empty">Loading your training…</div>;

  if (view === "module") {
    return (
      <ModuleView
        token={token}
        assignment={assignments.find((a) => a.module_id === activeModuleId)}
        onBack={() => setView("dashboard")}
        onStartQuiz={() => setView("quiz")}
      />
    );
  }

  if (view === "quiz") {
    return (
      <QuizView
        token={token}
        moduleId={activeModuleId}
        assignment={assignments.find((a) => a.module_id === activeModuleId)}
        onDone={() => {
          refresh();
          setView("dashboard");
        }}
        onBackToModule={() => setView("module")}
      />
    );
  }

  const completedCount = assignments.filter((a) => a.status === "completed").length;

  return (
    <>
      <div className="page-header">
        <h1>My Training</h1>
        <p>Modules assigned to you — complete each one and its quiz to mark it done.</p>
      </div>
      <div className="stat-grid">
        <div className="stat-card"><div className="label">Assigned Modules</div><div className="value primary">{assignments.length}</div></div>
        <div className="stat-card"><div className="label">Completed</div><div className="value green">{completedCount}</div></div>
        <div className="stat-card"><div className="label">Remaining</div><div className="value" style={{ color: "var(--amber)" }}>{assignments.length - completedCount}</div></div>
      </div>
      <div className="module-grid">
        {assignments.length === 0 && <div className="empty">No training assigned yet.</div>}
        {assignments.map((a) => (
          <div className="module-card" key={a.assignment_id}>
            <div className="mtitle">{a.module_title}</div>
            <div className="mdesc">{a.module_description}</div>
            <div>
              <StatusPill status={a.status} />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => {
                setActiveModuleId(a.module_id);
                setView("module");
              }}
            >
              {a.status === "completed" ? "Review Module" : "Start Module"}
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function ModuleView({ token, assignment, onBack, onStartQuiz }) {
  const [module, setModule] = useState(null);

  useEffect(() => {
    api.getModule(token, assignment.module_id).then(setModule);
  }, [assignment.module_id]);

  if (!module) return <div className="empty">Loading module…</div>;

  return (
    <>
      <button className="back-link" onClick={onBack}>← Back to My Training</button>
      <div className="page-header"><h1>{module.title}</h1></div>
      <div className="card">
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>{module.content_url}</p>
      </div>
      {assignment.status === "completed" ? (
        <div className="card">
          <h2>Quiz result</h2>
          <p>You've already completed this module.</p>
          <button className="btn btn-ghost btn-sm" onClick={onStartQuiz}>Retake Quiz</button>
        </div>
      ) : (
        <div className="card">
          <h2>Ready for the quiz?</h2>
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginBottom: 14 }}>Answer a few short questions to complete this module.</p>
          <button className="btn btn-primary" onClick={onStartQuiz}>Start Quiz</button>
        </div>
      )}
    </>
  );
}

function QuizView({ token, moduleId, onDone, onBackToModule }) {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.getQuiz(token, moduleId).then(setQuestions);
  }, [moduleId]);

  async function submit() {
    const answerList = questions.map((q) => ({ question_id: q.question_id, selected_option: answers[q.question_id] }));
    const res = await api.submitQuiz(token, moduleId, answerList);
    setResult(res);
  }

  if (result) {
    const pass = result.score / result.total_questions >= 0.5;
    return (
      <>
        <button className="back-link" onClick={onDone}>← Back to My Training</button>
        <div className="page-header"><h1>Quiz Result</h1></div>
        <div className={`score-banner ${pass ? "pass" : "fail"}`}>
          <div className="big">{result.score} / {result.total_questions}</div>
          <div>{pass ? "Nice work — module completed." : "Module marked completed — consider reviewing the content again."}</div>
        </div>
        <button className="btn btn-primary" onClick={onDone}>Back to My Training</button>
      </>
    );
  }

  if (!questions.length) return <div className="empty">Loading quiz…</div>;

  const allAnswered = questions.every((q) => answers[q.question_id]);

  return (
    <>
      <button className="back-link" onClick={onBackToModule}>← Back to Module</button>
      <div className="page-header"><h1>Quiz</h1></div>
      <div className="card">
        {questions.map((q, qi) => (
          <div className="quiz-q" key={q.question_id}>
            <div className="qtext">{qi + 1}. {q.question_text}</div>
            {["a", "b", "c", "d"].map((opt) => (
              <label className="quiz-opt" key={opt}>
                <input
                  type="radio"
                  name={`q${q.question_id}`}
                  checked={answers[q.question_id] === opt}
                  onChange={() => setAnswers({ ...answers, [q.question_id]: opt })}
                />
                {q[`option_${opt}`]}
              </label>
            ))}
          </div>
        ))}
        <button className="btn btn-primary" onClick={submit} disabled={!allAnswered}>Submit Quiz</button>
      </div>
    </>
  );
}
