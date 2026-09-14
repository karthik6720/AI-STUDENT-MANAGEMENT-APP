import { useState, useEffect } from "react";
import {
  Flame,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Target,
  Check,
  ArrowUp,
  ArrowDown,
  Home,
  BookOpen,
  BarChart3,
  User,
  Clock,
  MessageCircle,
  FileText,
  Send,
  Bot,
  Calendar,
  ListChecks,
  Users,
  AlertTriangle,
  GraduationCap,
  Bell,
  Briefcase,
  Award,
  Building2,
  Lock,
  Mail,
  LogOut,
  Upload,
  FileCheck2,
  Loader2,
  ArrowRight,
} from "lucide-react";

const colors = {
  paper: "#F4F5EF",
  ink: "#1E2A25",
  inkSoft: "#5B6660",
  card: "#FFFFFF",
  border: "#E3E5DC",
  emerald: "#2F6F4E",
  emeraldSoft: "#E4EFE8",
  ochre: "#C77D2E",
  ochreSoft: "#F6E9DA",
  brick: "#B5482A",
  brickSoft: "#F5E4DD",
};

// The original prototype used a preview-only `window.storage` API. Use it when
// present, but persist accounts and sessions in the browser everywhere else.
const appStorage = {
  async get(key) {
    if (window.storage?.get) return window.storage.get(key, false);
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    if (window.storage?.set) return window.storage.set(key, value, false);
    window.localStorage.setItem(key, value);
  },
  async delete(key) {
    if (window.storage?.delete) return window.storage.delete(key, false);
    window.localStorage.removeItem(key);
  },
};

const accountStorageKey = (email) => `account:${encodeURIComponent(email.trim().toLowerCase())}`;
const planStorageKey = (email) => `plan:${encodeURIComponent(email.trim().toLowerCase())}`;
const studyAttendanceStorageKey = (email) => `study-attendance:${encodeURIComponent(email.trim().toLowerCase())}`;
const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:5000`;

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function recentDateKeys(days = 7) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - index);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  });
}

function formatDateLabel(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function getTopicPerformance(plan) {
  return Object.entries(plan?.lastTestResults || {})
    .map(([topic, result]) => ({ topic, percent: result.total ? Math.round((result.correct / result.total) * 100) : 0 }))
    .sort((a, b) => a.percent - b.percent);
}

const saveAccountRecord = (account) => {
  if (!account?.email) return Promise.resolve();
  return appStorage
    .set(accountStorageKey(account.email), JSON.stringify(account))
    .catch((e) => console.error("Storage error:", e));
};

const student = { name: "Aisha", streak: 12, overallMastery: 68 };
const defaultAccounts = [{ name: student.name, email: "aisha.k@student.edu", password: "student123" }];

const subjects = [
  {
    id: "ds",
    name: "Data Structures",
    mastery: 82,
    trend: 4,
    topics: [
      { name: "Arrays & Strings", mastery: 91 },
      { name: "Trees", mastery: 88 },
      { name: "Graph Traversal", mastery: 54 },
      { name: "Hashing", mastery: 61 },
    ],
  },
  {
    id: "os",
    name: "Operating Systems",
    mastery: 61,
    trend: -2,
    topics: [
      { name: "Process Scheduling", mastery: 74 },
      { name: "Deadlocks", mastery: 42 },
      { name: "Paging", mastery: 48 },
      { name: "File Systems", mastery: 70 },
    ],
  },
  {
    id: "dbms",
    name: "DBMS",
    mastery: 74,
    trend: 1,
    topics: [
      { name: "SQL Joins", mastery: 88 },
      { name: "Normalization", mastery: 51 },
      { name: "Transactions", mastery: 79 },
    ],
  },
  {
    id: "cn",
    name: "Computer Networks",
    mastery: 45,
    trend: 6,
    topics: [
      { name: "OSI Model", mastery: 67 },
      { name: "TCP Congestion Control", mastery: 33 },
      { name: "Subnetting", mastery: 38 },
    ],
  },
];

const weakTopics = subjects
  .flatMap((s) => s.topics.map((t) => ({ ...t, subject: s.name, subjectId: s.id })))
  .filter((t) => t.mastery < 55)
  .sort((a, b) => a.mastery - b.mastery);

const focusTopic = weakTopics[0];

const weeklyMinutes = [40, 65, 20, 80, 55, 90, 30];
const weekLabels = ["M", "T", "W", "T", "F", "S", "S"];

const dailyTasksSeed = [
  { id: 1, time: "8:00 AM", subject: "Data Structures", task: "Revise graph traversal notes", done: true },
  { id: 2, time: "11:00 AM", subject: "Operating Systems", task: "Practice deadlock problems", done: false },
  { id: 3, time: "4:00 PM", subject: "DBMS", task: "Read normalization chapter", done: false },
  { id: 4, time: "7:30 PM", subject: "Computer Networks", task: "Watch subnetting walkthrough", done: false },
];

const assignments = [
  { id: 1, title: "Graph algorithms problem set", subject: "Data Structures", due: "Due today", status: "pending" },
  { id: 2, title: "Deadlock avoidance report", subject: "Operating Systems", due: "Overdue by 1 day", status: "overdue" },
  { id: 3, title: "ER diagram assignment", subject: "DBMS", due: "Due in 3 days", status: "pending" },
  { id: 4, title: "Subnetting worksheet", subject: "Computer Networks", due: "Submitted", status: "submitted" },
];

const cgpaHistory = [
  { sem: "Sem 1", gpa: 7.6 },
  { sem: "Sem 2", gpa: 7.9 },
  { sem: "Sem 3", gpa: 7.8 },
  { sem: "Sem 4", gpa: 8.2 },
];
const currentCGPA = cgpaHistory[cgpaHistory.length - 1].gpa;

function predictCGPA(targetMastery) {
  const delta = targetMastery - student.overallMastery;
  const predicted = currentCGPA + delta * 0.025;
  return Math.min(10, Math.max(0, predicted));
}

const targetSkills = [
  "Data Structures",
  "Algorithms",
  "SQL",
  "Python",
  "Java",
  "Git",
  "System Design",
  "REST API",
  "Problem Solving",
  "Communication",
];

function analyzeResume(text) {
  const lower = text.toLowerCase();
  const matched = targetSkills.filter((k) => lower.includes(k.toLowerCase()));
  const missing = targetSkills.filter((k) => !matched.includes(k));
  const score = Math.round((matched.length / targetSkills.length) * 100);
  return { score, matched, missing };
}

const prepAreas = [
  { name: "Aptitude & Reasoning", progress: 70 },
  { name: "Coding Rounds", progress: 55 },
  { name: "System Design Basics", progress: 30 },
  { name: "HR & Behavioral", progress: 80 },
];

const upcomingDrives = [
  { company: "Acme Corp", role: "SDE Intern", date: "Sep 20" },
  { company: "Globex", role: "Software Engineer", date: "Sep 28" },
  { company: "Initech", role: "Backend Engineer", date: "Oct 4" },
];

function Ring({ value, size = 132, stroke = 12 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colors.border} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colors.emerald}
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs mb-2" style={{ color: colors.inkSoft, letterSpacing: "0.01em" }}>
      {children}
    </p>
  );
}

function Card({ children, onClick, style }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl p-4"
      style={{ background: colors.card, border: `1px solid ${colors.border}`, cursor: onClick ? "pointer" : "default", ...style }}
    >
      {children}
    </div>
  );
}

function TrendBadge({ trend }) {
  const up = trend >= 0;
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
      style={{
        background: up ? colors.emeraldSoft : colors.brickSoft,
        color: up ? colors.emerald : colors.brick,
      }}
    >
      {up ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
      {Math.abs(trend)}%
    </span>
  );
}

function reminders(plan) {
  const items = [];
  const sourceAssignments = plan?.assignments?.length ? plan.assignments : assignments;
  sourceAssignments
    .filter((a) => a.status === "overdue")
    .forEach((a) => items.push({ icon: AlertTriangle, color: colors.brick, bg: colors.brickSoft, text: `${a.title} is overdue` }));
  sourceAssignments
    .filter((a) => a.due === "Due today" && a.status !== "submitted")
    .forEach((a) => items.push({ icon: ListChecks, color: colors.ochre, bg: colors.ochreSoft, text: `${a.title} is due today` }));
  if (plan) {
    const nextAssignment = sourceAssignments.find((a) => a.status !== "submitted");
    items.push({
      icon: FileText,
      color: colors.emerald,
      bg: colors.emeraldSoft,
      text: nextAssignment ? `Next: ${nextAssignment.title}` : "All uploaded-file assignments are complete",
    });
  } else {
    items.push({ icon: Flame, color: colors.ochre, bg: colors.ochreSoft, text: `${student.streak}-day streak — keep it going` });
  }
  return items;
}

function ProductivityOverview({ goToTab, plan }) {
  const tasks = plan?.dailyTasks?.length ? plan.dailyTasks : dailyTasksSeed;
  const doneToday = tasks.filter((t) => t.done).length;
  const items = reminders(plan);

  const actions = [
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "assistant", label: "Ask AI", icon: MessageCircle },
    { id: "progress", label: "Progress", icon: BarChart3 },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2.5">
        {actions.map((a) => {
          const Icon = a.icon;
          return (
            <button
              key={a.id}
              onClick={() => goToTab(a.id)}
              className="flex flex-col items-center gap-1.5 rounded-2xl py-3"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}
            >
              <Icon size={17} color={colors.emerald} />
              <span className="text-xs" style={{ color: colors.ink, fontWeight: 500 }}>
                {a.label}
              </span>
            </button>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
            Today's tasks
          </span>
          <span className="text-xs" style={{ color: colors.inkSoft }}>
            {doneToday}/{tasks.length}
          </span>
        </div>
        <div className="rounded-full h-1.5" style={{ background: colors.border }}>
          <div
            className="h-1.5 rounded-full"
            style={{ width: `${(doneToday / tasks.length) * 100}%`, background: colors.emerald }}
          />
        </div>
      </Card>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Bell size={13} color={colors.inkSoft} />
          <SectionLabel>Reminders</SectionLabel>
        </div>
        <div className="flex flex-col gap-2">
          {items.slice(0, 3).map((it, i) => {
            const Icon = it.icon;
            return (
              <Card key={i}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 26, height: 26, background: it.bg }}
                  >
                    <Icon size={13} color={it.color} />
                  </div>
                  <p className="text-xs" style={{ color: colors.ink, lineHeight: 1.4 }}>
                    {it.text}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HomeScreen({ goToSubject, goToTab, userName, plan }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName = (userName || student.name).split(" ")[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between pt-1">
        <div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>
            {greeting}, {firstName}
          </p>
          <p className="text-sm mt-0.5" style={{ color: colors.inkSoft }}>
            Here's where your learning stands today.
          </p>
        </div>
        <div
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm"
          style={{ background: colors.ochreSoft, color: colors.ochre, fontWeight: 600 }}
        >
          {plan ? `${plan.topics.length} topics` : <><Flame size={15} />{student.streak}</>}
        </div>
      </div>

      {plan ? (
        <Card>
          <div className="flex items-center gap-4">
            <div className="relative shrink-0" style={{ width: 112, height: 112 }}>
              {(() => {
                const quizLength = (plan.quiz || []).length;
                const hasTest = typeof plan.lastTestScore === "number" && quizLength > 0;
                const taskCount = (plan.dailyTasks || []).length;
                const completedTasks = (plan.dailyTasks || []).filter((task) => task.done).length;
                const value = hasTest ? Math.round((plan.lastTestScore / quizLength) * 100) : taskCount ? Math.round((completedTasks / taskCount) * 100) : 0;
                return (
                  <>
                    <Ring value={value} size={112} stroke={10} />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span style={{ fontFamily: "Fraunces, serif", fontSize: 27, color: colors.ink, fontWeight: 600 }}>{value}%</span>
                      <span className="text-xs" style={{ color: colors.inkSoft }}>{hasTest ? "mastery" : "started"}</span>
                    </div>
                  </>
                );
              })()}
            </div>
            <div className="min-w-0">
              <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>Your live study plan</p>
              <p className="text-xs mt-1" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
                {plan.topics.length} {plan.topics.length === 1 ? "topic" : "topics"} from {plan.files?.length || 1} uploaded file{plan.files?.length === 1 ? "" : "s"}
              </p>
              <p className="text-xs mt-2" style={{ color: colors.inkSoft }}>
                {typeof plan.lastTestScore === "number" ? "Based on your latest file test." : "Complete tasks or take the test to build mastery."}
              </p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center gap-5">
            <div className="relative" style={{ width: 132, height: 132 }}>
              <Ring value={student.overallMastery} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 30, color: colors.ink, fontWeight: 600 }}>{student.overallMastery}%</span>
                <span className="text-xs" style={{ color: colors.inkSoft }}>mastery</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm" style={{ color: colors.inkSoft }}>Across {subjects.length} subjects you're tracking this term. Two topics need attention before your next test.</p>
            </div>
          </div>
        </Card>
      )}

      <ProductivityOverview goToTab={goToTab} plan={plan} />

      {plan?.lastTestResults && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Weak topics from latest test</SectionLabel>
            <span className="text-xs" style={{ color: colors.inkSoft }}>Live</span>
          </div>
          <div className="flex flex-col gap-3">
            {getTopicPerformance(plan).slice(0, 3).map(({ topic, percent }) => (
              <div key={topic}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs truncate pr-2" style={{ color: colors.ink }}>{topic}</span>
                  <span className="text-xs" style={{ color: percent < 60 ? colors.brick : colors.emerald, fontWeight: 600 }}>{percent}%</span>
                </div>
                <div className="rounded-full h-2" style={{ background: colors.border }}>
                  <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: percent < 60 ? colors.brick : colors.emerald, transition: "width 300ms ease" }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {plan?.topics?.length > 0 && (
        <div>
          <SectionLabel>Topics from your files</SectionLabel>
          <div className="flex flex-col gap-2">
            {plan.topics.slice(0, 6).map((topic) => (
              <Card key={topic}>
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 30, height: 30, background: colors.emeraldSoft }}
                  >
                    <FileText size={14} color={colors.emerald} />
                  </div>
                  <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                    {topic}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {!plan && focusTopic && (
        <div>
          <SectionLabel>Today's focus</SectionLabel>
          <Card style={{ borderColor: colors.emerald, borderWidth: 1.5 }} onClick={() => goToSubject(focusTopic.subjectId)}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 38, height: 38, background: colors.emeraldSoft }}
                >
                  <Sparkles size={17} color={colors.emerald} />
                </div>
                <div>
                  <p style={{ color: colors.ink, fontWeight: 600, fontSize: 15 }}>{focusTopic.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>
                    {focusTopic.subject} · lowest mastery at {focusTopic.mastery}%
                  </p>
                  <p className="text-xs mt-2" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
                    Recommended because it hasn't improved in 2 weeks and underpins 3 other topics.
                  </p>
                </div>
              </div>
              <ChevronRight size={18} color={colors.inkSoft} className="shrink-0 mt-2" />
            </div>
          </Card>
        </div>
      )}

      {!plan && <div>
        <div className="flex items-center justify-between mb-2">
          <SectionLabel>Weak topics identified</SectionLabel>
          <span className="text-xs" style={{ color: colors.inkSoft }}>
            {weakTopics.length} total
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {weakTopics.slice(0, 3).map((t) => (
            <Card key={t.subjectId + t.name} onClick={() => goToSubject(t.subjectId)}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full shrink-0"
                    style={{ width: 30, height: 30, background: colors.brickSoft }}
                  >
                    <Target size={14} color={colors.brick} />
                  </div>
                  <div>
                    <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: colors.inkSoft }}>
                      {t.subject}
                    </p>
                  </div>
                </div>
                <span className="text-sm" style={{ color: colors.brick, fontWeight: 600 }}>
                  {t.mastery}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>}

      {!plan && <div>
        <SectionLabel>Continue learning</SectionLabel>
        <div className="flex flex-col gap-2">
          {subjects.map((s) => (
            <Card key={s.id} onClick={() => goToSubject(s.id)}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                  {s.name}
                </p>
                <TrendBadge trend={s.trend} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-full h-1.5" style={{ background: colors.border }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${s.mastery}%`, background: colors.emerald }}
                  />
                </div>
                <span className="text-xs w-8 text-right" style={{ color: colors.inkSoft }}>
                  {s.mastery}%
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>}
    </div>
  );
}

function TopicStudyChat({ topic, context }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [thinking, setThinking] = useState(false);

  const ask = async () => {
    const message = question.trim();
    if (!message || thinking) return;
    setQuestion("");
    setMessages((current) => [...current, { role: "user", text: message }]);
    setThinking(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/study-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, context, message }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "The study assistant is unavailable.");
      setMessages((current) => [...current, { role: "assistant", text: result.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { role: "assistant", text: error.message }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Bot size={15} color={colors.emerald} />
        <SectionLabel>Ask AI about this topic</SectionLabel>
      </div>
      <div className="flex flex-col gap-2 mb-3 overflow-y-auto" style={{ maxHeight: 220 }}>
        {messages.map((message, index) => (
          <div key={index} className="rounded-xl px-3 py-2 text-xs" style={{ background: message.role === "user" ? colors.emerald : colors.paper, color: message.role === "user" ? "#fff" : colors.ink, lineHeight: 1.5 }}>
            {message.text}
          </div>
        ))}
        {thinking && <p className="text-xs" style={{ color: colors.inkSoft }}>Thinking about {topic}...</p>}
      </div>
      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && ask()}
          placeholder={`Ask about ${topic}`}
          className="flex-1 text-sm px-3 py-2 rounded-full outline-none"
          style={{ background: colors.paper, color: colors.ink, border: `1px solid ${colors.border}` }}
        />
        <button onClick={ask} aria-label="Ask AI" className="flex items-center justify-center rounded-full shrink-0" style={{ width: 38, height: 38, background: colors.emerald }}>
          <Send size={15} color="#fff" />
        </button>
      </div>
    </Card>
  );
}

function FileTopicDetail({ topic, plan, back }) {
  const details = plan.topicDetails?.find((item) => item.name === topic);
  const task = plan.dailyTasks?.find((item) => item.task.toLowerCase().includes(topic.toLowerCase()));
  const questions = (plan.quiz || []).filter((question) => question.topic === topic);

  return (
    <div className="flex flex-col gap-4 pt-1">
      <button onClick={back} className="flex items-center gap-1 text-sm self-start" style={{ color: colors.inkSoft }}>
        <ChevronLeft size={16} />
        All topics
      </button>
      <div>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>{topic}</p>
        <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>From your uploaded material</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <FileText size={15} color={colors.emerald} />
          <SectionLabel>Full study notes</SectionLabel>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
          <p className="text-sm" style={{ color: colors.ink, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
            {plan.content || details?.context || plan.summary || "This topic was extracted from your uploaded file."}
          </p>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={15} color={colors.emerald} />
          <SectionLabel>All concepts in this file</SectionLabel>
        </div>
        <div className="flex flex-col gap-2">
          {plan.topics.map((concept, index) => (
            <div key={`${concept}-${index}`} className="flex items-start gap-2">
              <span className="text-xs" style={{ color: colors.emerald, fontWeight: 600 }}>{index + 1}.</span>
              <span className="text-sm" style={{ color: colors.ink }}>{concept}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={15} color={colors.emerald} />
          <SectionLabel>Study task</SectionLabel>
        </div>
        <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
          {task?.task || `Review ${topic} from your uploaded material.`}
        </p>
        {task && <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>{task.time}</p>}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-2">
          <Check size={15} color={colors.emerald} />
          <SectionLabel>Check your understanding</SectionLabel>
        </div>
        <p className="text-sm" style={{ color: colors.ink, lineHeight: 1.5 }}>
          {questions.length ? questions[0].question : "Take the file test to check this topic."}
        </p>
        {questions.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            {questions.map((question) => (
              <div key={question.id} className="rounded-xl px-3 py-2" style={{ background: colors.emeraldSoft }}>
                <p className="text-xs" style={{ color: colors.ink, lineHeight: 1.45 }}>{question.question}</p>
                <p className="text-xs mt-1" style={{ color: colors.emerald, fontWeight: 600 }}>Answer: {question.correctAnswer}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <TopicStudyChat topic={topic} context={plan.content || details?.context || plan.summary || ""} />
    </div>
  );
}

function SubjectsList({ goToSubject, plan }) {
  const [selectedTopic, setSelectedTopic] = useState(null);

  if (plan?.topics?.length) {
    if (selectedTopic) return <FileTopicDetail topic={selectedTopic} plan={plan} back={() => setSelectedTopic(null)} />;
    return (
      <div className="flex flex-col gap-4 pt-1">
        <div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>
            Learn from your files
          </p>
          <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>
            {plan.files?.length || 1} uploaded file{plan.files?.length === 1 ? "" : "s"} · {plan.topics.length} topics found
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {plan.topics.map((topic, index) => (
            <Card key={`${topic}-${index}`} onClick={() => setSelectedTopic(topic)}>
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-xl shrink-0"
                  style={{ width: 36, height: 36, background: colors.emeraldSoft }}
                >
                  <BookOpen size={16} color={colors.emerald} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>{topic}</p>
                  <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>From your uploaded material</p>
                </div>
                <ChevronRight size={16} color={colors.inkSoft} className="ml-auto shrink-0" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pt-1">
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>Your subjects</p>
      <div className="flex flex-col gap-2">
        {subjects.map((s) => (
          <Card key={s.id} onClick={() => goToSubject(s.id)}>
            <div className="flex items-center justify-between mb-2">
              <p style={{ color: colors.ink, fontWeight: 500, fontSize: 15 }}>{s.name}</p>
              <ChevronRight size={16} color={colors.inkSoft} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-1 rounded-full h-1.5" style={{ background: colors.border }}>
                <div className="h-1.5 rounded-full" style={{ width: `${s.mastery}%`, background: colors.emerald }} />
              </div>
              <span className="text-xs w-8 text-right" style={{ color: colors.inkSoft }}>
                {s.mastery}%
              </span>
            </div>
            <p className="text-xs" style={{ color: colors.inkSoft }}>
              {s.topics.filter((t) => t.mastery < 55).length} weak topic
              {s.topics.filter((t) => t.mastery < 55).length !== 1 ? "s" : ""} · {s.topics.length} tracked
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SubjectDetail({ subjectId, back }) {
  const s = subjects.find((x) => x.id === subjectId);
  if (!s) return null;
  return (
    <div className="flex flex-col gap-4 pt-1">
      <button onClick={back} className="flex items-center gap-1 text-sm self-start" style={{ color: colors.inkSoft }}>
        <ChevronLeft size={16} />
        Subjects
      </button>
      <div>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>{s.name}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm" style={{ color: colors.inkSoft }}>
            {s.mastery}% mastery
          </span>
          <TrendBadge trend={s.trend} />
        </div>
      </div>
      <div>
        <SectionLabel>Topics</SectionLabel>
        <div className="flex flex-col gap-2">
          {s.topics.map((t) => {
            const weak = t.mastery < 55;
            return (
              <Card key={t.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {weak && <Target size={13} color={colors.brick} />}
                    <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                      {t.name}
                    </p>
                  </div>
                  <span className="text-xs" style={{ color: weak ? colors.brick : colors.inkSoft, fontWeight: 600 }}>
                    {t.mastery}%
                  </span>
                </div>
                <div className="rounded-full h-1.5" style={{ background: colors.border }}>
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${t.mastery}%`, background: weak ? colors.ochre : colors.emerald }}
                  />
                </div>
                {weak && (
                  <button
                    className="mt-3 text-xs rounded-full px-3 py-1.5"
                    style={{ background: colors.emerald, color: "#fff", fontWeight: 500 }}
                  >
                    Practice now
                  </button>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProgressScreen({ plan }) {
  if (plan?.topics?.length) {
    const tasks = plan.dailyTasks || [];
    const completedTasks = tasks.filter((task) => task.done).length;
    const assignmentsDone = (plan.assignments || []).filter((assignment) => assignment.status === "submitted").length;
    const quizLength = plan.lastTestQuestionCount || (plan.dailyQuiz || plan.quiz || []).length;
    const hasTestScore = typeof plan.lastTestScore === "number" && quizLength > 0;
    const performance = hasTestScore ? Math.round((plan.lastTestScore / quizLength) * 100) : 0;
    const estimatedCgpa = hasTestScore ? (5 + performance / 20).toFixed(2) : "--";
    const testScore = hasTestScore ? `${plan.lastTestScore}/${quizLength}` : "Not taken";
    const assignmentTotal = (plan.assignments || []).length;
    const taskPercent = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const assignmentPercent = assignmentTotal ? Math.round((assignmentsDone / assignmentTotal) * 100) : 0;
    const performanceBars = [
      { label: "Test", value: performance, color: colors.emerald },
      { label: "Tasks", value: taskPercent, color: colors.ochre },
      { label: "Work", value: assignmentPercent, color: colors.brick },
    ];
    return (
      <div className="flex flex-col gap-5 pt-1">
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>Your progress</p>
        <p className="text-xs" style={{ color: colors.inkSoft }}>
          Based on {plan.files?.length || 1} uploaded file{plan.files?.length === 1 ? "" : "s"}
        </p>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <SectionLabel>Daily performance</SectionLabel>
            <span className="text-xs" style={{ color: colors.inkSoft }}>Live</span>
          </div>
          <div className="flex items-end justify-around gap-4" style={{ height: 132 }}>
            {performanceBars.map((bar) => (
              <div key={bar.label} className="flex-1 h-full flex flex-col items-center justify-end gap-2">
                <span className="text-xs" style={{ color: colors.ink, fontWeight: 600 }}>{bar.value}%</span>
                <div className="w-full flex-1 flex items-end rounded-t-lg" style={{ background: colors.border }}>
                  <div
                    className="w-full rounded-t-lg"
                    style={{ height: `${Math.max(bar.value, 3)}%`, background: bar.color, transition: "height 300ms ease" }}
                  />
                </div>
                <span className="text-xs" style={{ color: colors.inkSoft }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: 124, height: 124 }}>
              <Ring value={performance} size={124} stroke={11} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span style={{ fontFamily: "Fraunces, serif", fontSize: 29, color: colors.ink, fontWeight: 600 }}>
                  {hasTestScore ? `${performance}%` : "--"}
                </span>
                <span className="text-xs" style={{ color: colors.inkSoft }}>test score</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <SectionLabel>Current performance</SectionLabel>
              <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>
                {hasTestScore ? `${testScore} correct` : "Test not taken"}
              </p>
              <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>
                {hasTestScore ? "Based on your latest file test." : "Take the file test to calculate performance."}
              </p>
              <div className="mt-3">
                <p className="text-xs" style={{ color: colors.inkSoft }}>Estimated CGPA</p>
                <p style={{ fontFamily: "Fraunces, serif", fontSize: 25, color: colors.emerald, fontWeight: 600 }}>{estimatedCgpa}<span className="text-xs" style={{ fontFamily: "Inter, sans-serif", color: colors.inkSoft }}> / 10</span></p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-2">
            <SectionLabel>Daily task progress</SectionLabel>
            <span className="text-xs" style={{ color: colors.inkSoft }}>{completedTasks}/{tasks.length}</span>
          </div>
          <div className="rounded-full h-2" style={{ background: colors.border }}>
            <div className="h-2 rounded-full" style={{ width: `${taskPercent}%`, background: colors.emerald }} />
          </div>
          <div className="flex items-center justify-between mt-3 mb-2">
            <SectionLabel>Assignments submitted</SectionLabel>
            <span className="text-xs" style={{ color: colors.inkSoft }}>{assignmentsDone}/{assignmentTotal}</span>
          </div>
          <div className="rounded-full h-2" style={{ background: colors.border }}>
            <div className="h-2 rounded-full" style={{ width: `${assignmentPercent}%`, background: colors.ochre }} />
          </div>
        </Card>

        {plan.lastTestResults && (
          <Card>
            <div className="flex items-center justify-between mb-3">
              <SectionLabel>Topic performance</SectionLabel>
              <span className="text-xs" style={{ color: colors.inkSoft }}>From latest test</span>
            </div>
            <div className="flex flex-col gap-3">
              {getTopicPerformance(plan).map(({ topic, percent }) => (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs truncate pr-2" style={{ color: colors.ink }}>{topic}</span>
                    <span className="text-xs" style={{ color: percent < 60 ? colors.brick : colors.emerald, fontWeight: 600 }}>{percent}%</span>
                  </div>
                  <div className="rounded-full h-2" style={{ background: colors.border }}>
                    <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: percent < 60 ? colors.brick : colors.emerald, transition: "width 300ms ease" }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        <div>
          <SectionLabel>Topics from your files</SectionLabel>
          <div className="flex flex-col gap-2">
            {plan.topics.map((topic, index) => (
              <Card key={`${topic}-${index}`}>
                <div className="flex items-center gap-3">
                  <BookOpen size={15} color={colors.emerald} />
                  <span className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>{topic}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxMin = Math.max(...weeklyMinutes);
  return (
    <div className="flex flex-col gap-5 pt-1">
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>Progress</p>

      <Card>
        <div className="flex items-center justify-between mb-1">
          <SectionLabel>Study time this week</SectionLabel>
          <span className="text-xs" style={{ color: colors.inkSoft }}>
            {weeklyMinutes.reduce((a, b) => a + b, 0)} min
          </span>
        </div>
        <div className="flex items-end gap-2.5 pt-3" style={{ height: 110 }}>
          {weeklyMinutes.map((m, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full rounded-md"
                style={{ height: `${(m / maxMin) * 80}px`, background: i === 5 ? colors.emerald : colors.emeraldSoft }}
              />
              <span className="text-xs" style={{ color: colors.inkSoft }}>
                {weekLabels[i]}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <Clock size={16} color={colors.ochre} />
          <p className="text-xl mt-2" style={{ fontFamily: "Fraunces, serif", color: colors.ink, fontWeight: 600 }}>
            6.7h
          </p>
          <p className="text-xs" style={{ color: colors.inkSoft }}>
            avg. per week
          </p>
        </Card>
        <Card>
          <Check size={16} color={colors.emerald} />
          <p className="text-xl mt-2" style={{ fontFamily: "Fraunces, serif", color: colors.ink, fontWeight: 600 }}>
            {weakTopics.length}
          </p>
          <p className="text-xs" style={{ color: colors.inkSoft }}>
            topics to close
          </p>
        </Card>
      </div>

      <CGPACard />

      <div>
        <SectionLabel>Mastery by subject</SectionLabel>
        <Card>
          <div className="flex flex-col gap-3">
            {subjects.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs w-28 shrink-0" style={{ color: colors.ink }}>
                  {s.name}
                </span>
                <div className="flex-1 rounded-full h-1.5" style={{ background: colors.border }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${s.mastery}%`, background: colors.emerald }} />
                </div>
                <span className="text-xs w-8 text-right" style={{ color: colors.inkSoft }}>
                  {s.mastery}%
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function bestSubjectMatch(text) {
  const lower = text.toLowerCase();
  for (const s of subjects) {
    if (lower.includes(s.name.toLowerCase())) return s;
    for (const t of s.topics) {
      if (lower.includes(t.name.toLowerCase())) return s;
    }
  }
  return null;
}

function craftReply(userText) {
  const match = bestSubjectMatch(userText);
  if (match) {
    const weak = match.topics.filter((t) => t.mastery < 55)[0];
    if (weak) {
      return `Good question on ${match.name}. Since your mastery on ${weak.name} is still at ${weak.mastery}%, want a walkthrough of that first, or should we stick with what you asked?`;
    }
    return `Here's a quick explanation for ${match.name}. You're already at ${match.mastery}% mastery here, so this should build on what you know.`;
  }
  if (/hi|hello|hey/i.test(userText)) {
    return `Hey! Ask me about any topic in your subjects, or paste your notes below to get a summary.`;
  }
  return `Got it. Based on your current mastery scores, I'd suggest reviewing ${focusTopic ? focusTopic.name : "your weakest topic"} next, but ask away on this specific question too.`;
}

function ChatPanel() {
  const [messages, setMessages] = useState([
    { role: "assistant", text: `Hi ${student.name}, I'm your study assistant. Ask about any topic, or paste notes on the Notes tab to get a summary.` },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const next = [...messages, { role: "user", text }];
    setMessages(next);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "assistant", text: craftReply(text) }]);
      setTyping(false);
    }, 700);
  };

  return (
    <div className="flex flex-col" style={{ height: "100%" }}>
      <div className="flex-1 overflow-y-auto flex flex-col gap-3 pb-3">
        {messages.map((m, i) => (
          <div key={i} className="flex" style={{ justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div
              className="rounded-2xl px-3.5 py-2.5 text-sm"
              style={{
                maxWidth: "78%",
                background: m.role === "user" ? colors.emerald : colors.card,
                color: m.role === "user" ? "#fff" : colors.ink,
                border: m.role === "user" ? "none" : `1px solid ${colors.border}`,
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex" style={{ justifyContent: "flex-start" }}>
            <div
              className="rounded-2xl px-3.5 py-2.5 text-sm"
              style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.inkSoft }}
            >
              typing…
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Ask about a topic…"
          className="flex-1 text-sm px-3.5 py-2.5 rounded-full outline-none"
          style={{ background: colors.emeraldSoft, color: colors.ink, border: "none" }}
        />
        <button
          onClick={send}
          aria-label="Send"
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 38, height: 38, background: colors.emerald }}
        >
          <Send size={15} color="#fff" />
        </button>
      </div>
    </div>
  );
}

function summarize(text) {
  const sentences = text
    .split(/(?<=[.?!])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
  const points = sentences.slice(0, Math.min(4, Math.max(2, Math.ceil(sentences.length / 3))));
  const lower = text.toLowerCase();
  const tags = subjects.filter((s) => lower.includes(s.name.toLowerCase()) || s.topics.some((t) => lower.includes(t.name.toLowerCase())));
  return { points: points.length ? points : sentences, tags };
}

function NotesPanel() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = () => {
    if (!text.trim()) {
      setError("Paste some notes first");
      return;
    }
    setError("");
    setResult(summarize(text));
  };

  return (
    <div className="flex flex-col gap-3 pt-1">
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError("");
        }}
        placeholder="Paste your lecture notes or textbook paragraph here…"
        className="w-full text-sm p-3 rounded-xl outline-none resize-none"
        style={{ height: 130, background: colors.card, border: `1px solid ${colors.border}`, color: colors.ink }}
      />
      {error && (
        <p className="text-xs" style={{ color: colors.brick }}>
          {error}
        </p>
      )}
      <button
        onClick={run}
        className="text-sm rounded-full px-4 py-2.5 self-start"
        style={{ background: colors.emerald, color: "#fff", fontWeight: 500 }}
      >
        Summarize
      </button>

      {result && (
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <FileText size={15} color={colors.emerald} />
            <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>
              Key points
            </p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {result.points.map((p, i) => (
              <li key={i} className="text-sm flex items-start gap-2" style={{ color: colors.ink, lineHeight: 1.5 }}>
                <span style={{ color: colors.emerald }}>•</span>
                {p}
              </li>
            ))}
          </ul>
          {result.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3" style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 10 }}>
              {result.tags.map((t) => (
                <span
                  key={t.id}
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ background: colors.emeraldSoft, color: colors.emerald }}
                >
                  {t.name}
                </span>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function AssistantScreen() {
  const [mode, setMode] = useState("chat");
  return (
    <div className="flex flex-col gap-3 pt-1" style={{ height: "100%" }}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-xl shrink-0"
          style={{ width: 34, height: 34, background: colors.emeraldSoft }}
        >
          <Bot size={16} color={colors.emerald} />
        </div>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>Assistant</p>
      </div>
      <div className="flex rounded-full p-1" style={{ background: colors.border }}>
        {[
          { id: "chat", label: "Chat" },
          { id: "notes", label: "Notes" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex-1 text-sm py-1.5 rounded-full"
            style={{
              background: mode === m.id ? colors.card : "transparent",
              color: mode === m.id ? colors.ink : colors.inkSoft,
              fontWeight: mode === m.id ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className="flex-1" style={{ minHeight: 0 }}>
        {mode === "chat" ? <ChatPanel /> : <NotesPanel />}
      </div>
    </div>
  );
}

function DailyPlanner({ plan, onUpdatePlan }) {
  const [tasks, setTasks] = useState(plan?.dailyTasks?.length ? plan.dailyTasks : dailyTasksSeed);
  const toggle = (id) => {
    setTasks((current) => {
      const next = current.map((item) => (item.id === id ? { ...item, done: !item.done } : item));
      if (plan && onUpdatePlan) onUpdatePlan({ ...plan, dailyTasks: next });
      return next;
    });
  };
  const doneCount = tasks.filter((t) => t.done).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: colors.inkSoft }}>
        {doneCount} of {tasks.length} done today
      </p>
      <div className="flex flex-col gap-2">
        {tasks.map((t) => (
          <Card key={t.id} onClick={() => toggle(t.id)}>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 22,
                  height: 22,
                  border: `1.5px solid ${t.done ? colors.emerald : colors.border}`,
                  background: t.done ? colors.emerald : "transparent",
                }}
              >
                {t.done && <Check size={13} color="#fff" />}
              </div>
              <div className="flex-1">
                <p
                  className="text-sm"
                  style={{
                    color: t.done ? colors.inkSoft : colors.ink,
                    fontWeight: 500,
                    textDecoration: t.done ? "line-through" : "none",
                  }}
                >
                  {t.task}
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>
                  {t.time} · {t.subject}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TimelinePanel({ plan }) {
  const tasks = plan?.dailyTasks?.length ? plan.dailyTasks : dailyTasksSeed;
  const items = [
    ...tasks.map((task) => ({
      key: `task-${task.id}`,
      label: task.time,
      title: task.task,
      meta: task.subject,
      complete: task.done,
      color: colors.emerald,
      icon: Calendar,
    })),
    ...(plan?.assignments?.length ? plan.assignments : assignments).map((assignment) => ({
      key: `assignment-${assignment.id}`,
      label: assignment.due,
      title: assignment.title,
      meta: `${assignment.subject} · assignment`,
      complete: assignment.status === "submitted",
      color: assignment.status === "overdue" ? colors.brick : colors.ochre,
      icon: FileText,
    })),
  ];

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: colors.inkSoft }}>
        {plan ? "Your uploaded-file study timeline" : "Your study timeline"}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.key} style={{ opacity: item.complete ? 0.7 : 1 }}>
              <div className="flex items-start gap-3">
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div className="flex items-center justify-center rounded-full" style={{ width: 30, height: 30, background: item.complete ? colors.emeraldSoft : colors.ochreSoft }}>
                    {item.complete ? <Check size={15} color={colors.emerald} /> : <Icon size={15} color={item.color} />}
                  </div>
                  <div style={{ width: 1, height: 18, background: colors.border }} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs" style={{ color: item.color, fontWeight: 600 }}>{item.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: colors.ink, fontWeight: 500, textDecoration: item.complete ? "line-through" : "none" }}>{item.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>{item.meta}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function InlineTestUpload({ onPlan }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    if (!files.length || loading) return;
    setLoading(true);
    setError("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not analyze the files.");
      onPlan(result);
    } catch (analysisError) {
      setError(analysisError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Upload size={15} color={colors.emerald} />
        <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>Create a test from your files</p>
      </div>
      <p className="text-xs mb-3" style={{ color: colors.inkSoft }}>
        Upload notes, a syllabus, PDF, Word document, or text file to generate today&apos;s test.
      </p>
      <label className="flex items-center justify-center rounded-xl py-3 cursor-pointer" style={{ border: `1px dashed ${colors.border}`, background: colors.paper }}>
        <span className="text-sm" style={{ color: colors.emerald, fontWeight: 600 }}>{files.length ? `${files.length} file selected` : "Choose study files"}</span>
        <input type="file" multiple accept=".pdf,.doc,.docx,.txt" style={{ display: "none" }} onChange={(event) => setFiles(Array.from(event.target.files || []))} />
      </label>
      {error && <p className="text-xs mt-2" style={{ color: colors.brick }}>{error}</p>}
      <button onClick={analyze} disabled={!files.length || loading} className="w-full text-sm rounded-full py-2.5 mt-3" style={{ background: files.length && !loading ? colors.emerald : colors.border, color: files.length && !loading ? "#fff" : colors.inkSoft, fontWeight: 600 }}>
        {loading ? "Analyzing files..." : "Generate daily test"}
      </button>
    </Card>
  );
}

function DailyTestGenerator({ plan, onUpdatePlan }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/api/generate-test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: plan.content || plan.summary || plan.topics?.join("\n") || "",
          topics: plan.dailyTasks?.map((task) => task.task.replace(/^Study\s+/i, "")) || plan.topics,
          dailyTasks: plan.dailyTasks || [],
          assignments: plan.assignments || [],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not create today's test.");
      onUpdatePlan({ ...plan, dailyQuiz: result.questions, dailyQuizSource: result.source || "local" });
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={15} color={colors.emerald} />
        <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>Create today&apos;s test</p>
      </div>
      <p className="text-xs" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
        Use your previously uploaded file and today&apos;s study-task topics to create a new understanding test.
      </p>
      {error && <p className="text-xs mt-2" style={{ color: colors.brick }}>{error}</p>}
      <button onClick={generate} disabled={loading} className="w-full text-sm rounded-full py-2.5 mt-3" style={{ background: loading ? colors.border : colors.emerald, color: loading ? colors.inkSoft : "#fff", fontWeight: 600 }}>
        {loading ? "Creating test..." : "Create today's test"}
      </button>
    </Card>
  );
}

function FileQuiz({ plan, onUpdatePlan }) {
  const questions = plan?.dailyQuizSource ? plan.dailyQuiz || [] : [];
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState({});
  const [finished, setFinished] = useState(false);

  if (!questions.length) {
    return plan ? <DailyTestGenerator plan={plan} onUpdatePlan={onUpdatePlan} /> : <InlineTestUpload onPlan={onUpdatePlan} />;
  }

  if (finished) {
    const topicResults = questions.reduce((result, question) => {
      const current = result[question.topic] || { correct: 0, total: 0 };
      current.total += 1;
      if (answers[question.id] === question.correctAnswer) current.correct += 1;
      result[question.topic] = current;
      return result;
    }, {});
    return (
      <div className="flex flex-col gap-3">
        <Card>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>Test complete</p>
          <p className="text-sm mt-2" style={{ color: colors.inkSoft }}>You scored {score} out of {questions.length}.</p>
        </Card>
        <Card>
          <SectionLabel>Weak topics from this test</SectionLabel>
          <div className="flex flex-col gap-3">
            {Object.entries(topicResults).map(([topic, result]) => {
              const percent = Math.round((result.correct / result.total) * 100);
              return (
                <div key={topic}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: colors.ink }}>{topic}</span>
                    <span className="text-xs" style={{ color: percent < 60 ? colors.brick : colors.emerald, fontWeight: 600 }}>{percent}%</span>
                  </div>
                  <div className="rounded-full h-2" style={{ background: colors.border }}>
                    <div className="h-2 rounded-full" style={{ width: `${percent}%`, background: percent < 60 ? colors.brick : colors.emerald }} />
                  </div>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => { setCurrent(0); setSelected(null); setScore(0); setAnswers({}); setFinished(false); }}
            className="text-sm rounded-full px-4 py-2.5 mt-4"
            style={{ background: colors.emerald, color: "#fff", fontWeight: 600 }}
          >
            Retake test
          </button>
        </Card>
      </div>
    );
  }

  const question = questions[current];
  const answer = (option) => {
    if (selected) return;
    setSelected(option);
    setAnswers((currentAnswers) => ({ ...currentAnswers, [question.id]: option }));
    if (option === question.correctAnswer) setScore((value) => value + 1);
  };
  const next = () => {
    if (current === questions.length - 1) {
      const finalScore = score + (selected === question.correctAnswer ? 1 : 0);
      const finalAnswers = { ...answers, [question.id]: selected };
      const lastTestResults = questions.reduce((result, item) => {
        const current = result[item.topic] || { correct: 0, total: 0 };
        current.total += 1;
        if (finalAnswers[item.id] === item.correctAnswer) current.correct += 1;
        result[item.topic] = current;
        return result;
      }, {});
      onUpdatePlan?.({ ...plan, lastTestScore: finalScore, lastTestQuestionCount: questions.length, lastTestAt: new Date().toISOString(), lastTestResults });
      setFinished(true);
    } else {
      setCurrent((value) => value + 1);
      setSelected(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs" style={{ color: colors.inkSoft }}>
        Daily test · {plan.dailyQuizSource === "ai" ? "ChatGPT generated" : "Study-plan generated"} · Question {current + 1} of {questions.length}
      </p>
      <Card>
        <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>{question.question}</p>
        <p className="text-xs mt-1 mb-3" style={{ color: colors.inkSoft }}>Topic: {question.topic}</p>
        <div className="flex flex-col gap-2">
          {question.options.map((option) => {
            const isCorrect = selected && option === question.correctAnswer;
            const isWrong = selected === option && option !== question.correctAnswer;
            return (
              <button
                key={option}
                onClick={() => answer(option)}
                className="text-left text-sm rounded-xl px-3 py-2.5"
                style={{
                  background: isCorrect ? colors.emeraldSoft : isWrong ? colors.brickSoft : colors.paper,
                  border: `1px solid ${isCorrect ? colors.emerald : isWrong ? colors.brick : colors.border}`,
                  color: colors.ink,
                }}
              >
                {option}
              </button>
            );
          })}
        </div>
        {selected && (
          <button onClick={next} className="w-full text-sm rounded-full py-2.5 mt-4" style={{ background: colors.emerald, color: "#fff", fontWeight: 600 }}>
            {current === questions.length - 1 ? "Finish test" : "Next question"}
          </button>
        )}
      </Card>
    </div>
  );
}

function statusColors(status) {
  if (status === "submitted") return { bg: colors.emeraldSoft, fg: colors.emerald, label: "Submitted" };
  if (status === "overdue") return { bg: colors.brickSoft, fg: colors.brick, label: "Overdue" };
  return { bg: colors.ochreSoft, fg: colors.ochre, label: "Pending" };
}

function AssignmentsPanel({ plan }) {
  const items = plan?.assignments?.length ? plan.assignments : assignments;
  return (
    <div className="flex flex-col gap-2">
      {items.map((a) => {
        const s = statusColors(a.status);
        return (
          <Card key={a.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                  {a.title}
                </p>
                <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>
                  {a.subject}
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: s.bg, color: s.fg, fontWeight: 600 }}
              >
                {s.label}
              </span>
            </div>
            <p className="text-xs mt-2" style={{ color: a.status === "overdue" ? colors.brick : colors.inkSoft }}>
              {a.due}
            </p>
          </Card>
        );
      })}
    </div>
  );
}

function AttendancePanel({ studyAttendanceDates }) {
  const loggedInDates = Array.isArray(studyAttendanceDates) ? studyAttendanceDates : [];
  const dates = recentDateKeys();
  return (
    <div className="flex flex-col gap-3">
      <Card style={{ background: colors.emeraldSoft, borderColor: colors.emerald }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>Study attendance today</p>
            <p className="text-xs mt-0.5" style={{ color: colors.inkSoft }}>
              {loggedInDates.includes(localDateKey()) ? "Marked present when you logged in." : "Log in today to mark yourself present."}
            </p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: colors.card, color: colors.emerald, fontWeight: 600 }}>
            {loggedInDates.includes(localDateKey()) ? "Present" : "Not marked"}
          </span>
        </div>
      </Card>
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={15} color={colors.emerald} />
          <p className="text-sm" style={{ color: colors.ink, fontWeight: 600 }}>Last 7 days</p>
        </div>
        <div className="flex flex-col gap-2">
          {dates.map((dateKey, index) => {
            const present = loggedInDates.includes(dateKey);
            return (
              <div key={dateKey} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: colors.ink }}>{index === 0 ? "Today" : formatDateLabel(dateKey)}</span>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: present ? colors.emeraldSoft : colors.brickSoft, color: present ? colors.emerald : colors.brick, fontWeight: 600 }}>
                  {present ? "Present" : "Not present"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function PlannerScreen({ plan, onUpdatePlan, studyAttendanceDates }) {
  const [mode, setMode] = useState("today");
  const tabs = [
    { id: "today", label: "Today" },
    { id: "timeline", label: "Timeline" },
    { id: "tasks", label: "Assignments" },
    { id: "test", label: "Test" },
    { id: "attendance", label: "Attendance" },
  ];
  return (
    <div className="flex flex-col gap-4 pt-1">
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>Planner</p>
      <div className="flex rounded-full p-1" style={{ background: colors.border }}>
        {tabs.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className="flex-1 text-xs py-1.5 rounded-full"
            style={{
              background: mode === m.id ? colors.card : "transparent",
              color: mode === m.id ? colors.ink : colors.inkSoft,
              fontWeight: mode === m.id ? 600 : 400,
            }}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === "today" && <DailyPlanner plan={plan} onUpdatePlan={onUpdatePlan} />}
      {mode === "timeline" && <TimelinePanel plan={plan} />}
      {mode === "tasks" && <AssignmentsPanel plan={plan} />}
      {mode === "test" && <FileQuiz plan={plan} onUpdatePlan={onUpdatePlan} />}
      {mode === "attendance" && (
        <AttendancePanel studyAttendanceDates={studyAttendanceDates} />
      )}
    </div>
  );
}

function CGPACard() {
  const [target, setTarget] = useState(student.overallMastery);
  const predicted = predictCGPA(target);
  const maxGpa = 10;

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GraduationCap size={15} color={colors.emerald} />
          <SectionLabel>CGPA prediction</SectionLabel>
        </div>
        <span style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.ink, fontWeight: 600 }}>
          {currentCGPA.toFixed(2)}
        </span>
      </div>

      <div className="flex items-end gap-2.5 pt-1 pb-3" style={{ height: 90 }}>
        {cgpaHistory.map((s) => (
          <div key={s.sem} className="flex-1 flex flex-col items-center gap-2">
            <div
              className="w-full rounded-md"
              style={{ height: `${(s.gpa / maxGpa) * 64}px`, background: colors.emeraldSoft }}
            />
            <span className="text-xs" style={{ color: colors.inkSoft }}>
              {s.sem}
            </span>
          </div>
        ))}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div
            className="w-full rounded-md"
            style={{ height: `${(predicted / maxGpa) * 64}px`, background: colors.ochre }}
          />
          <span className="text-xs" style={{ color: colors.ochre, fontWeight: 600 }}>
            Next
          </span>
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: 12 }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs" style={{ color: colors.inkSoft }}>
            If your average mastery reaches
          </span>
          <span className="text-xs" style={{ color: colors.ink, fontWeight: 600 }}>
            {target}%
          </span>
        </div>
        <input
          type="range"
          min={40}
          max={95}
          step={1}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="w-full"
          style={{ accentColor: colors.emerald }}
        />
        <p className="text-sm mt-2" style={{ color: colors.ink }}>
          Predicted CGPA:{" "}
          <span style={{ fontWeight: 600, color: colors.ochre }}>{predicted.toFixed(2)}</span>
        </p>
      </div>
    </Card>
  );
}

function ResumeAnalyzer({ back }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = () => {
    if (!text.trim()) {
      setError("Paste your resume text first");
      return;
    }
    setError("");
    setResult(analyzeResume(text));
  };

  return (
    <div className="flex flex-col gap-4 pt-1">
      <button onClick={back} className="flex items-center gap-1 text-sm self-start" style={{ color: colors.inkSoft }}>
        <ChevronLeft size={16} />
        Profile
      </button>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>Resume analyzer</p>
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError("");
        }}
        placeholder="Paste your resume text here…"
        className="w-full text-sm p-3 rounded-xl outline-none resize-none"
        style={{ height: 130, background: colors.card, border: `1px solid ${colors.border}`, color: colors.ink }}
      />
      {error && (
        <p className="text-xs" style={{ color: colors.brick }}>
          {error}
        </p>
      )}
      <button
        onClick={run}
        className="text-sm rounded-full px-4 py-2.5 self-start"
        style={{ background: colors.emerald, color: "#fff", fontWeight: 500 }}
      >
        Analyze
      </button>

      {result && (
        <>
          <Card>
            <div className="flex items-center gap-5">
              <div className="relative" style={{ width: 90, height: 90 }}>
                <Ring value={result.score} size={90} stroke={9} />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontFamily: "Fraunces, serif", fontSize: 19, color: colors.ink, fontWeight: 600 }}>
                    {result.score}%
                  </span>
                </div>
              </div>
              <p className="text-sm flex-1" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
                Match against {targetSkills.length} common skills for entry-level software roles.
              </p>
            </div>
          </Card>
          <div>
            <SectionLabel>Found on your resume</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {result.matched.length ? (
                result.matched.map((m) => (
                  <span key={m} className="text-xs px-2 py-1 rounded-full" style={{ background: colors.emeraldSoft, color: colors.emerald }}>
                    {m}
                  </span>
                ))
              ) : (
                <span className="text-xs" style={{ color: colors.inkSoft }}>
                  None matched yet
                </span>
              )}
            </div>
          </div>
          <div>
            <SectionLabel>Worth adding</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {result.missing.map((m) => (
                <span key={m} className="text-xs px-2 py-1 rounded-full" style={{ background: colors.brickSoft, color: colors.brick }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlacementPrep({ back }) {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <button onClick={back} className="flex items-center gap-1 text-sm self-start" style={{ color: colors.inkSoft }}>
        <ChevronLeft size={16} />
        Profile
      </button>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>Placement prep</p>

      <div>
        <SectionLabel>Prep areas</SectionLabel>
        <div className="flex flex-col gap-2">
          {prepAreas.map((p) => (
            <Card key={p.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                  {p.name}
                </p>
                <span className="text-xs" style={{ color: colors.inkSoft }}>
                  {p.progress}%
                </span>
              </div>
              <div className="rounded-full h-1.5" style={{ background: colors.border }}>
                <div className="h-1.5 rounded-full" style={{ width: `${p.progress}%`, background: colors.emerald }} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-2">
          <Building2 size={13} color={colors.inkSoft} />
          <SectionLabel>Upcoming drives</SectionLabel>
        </div>
        <div className="flex flex-col gap-2">
          {upcomingDrives.map((d) => (
            <Card key={d.company}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                    {d.company}
                  </p>
                  <p className="text-xs" style={{ color: colors.inkSoft }}>
                    {d.role}
                  </p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: colors.ochreSoft, color: colors.ochre, fontWeight: 600 }}>
                  {d.date}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({ userName, userEmail, onLogout, onUpdatePlan }) {
  const [view, setView] = useState(null);
  if (view === "resume") return <ResumeAnalyzer back={() => setView(null)} />;
  if (view === "placement") return <PlacementPrep back={() => setView(null)} />;

  const displayName = userName || student.name;
  const rows = ["Notifications", "Study preferences", "Linked courses", "Privacy", "Help"];
  return (
    <div className="flex flex-col gap-5 pt-1">
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 52, height: 52, background: colors.emeraldSoft }}
        >
          <span style={{ fontFamily: "Fraunces, serif", color: colors.emerald, fontWeight: 600, fontSize: 18 }}>
            {displayName[0].toUpperCase()}
          </span>
        </div>
        <div>
          <p style={{ fontFamily: "Fraunces, serif", fontSize: 18, color: colors.ink, fontWeight: 600 }}>
            {displayName}
          </p>
          <p className="text-xs" style={{ color: colors.inkSoft }}>
            {userEmail ? `${userEmail} · ` : ""}
            {student.overallMastery}% overall mastery · {student.streak}-day streak
          </p>
        </div>
      </div>

      <button
        onClick={onUpdatePlan}
        className="flex items-center justify-between rounded-2xl p-4 text-left"
        style={{ background: colors.emeraldSoft, border: `1px solid ${colors.border}` }}
      >
        <span className="flex items-center gap-2.5 text-sm" style={{ color: colors.emerald, fontWeight: 600 }}>
          <Upload size={15} />
          Analyze new study files
        </span>
        <ChevronRight size={15} color={colors.emerald} />
      </button>

      <div>
        <SectionLabel>Career</SectionLabel>
        <Card>
          <div className="flex flex-col">
            <button
              onClick={() => setView("resume")}
              className="flex items-center justify-between py-3 w-full"
            >
              <span className="flex items-center gap-2.5 text-sm" style={{ color: colors.ink }}>
                <FileText size={15} color={colors.emerald} />
                Resume analyzer
              </span>
              <ChevronRight size={15} color={colors.inkSoft} />
            </button>
            <button
              onClick={() => setView("placement")}
              className="flex items-center justify-between py-3 w-full"
              style={{ borderTop: `1px solid ${colors.border}` }}
            >
              <span className="flex items-center gap-2.5 text-sm" style={{ color: colors.ink }}>
                <Briefcase size={15} color={colors.emerald} />
                Placement prep
              </span>
              <ChevronRight size={15} color={colors.inkSoft} />
            </button>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col">
          {rows.map((r, i) => (
            <div
              key={r}
              className="flex items-center justify-between py-3"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${colors.border}` }}
            >
              <span className="text-sm" style={{ color: colors.ink }}>
                {r}
              </span>
              <ChevronRight size={15} color={colors.inkSoft} />
            </div>
          ))}
        </div>
      </Card>

      <button
        onClick={onLogout}
        className="flex items-center justify-center gap-2 text-sm rounded-full py-3"
        style={{ background: colors.card, border: `1px solid ${colors.border}`, color: colors.brick, fontWeight: 500 }}
      >
        <LogOut size={15} />
        Log out
      </button>
    </div>
  );
}

function LoginScreen({ accounts, addAccount, onLogin }) {
  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const clearError = () => error && setError("");

  const submitSignin = () => {
    if (!email.trim() || !password.trim()) {
      setError("Enter both email and password");
      return;
    }
    const match = accounts.find(
      (a) => a.email.toLowerCase() === email.trim().toLowerCase() && a.password === password
    );
    if (!match) {
      setError("No account matches that email and password. Create one below.");
      return;
    }
    setError("");
    onLogin(match);
  };

  const submitSignup = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Fill in every field");
      return;
    }
    if (accounts.some((a) => a.email.toLowerCase() === email.trim().toLowerCase())) {
      setError("An account with that email already exists");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    const newAccount = { name: name.trim(), email: email.trim(), password };
    addAccount(newAccount);
    setError("");
    onLogin(newAccount);
  };

  return (
    <div className="auth-screen flex-1 flex flex-col justify-center px-7 overflow-y-auto">
      <div
        className="flex items-center justify-center rounded-2xl mb-5 self-start"
        style={{ width: 46, height: 46, background: colors.emeraldSoft }}
      >
        <GraduationCap size={22} color={colors.emerald} />
      </div>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 24, color: colors.ink, fontWeight: 600 }}>
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </p>
      <p className="text-sm mt-1 mb-6" style={{ color: colors.inkSoft }}>
        {mode === "signin" ? "Sign in to your AI Student OS account." : "Set up an account to start tracking your learning."}
      </p>

      <div className="flex flex-col gap-3">
        {mode === "signup" && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-3.5"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, height: 46 }}
          >
            <User size={16} color={colors.inkSoft} />
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearError();
              }}
              placeholder="Full name"
              className="flex-1 text-sm outline-none"
              style={{ background: "transparent", color: colors.ink }}
            />
          </div>
        )}
        <div
          className="flex items-center gap-2.5 rounded-xl px-3.5"
          style={{ background: colors.card, border: `1px solid ${colors.border}`, height: 46 }}
        >
          <Mail size={16} color={colors.inkSoft} />
          <input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            placeholder="Email"
            className="flex-1 text-sm outline-none"
            style={{ background: "transparent", color: colors.ink }}
          />
        </div>
        <div
          className="flex items-center gap-2.5 rounded-xl px-3.5"
          style={{ background: colors.card, border: `1px solid ${colors.border}`, height: 46 }}
        >
          <Lock size={16} color={colors.inkSoft} />
          <input
            value={password}
            type="password"
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            onKeyDown={(e) => e.key === "Enter" && mode === "signin" && submitSignin()}
            placeholder="Password"
            className="flex-1 text-sm outline-none"
            style={{ background: "transparent", color: colors.ink }}
          />
        </div>
        {mode === "signup" && (
          <div
            className="flex items-center gap-2.5 rounded-xl px-3.5"
            style={{ background: colors.card, border: `1px solid ${colors.border}`, height: 46 }}
          >
            <Lock size={16} color={colors.inkSoft} />
            <input
              value={confirmPassword}
              type="password"
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                clearError();
              }}
              onKeyDown={(e) => e.key === "Enter" && submitSignup()}
              placeholder="Confirm password"
              className="flex-1 text-sm outline-none"
              style={{ background: "transparent", color: colors.ink }}
            />
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs mt-3" style={{ color: colors.brick }}>
          {error}
        </p>
      )}

      <button
        onClick={mode === "signin" ? submitSignin : submitSignup}
        className="auth-primary text-sm rounded-full py-3 mt-5"
        style={{ background: colors.emerald, color: "#fff", fontWeight: 600 }}
      >
        {mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError("");
        }}
        className="auth-secondary text-sm mt-4"
        style={{ color: colors.emerald, fontWeight: 500 }}
      >
        {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}

function OnboardingScreen({ onComplete }) {
  const [step, setStep] = useState("ask");
  const [files, setFiles] = useState([]);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setStep("analyzing");
    setError("");
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    try {
      const response = await fetch(`${API_BASE_URL}/api/analyze`, { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not analyze the uploaded files.");
      setPlan(result);
      setStep("results");
    } catch (analysisError) {
      setError(analysisError.message);
      setStep("upload");
    }
  };

  if (step === "ask") {
    return (
      <div className="flex-1 flex flex-col justify-center px-7">
        <div
          className="flex items-center justify-center rounded-2xl mb-5 self-start"
          style={{ width: 46, height: 46, background: colors.emeraldSoft }}
        >
          <Upload size={21} color={colors.emerald} />
        </div>
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 22, color: colors.ink, fontWeight: 600 }}>
          Got any subject notes or PDFs?
        </p>
        <p className="text-sm mt-2" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
          Upload your syllabus, notes, or textbook chapters and I'll build your daily plan and flag the topics you're weakest on.
        </p>
        <button
          onClick={() => setStep("upload")}
          className="text-sm rounded-full py-3 mt-6"
          style={{ background: colors.emerald, color: "#fff", fontWeight: 600 }}
        >
          Yes, upload files
        </button>
        <button
          onClick={onComplete}
          className="text-sm mt-4"
          style={{ color: colors.inkSoft, fontWeight: 500 }}
        >
          No, use sample data for now
        </button>
      </div>
    );
  }

  if (step === "upload") {
    return (
      <div className="flex-1 flex flex-col justify-center px-7">
        <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>
          Add your files
        </p>
        <p className="text-sm mt-2 mb-4" style={{ color: colors.inkSoft }}>
          PDFs, Word docs, or text notes work best.
        </p>
        {error && <p className="text-xs mb-3" style={{ color: colors.brick }}>{error}</p>}

        <label
          className="flex flex-col items-center justify-center gap-2 rounded-2xl py-8 cursor-pointer"
          style={{ border: `1.5px dashed ${colors.border}`, background: colors.card }}
        >
          <Upload size={20} color={colors.emerald} />
          <span className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
            Choose files
          </span>
          <span className="text-xs" style={{ color: colors.inkSoft }}>
            or drag and drop
          </span>
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.txt"
            style={{ display: "none" }}
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
          />
        </label>

        {files.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            {files.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
                style={{ background: colors.emeraldSoft }}
              >
                <FileCheck2 size={15} color={colors.emerald} />
                <span className="text-xs flex-1 truncate" style={{ color: colors.emerald }}>
                  {f.name}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={analyze}
          disabled={files.length === 0}
          className="text-sm rounded-full py-3 mt-6 flex items-center justify-center gap-2"
          style={{
            background: files.length ? colors.emerald : colors.border,
            color: files.length ? "#fff" : colors.inkSoft,
            fontWeight: 600,
          }}
        >
          Analyze {files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""}` : ""}
        </button>
        <button onClick={onComplete} className="text-sm mt-4" style={{ color: colors.inkSoft, fontWeight: 500 }}>
          Skip for now
        </button>
      </div>
    );
  }

  if (step === "analyzing") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <Loader2 size={28} color={colors.emerald} className="animate-spin" />
        <p className="text-sm mt-4" style={{ color: colors.ink, fontWeight: 500 }}>
          Reading your files…
        </p>
        <p className="text-xs mt-1" style={{ color: colors.inkSoft }}>
          Identifying subjects, topics, and gaps
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col justify-center px-7 overflow-y-auto py-8">
      <div
        className="flex items-center justify-center rounded-2xl mb-4 self-start"
        style={{ width: 46, height: 46, background: colors.emeraldSoft }}
      >
        <FileCheck2 size={21} color={colors.emerald} />
      </div>
      <p style={{ fontFamily: "Fraunces, serif", fontSize: 20, color: colors.ink, fontWeight: 600 }}>
        Analysis complete
      </p>
      <p className="text-sm mt-2 mb-5" style={{ color: colors.inkSoft, lineHeight: 1.5 }}>
        Found {plan.topics.length} topic{plan.topics.length !== 1 ? "s" : ""} across {files.length} file{files.length !== 1 ? "s" : ""}. Here's what stands out.
      </p>

      <SectionLabel>Topics found in your files</SectionLabel>
      <div className="flex flex-col gap-2 mb-5">
        {plan.topics.slice(0, 3).map((topic) => (
          <div
            key={topic}
            className="flex items-center justify-between rounded-xl px-3.5 py-2.5"
            style={{ background: colors.card, border: `1px solid ${colors.border}` }}
          >
            <div className="flex items-center gap-2.5">
              <Target size={14} color={colors.brick} />
              <div>
                <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                  {topic}
                </p>
                <p className="text-xs" style={{ color: colors.inkSoft }}>
                  From uploaded material
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel>Your daily plan is ready</SectionLabel>
      <div className="flex flex-col gap-2 mb-6">
        {plan.dailyTasks.slice(0, 3).map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5"
            style={{ background: colors.card, border: `1px solid ${colors.border}` }}
          >
            <Calendar size={14} color={colors.emerald} />
            <div>
              <p className="text-sm" style={{ color: colors.ink, fontWeight: 500 }}>
                {t.task}
              </p>
              <p className="text-xs" style={{ color: colors.inkSoft }}>
                {t.time} · {t.subject}
              </p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onComplete(plan)}
        className="text-sm rounded-full py-3 flex items-center justify-center gap-2"
        style={{ background: colors.emerald, color: "#fff", fontWeight: 600 }}
      >
        View my dashboard
        <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default function AIStudentOS() {
  const [accounts, setAccounts] = useState(defaultAccounts);
  const [currentUser, setCurrentUser] = useState(null);
  const [userPlan, setUserPlan] = useState(null);
  const [studyAttendanceDates, setStudyAttendanceDates] = useState([]);
  const [phase, setPhase] = useState("login");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("home");
  const [selectedSubject, setSelectedSubject] = useState(null);

  const markStudyAttendance = async (email) => {
    const today = localDateKey();
    try {
      const saved = await appStorage.get(studyAttendanceStorageKey(email));
      const previous = saved?.value ? JSON.parse(saved.value) : null;
      const dates = Array.isArray(previous) ? previous : previous?.date ? [previous.date] : [];
      const nextDates = [...new Set([today, ...dates])].sort().slice(-90);
      setStudyAttendanceDates(nextDates);
      await appStorage.set(studyAttendanceStorageKey(email), JSON.stringify(nextDates));
    } catch (e) {
      console.error("Study attendance storage error:", e);
      setStudyAttendanceDates([today]);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let acc = defaultAccounts;
      let needsAccountSave = false;
      try {
        const res = await appStorage.get("accounts");
        if (res && res.value) {
          const storedAccounts = JSON.parse(res.value);
          if (Array.isArray(storedAccounts)) acc = storedAccounts;
          else needsAccountSave = true;
        } else {
          needsAccountSave = true;
        }
      } catch (e) {
        needsAccountSave = true;
      }
      if (needsAccountSave) {
        try {
          await appStorage.set("accounts", JSON.stringify(acc));
        } catch (e) {
          console.error("Storage error:", e);
        }
      }
      if (cancelled) return;
      setAccounts(acc);
      await Promise.all(acc.map(saveAccountRecord));

      let sessionEmail = null;
      try {
        const s = await appStorage.get("session");
        if (s && s.value) sessionEmail = s.value;
      } catch (e) {
        sessionEmail = null;
      }

      if (cancelled) return;
      if (sessionEmail) {
        const match = acc.find((a) => a.email.toLowerCase() === sessionEmail.toLowerCase());
        if (match) {
          let restoredPlan = null;
          try {
            const savedPlan = await appStorage.get(planStorageKey(match.email));
            if (savedPlan?.value) {
              restoredPlan = JSON.parse(savedPlan.value);
              setUserPlan(restoredPlan);
            }
          } catch (e) {
            console.error("Plan storage error:", e);
          }
          try {
            const savedStudyAttendance = await appStorage.get(studyAttendanceStorageKey(match.email));
            if (savedStudyAttendance?.value) {
              const savedDates = JSON.parse(savedStudyAttendance.value);
              setStudyAttendanceDates(Array.isArray(savedDates) ? savedDates : savedDates?.date ? [savedDates.date] : []);
            }
          } catch (e) {
            console.error("Study attendance storage error:", e);
          }
          await markStudyAttendance(match.email);
          setCurrentUser(match);
          setPhase("app");
          setLoading(false);
          return;
        }
      }
      setPhase("login");
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addAccount = (acc) => {
    setAccounts((prev) => {
      const next = [...prev, acc];
      appStorage.set("accounts", JSON.stringify(next)).catch((e) => console.error("Storage error:", e));
      return next;
    });
    saveAccountRecord(acc);
  };

  const handleLogin = async (account) => {
    setCurrentUser(account);
    saveAccountRecord(account);
    appStorage.set("session", account.email).catch((e) => console.error("Storage error:", e));
    await markStudyAttendance(account.email);
    let hasSavedPlan = false;
    let savedPlanData = null;
    try {
      const savedPlan = await appStorage.get(planStorageKey(account.email));
      if (savedPlan?.value) {
        savedPlanData = JSON.parse(savedPlan.value);
        setUserPlan(savedPlanData);
        hasSavedPlan = true;
      }
    } catch (e) {
      console.error("Plan storage error:", e);
    }
    if (!hasSavedPlan) setUserPlan(null);
    setPhase(hasSavedPlan ? "app" : "onboarding");
  };

  const handlePlanComplete = (plan) => {
    if (plan) {
      setUserPlan(plan);
      appStorage.set(planStorageKey(currentUser.email), JSON.stringify(plan)).catch((e) => console.error("Plan storage error:", e));
    }
    setPhase("app");
  };

  const handleUpdatePlan = (nextPlan) => {
    setUserPlan(nextPlan);
    appStorage.set(planStorageKey(currentUser.email), JSON.stringify(nextPlan)).catch((e) => console.error("Plan storage error:", e));
  };

  const handleStartPlanUpdate = () => setPhase("onboarding");

  const handleLogout = () => {
    setCurrentUser(null);
    setUserPlan(null);
    setStudyAttendanceDates([]);
    setPhase("login");
    appStorage.delete("session").catch((e) => console.error("Storage error:", e));
  };

  const changeTab = (t) => {
    setTab(t);
    setSelectedSubject(null);
  };

  const goToSubject = (id) => {
    setSelectedSubject(id);
    setTab("subjects");
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "planner", label: "Planner", icon: Calendar },
    { id: "subjects", label: "Learn", icon: BookOpen },
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "assistant", label: "Assistant", icon: MessageCircle },
    { id: "profile", label: "Profile", icon: User },
  ];

  return (
    <div className="app-stage w-full min-h-screen flex items-center justify-center p-6" style={{ background: "#DCDEDA" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&display=swap');`}</style>
      <div
        className="app-frame w-full relative overflow-hidden flex flex-col"
        style={{
          maxWidth: 390,
          height: 780,
          background: colors.paper,
          borderRadius: 36,
          boxShadow: "0 20px 50px rgba(30,42,37,0.18)",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div className="app-safe-top" />
        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader2 size={24} color={colors.emerald} className="animate-spin" />
          </div>
        )}
        {!loading && phase === "login" && (
          <LoginScreen accounts={accounts} addAccount={addAccount} onLogin={handleLogin} />
        )}
        {!loading && phase === "onboarding" && <OnboardingScreen onComplete={handlePlanComplete} />}
        {!loading && phase === "app" && (
          <>
            <div className="app-content flex-1 overflow-y-auto px-5 pb-4">
              {tab === "home" && <HomeScreen goToSubject={goToSubject} goToTab={changeTab} userName={currentUser?.name} plan={userPlan} />}
              {tab === "planner" && (
                <PlannerScreen
                  plan={userPlan}
                  onUpdatePlan={handleUpdatePlan}
                  studyAttendanceDates={studyAttendanceDates}
                />
              )}
              {tab === "subjects" &&
                (selectedSubject ? (
                  <SubjectDetail subjectId={selectedSubject} back={() => setSelectedSubject(null)} />
                ) : (
                  <SubjectsList goToSubject={goToSubject} plan={userPlan} />
                ))}
              {tab === "progress" && <ProgressScreen plan={userPlan} />}
              {tab === "assistant" && <AssistantScreen />}
              {tab === "profile" && (
                <ProfileScreen
                  userName={currentUser?.name}
                  userEmail={currentUser?.email}
                  onLogout={handleLogout}
                  onUpdatePlan={handleStartPlanUpdate}
                />
              )}
            </div>
            <div
              className="flex items-center justify-around shrink-0"
              style={{ height: 72, borderTop: `1px solid ${colors.border}`, background: colors.card, padding: "0 4px" }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => changeTab(item.id)}
                    className="flex flex-col items-center gap-1"
                    style={{ color: active ? colors.emerald : colors.inkSoft, flex: 1, minWidth: 0 }}
                  >
                    <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                    <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, whiteSpace: "nowrap" }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
