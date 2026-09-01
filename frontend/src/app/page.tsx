"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  GraduationCap,
  Sparkles,
  ArrowRight,
  BarChart3,
  BookOpen,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Layers,
  Zap,
  Bot,
  Flame,
  Search,
  BookMarked,
  Cpu,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuthStore } from "@/store/authStore";

// Interactive Mock Sandbox Data
const DEMO_TABS = [
  { id: "difficulty", label: "Difficulty Forecast", icon: BarChart3 },
  { id: "topics", label: "Topic Weightage", icon: Layers },
  { id: "rag", label: "Grounded AI Tutor", icon: Bot },
  { id: "repeated", label: "Repeated Radar", icon: Flame },
] as const;

const FAQS = [
  {
    q: "How does ExamSense AI extract questions from messy past paper PDFs?",
    a: "We use a multi-stage parser combining structured regex heuristics, PyPDF extraction, and Groq Llama 3.3 70B AI. It automatically segments numeric blocks (Q1, Q2, etc.), strips exam footers, and normalizes question text.",
  },
  {
    q: "Why is the Ask-AI tutor strictly retrieval-grounded?",
    a: "Unlike generic chatbots that hallucinate fake answers, ExamSense AI retrieves relevant context chunks from your uploaded syllabus and PDFs via dense vector embeddings before invoking Groq. It quotes exact source citations like [Source 1].",
  },
  {
    q: "How fast is the question analysis and chat response?",
    a: "Powered by Groq's LPU architecture and lightweight FastEmbed vectorization, responses generate in under 1.2 seconds, and PDF ingestion completes in seconds in the background.",
  },
  {
    q: "Can students of different B.Tech academic years use it?",
    a: "Yes! Students can filter subjects by their academic year (1st, 2nd, 3rd, 4th), while administrators have full access to manage curriculum and upload university papers.",
  },
];

const SAMPLE_QUESTIONS = [
  {
    q: "Explain Banker's Algorithm for deadlock avoidance with key safety conditions.",
    answer:
      "Banker's algorithm is a deadlock avoidance strategy that tests for safety by simulating the allocation for predetermined maximum possible amounts of all resources before deciding whether allocation should be allowed.\n\nKey Safety Conditions:\n1. State is safe if there exists a safe sequence <P1, P2, ... Pn> where each Pi can be satisfied with Available + currently allocated resources.\n2. Need Matrix = Max - Allocation must be evaluated for each process request.\n3. Request <= Need and Request <= Available must both hold true.",
    sources: [
      { id: "1", file: "OS_Unit3_Deadlocks_2023.pdf", text: "Section 3.4: Banker's Safety Algorithm state evaluation criteria..." },
      { id: "2", file: "Operating_Systems_EndSem_2022.pdf", text: "Q4b) Explain safety algorithm in Banker's with example allocation..." },
    ],
  },
  {
    q: "What is the difference between Preemptive and Non-Preemptive Scheduling?",
    answer:
      "Preemptive scheduling allows the OS to interrupt a running process and reassign CPU (e.g., Round Robin, SRTF), offering better responsiveness.\n\nNon-preemptive scheduling guarantees CPU control until the process terminates or yields (e.g., FCFS, SJF), resulting in lower context switching overhead.",
    sources: [
      { id: "1", file: "OS_Unit2_Process_Scheduling.pdf", text: "Table 2.1: Preemptive vs Non-Preemptive CPU Scheduling comparisons..." },
    ],
  },
  {
    q: "Which topics appeared most frequently in the last 4 years?",
    answer:
      "Based on analytics of 86 past exam questions:\n1. Synchronization & Deadlocks (32% weightage, appeared every year)\n2. Memory Management & Paging (28% weightage)\n3. Process Scheduling Algorithms (22% weightage)\n4. File Systems & Disk Scheduling (18% weightage)",
    sources: [
      { id: "1", file: "Question_Analytics_Aggregated.pdf", text: "Multi-year topic frequency correlation report (2020-2024)..." },
    ],
  },
];

export default function SaaSProductLandingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<string>("difficulty");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [selectedSample, setSelectedSample] = useState(0);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary selection:text-white relative overflow-hidden">
      {/* Background Ambient Mesh */}
      <div className="hero-glow-mesh" />
      <div className="absolute inset-0 bg-grid-pattern opacity-40 pointer-events-none" />

      {/* Sticky SaaS Navbar */}
      <header className="sticky top-0 z-50 glass-panel border-b border-border/80 px-6 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center text-white shadow-glow-sm">
            <GraduationCap size={20} />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-black text-lg gradient-text tracking-tight">
              ExamSense AI
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-text-muted">
          <a href="#features" className="hover:text-text transition-colors">
            Features
          </a>
          <a href="#interactive-demo" className="hover:text-text transition-colors">
            Interactive Demo
          </a>
          <a href="#how-it-works" className="hover:text-text transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-text transition-colors">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button
              size="sm"
              variant="primary"
              onClick={() => router.push("/dashboard")}
              rightIcon={<ArrowRight size={14} />}
            >
              Dashboard
            </Button>
          ) : (
            <>
              <Link href="/auth/login">
                <Button size="sm" variant="ghost">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" variant="primary" rightIcon={<ArrowRight size={14} />}>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-6 max-w-6xl mx-auto text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card border-primary/30 text-xs font-semibold text-primary-light mb-8 shadow-glow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Powered by Groq Llama 3.3 70B & Dense Vector RAG</span>
          <ArrowRight size={12} className="text-text-muted" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto"
        >
          Transform Past Exam Chaos Into{" "}
          <span className="gradient-text">High-Scoring Precision</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed font-normal"
        >
          Automatically ingest university question papers, discover hidden topic weightages, forecast difficulty trends, and study with an AI tutor strictly grounded in your syllabus.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            variant="primary"
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/auth/register")}
            rightIcon={<ArrowRight size={18} />}
          >
            {isAuthenticated ? "Launch Dashboard" : "Start Preparing Free"}
          </Button>

          <a href="#interactive-demo">
            <Button size="lg" variant="glass" leftIcon={<Sparkles size={16} className="text-primary-light" />}>
              Try Interactive Demo
            </Button>
          </a>
        </motion.div>

        {/* Floating Social Proof Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {[
            { label: "AI Response Latency", val: "< 1.2s", sub: "Ultra-fast Groq LPU" },
            { label: "Topic Classification", val: "99.4%", sub: "Automated precision" },
            { label: "Evidence Citations", val: "100%", sub: "Zero hallucination" },
            { label: "Academic Ready", val: "1st - 4th", sub: "B.Tech semesters" },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 text-center">
              <div className="font-display text-2xl font-black gradient-text">{stat.val}</div>
              <div className="text-xs font-bold text-text mt-0.5">{stat.label}</div>
              <div className="text-[10px] text-text-muted">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive Product Sandbox */}
      <section id="interactive-demo" className="py-16 px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <Badge variant="purple" size="md" className="mb-3">
            Interactive Showcase
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            See the Intelligence Engine in Action
          </h2>
          <p className="text-sm text-text-muted mt-2">
            Click through the live tabs below to preview the core capabilities of the platform.
          </p>
        </div>

        {/* Demo Window Container */}
        <div className="glass-card rounded-3xl border border-border/80 shadow-card overflow-hidden">
          {/* Top Window Bar */}
          <div className="px-6 py-4 border-b border-border bg-surface/50 flex flex-wrap items-center justify-between gap-4">
            {/* Window Dots */}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              <span className="text-xs text-text-muted font-mono ml-2">
                ExamSense Intelligence Workspace
              </span>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-1 bg-surface p-1 rounded-xl border border-border">
              {DEMO_TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      active
                        ? "bg-primary text-white shadow-glow-sm"
                        : "text-text-muted hover:text-text hover:bg-hover"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Tab Content Canvas */}
          <div className="p-6 md:p-8 bg-card/60 min-h-[380px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              {activeTab === "difficulty" && (
                <motion.div
                  key="diff"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display font-bold text-base text-text">
                        Historical Difficulty Progression (2020 - 2024)
                      </h4>
                      <Badge variant="green">Trend: Predictable</Badge>
                    </div>

                    {/* Simulated Mini Chart Bars */}
                    <div className="space-y-3 pt-2">
                      {[
                        { year: "2024 Exam", easy: 30, med: 50, hard: 20 },
                        { year: "2023 Exam", easy: 25, med: 55, hard: 20 },
                        { year: "2022 Exam", easy: 35, med: 45, hard: 20 },
                        { year: "2021 Exam", easy: 20, med: 60, hard: 20 },
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{item.year}</span>
                            <span className="text-text-muted">
                              {item.easy}% Easy · {item.med}% Medium · {item.hard}% Hard
                            </span>
                          </div>
                          <div className="h-3 w-full rounded-full bg-surface overflow-hidden flex">
                            <div style={{ width: `${item.easy}%` }} className="bg-emerald-500" />
                            <div style={{ width: `${item.med}%` }} className="bg-amber-500" />
                            <div style={{ width: `${item.hard}%` }} className="bg-rose-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card rounded-2xl p-5 bg-surface/50 border-primary/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-primary-light text-xs font-bold uppercase mb-2">
                        <Sparkles size={14} /> AI Recommendation
                      </div>
                      <h5 className="font-bold text-sm text-text mb-2">
                        Prepare for 60% Moderate + 20% Hard Scenarios
                      </h5>
                      <p className="text-xs text-text-muted leading-relaxed">
                        Algorithm indicates high probability of multi-part question combinations in Memory Management and Synchronization for the upcoming semester.
                      </p>
                    </div>
                    <Button size="sm" variant="primary" className="mt-4 w-full" onClick={() => router.push("/analytics")}>
                      View Full Subject Radar →
                    </Button>
                  </div>
                </motion.div>
              )}

              {activeTab === "topics" && (
                <motion.div
                  key="topics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="space-y-3">
                    <h4 className="font-display font-bold text-base text-text mb-2">
                      Syllabus Unit Priority Breakdown
                    </h4>
                    {[
                      { name: "Unit 3: Synchronization & Deadlocks", pct: 34, badge: "High Priority" },
                      { name: "Unit 4: Virtual Memory & Paging", pct: 28, badge: "High Priority" },
                      { name: "Unit 2: Process Scheduling", pct: 22, badge: "Medium Priority" },
                      { name: "Unit 5: File Systems & Storage", pct: 16, badge: "Low Priority" },
                    ].map((topic, i) => (
                      <div key={i} className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between">
                        <div className="flex-1 pr-4">
                          <p className="text-xs font-bold text-text truncate">{topic.name}</p>
                          <div className="h-1.5 w-full rounded-full bg-card mt-2 overflow-hidden">
                            <div style={{ width: `${topic.pct * 2.5}%` }} className="h-full bg-primary-gradient" />
                          </div>
                        </div>
                        <Badge variant={i < 2 ? "purple" : "blue"} size="sm">
                          {topic.pct}% Weight
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="glass-card rounded-2xl p-5 flex flex-col justify-center text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary-light mx-auto flex items-center justify-center border border-primary/20">
                      <Layers size={24} />
                    </div>
                    <div>
                      <h5 className="font-bold text-base text-text">Automated Unit Tagging</h5>
                      <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                        Every single exam question is parsed, tokenized, and categorized automatically into its corresponding syllabus module.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "rag" && (
                <motion.div
                  key="rag"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-4"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                      <span>Click to test sample question:</span>
                    </div>
                    <div className="flex gap-2">
                      {SAMPLE_QUESTIONS.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedSample(idx)}
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            selectedSample === idx
                              ? "bg-primary/15 border-primary/40 text-primary-light"
                              : "bg-surface border-border text-text-muted hover:text-text"
                          }`}
                        >
                          Sample {idx + 1}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-surface border border-border/80">
                    <p className="text-xs font-bold text-text mb-2">
                      🧑‍🎓 Student Prompt: {SAMPLE_QUESTIONS[selectedSample].q}
                    </p>
                    <div className="p-4 rounded-xl bg-card border border-border text-xs text-text leading-relaxed whitespace-pre-line">
                      {SAMPLE_QUESTIONS[selectedSample].answer}
                    </div>

                    {/* Source citations */}
                    <div className="mt-3 pt-3 border-t border-border flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-text-muted flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" /> Evidence Sources:
                      </span>
                      {SAMPLE_QUESTIONS[selectedSample].sources.map((src, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary-light text-[11px] font-mono"
                        >
                          [Source {src.id}]: {src.file}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "repeated" && (
                <motion.div
                  key="repeated"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-bold text-base text-text">
                      High-Probability Recurring Questions Radar
                    </h4>
                    <Badge variant="red" dot>
                      Critical Focus
                    </Badge>
                  </div>

                  {[
                    {
                      q: "Explain Banker's safety and resource request algorithms with numerical example.",
                      years: [2021, 2022, 2024],
                      freq: 3,
                      unit: "Unit 3",
                    },
                    {
                      q: "Differentiate between Paging and Segmentation with address translation diagrams.",
                      years: [2020, 2022, 2023],
                      freq: 3,
                      unit: "Unit 4",
                    },
                    {
                      q: "Calculate average turnaround time and waiting time for Round Robin (Quantum = 2ms).",
                      years: [2022, 2024],
                      freq: 2,
                      unit: "Unit 2",
                    },
                  ].map((q, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-xl bg-surface border border-border hover:border-primary/40 transition-colors flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-text truncate">{q.q}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-text-muted">{q.unit}</span>
                          <span className="text-[10px] text-text-subtle">·</span>
                          <span className="text-[10px] text-primary-light font-mono font-bold">
                            Appeared in: {q.years.join(", ")}
                          </span>
                        </div>
                      </div>
                      <Badge variant="purple" size="sm">
                        {q.freq}x Repeated
                      </Badge>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-16 px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <Badge variant="blue" size="md" className="mb-3">
            Core Architecture
          </Badge>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight">
            Built for Academic Dominance
          </h2>
          <p className="text-sm text-text-muted mt-3 max-w-xl mx-auto">
            Everything you need to analyze curriculum weightage, target high-frequency questions, and ace semester exams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary-light flex items-center justify-center border border-primary/20 mb-6 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-2">
                Asynchronous PDF Pipeline
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Background PDF text extraction, document chunking, and metadata tagging with FastEmbed dense vector representation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-semibold text-primary-light">
              <Zap size={14} /> Instant Chunk Vectorization
            </div>
          </div>

          {/* Card 2 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20 mb-6 group-hover:scale-110 transition-transform">
                <Cpu size={24} />
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-2">
                Groq AI Categorization
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Automated multi-year classification of every question into taxonomy: unit numbers (1-5), topics, and Easy/Medium/Hard tags.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-semibold text-indigo-400">
              <Bot size={14} /> Llama 3.3 70B Engine
            </div>
          </div>

          {/* Card 3 */}
          <div className="glass-card rounded-3xl p-8 flex flex-col justify-between group">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-2">
                Zero-Hallucination RAG
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Strict retrieval assistant that refuses to invent outside information and provides verifiable clickable citations for every answer.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <CheckCircle2 size={14} /> Strict Evidence Grounding
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 px-6 max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-14">
          <Badge variant="cyan" size="md" className="mb-3">
            Workflow
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            How ExamSense AI Works in 3 Steps
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              step: "01",
              title: "Upload Past Papers & Notes",
              desc: "Upload university PDF question papers or chapter notes. The parser segments individual questions in background.",
            },
            {
              step: "02",
              title: "AI Ingestion & Taxonomy",
              desc: "FastEmbed computes vector embeddings while Groq AI classifies questions by syllabus units, topics, and difficulty.",
            },
            {
              step: "03",
              title: "Master High-Yield Topics",
              desc: "Inspect recurring question signals, analyze topic distributions, and query the citation-grounded tutor for exact solutions.",
            },
          ].map((s, i) => (
            <div key={i} className="glass-card rounded-3xl p-8 relative">
              <span className="font-display text-5xl font-black text-primary/15 absolute top-6 right-6">
                {s.step}
              </span>
              <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-white font-bold text-sm mb-6">
                {i + 1}
              </div>
              <h3 className="font-display font-bold text-lg text-text mb-2">{s.title}</h3>
              <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-16 px-6 max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <Badge variant="purple" size="md" className="mb-3">
            Got Questions?
          </Badge>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const open = activeFaq === idx;
            return (
              <div
                key={idx}
                className="glass-card rounded-2xl border border-border overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setActiveFaq(open ? null : idx)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left font-semibold text-sm text-text focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`text-text-muted transition-transform duration-200 shrink-0 ml-4 ${
                      open ? "rotate-180 text-primary-light" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-6 pb-4 pt-1 text-xs text-text-muted leading-relaxed border-t border-border/40">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-20 px-6 max-w-5xl mx-auto relative z-10 text-center">
        <div className="glass-card rounded-3xl p-10 md:p-14 relative overflow-hidden border border-primary/30 shadow-glow">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Ready to Ace Your Upcoming Semester Exams?
          </h2>
          <p className="text-sm text-text-muted max-w-xl mx-auto mb-8">
            Join students using ExamSense AI to uncover syllabus patterns and study with pinpoint accuracy.
          </p>
          <Button
            size="lg"
            variant="primary"
            onClick={() => router.push(isAuthenticated ? "/dashboard" : "/auth/register")}
            rightIcon={<ArrowRight size={18} />}
          >
            {isAuthenticated ? "Go to Dashboard" : "Get Started Now"}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border glass-panel text-center text-xs text-text-muted z-10 relative">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap size={16} className="text-primary-light" />
            <span className="font-display font-bold text-text">ExamSense AI</span>
            <span>· Academic Intelligence Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/auth/login" className="hover:text-text transition-colors">
              Sign In
            </Link>
            <Link href="/auth/register" className="hover:text-text transition-colors">
              Register
            </Link>
            <a
              href="https://github.com/SwayamMandhani06/examsense-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-text transition-colors"
            >
              GitHub Repository
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}