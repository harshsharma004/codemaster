import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Braces, Code2, Database, Network, Terminal, Cpu,
  ArrowRight, Zap, Trophy, Users, GitBranch, Binary,
  CircuitBoard, ChevronRight,
} from "lucide-react";

function DotBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, #d1d5db 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          opacity: 0.5,
        }}
      />
      {/* Subtle warm glow bottom left */}
      <div
        className="absolute bottom-0 left-0 w-[500px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse at bottom left, rgba(251,191,36,0.12) 0%, transparent 70%)",
        }}
      />
      {/* Subtle glow top right */}
      <div
        className="absolute top-0 right-0 w-[400px] h-[400px]"
        style={{
          background: "radial-gradient(ellipse at top right, rgba(251,191,36,0.08) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// Floating tech badge
function Badge({
  children, style, delay, rotation = 0,
}: {
  children: React.ReactNode;
  style: React.CSSProperties;
  delay: number;
  rotation?: number;
}) {
  return (
    <motion.div
      className="absolute z-20 font-black text-sm md:text-base px-4 py-2 rounded-xl shadow-lg select-none"
      style={{
        ...style,
        transform: `rotate(${rotation}deg)`,
      }}
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 3.5 + delay, repeat: Infinity, ease: "easeInOut", delay }}
    >
      {children}
    </motion.div>
  );
}

// Squiggly hand-drawn accent (SVG)
function Squiggle({ className }: { className?: string }) {
  return (
    <svg className={className} width="48" height="24" viewBox="0 0 48 24" fill="none">
      <path d="M2 18 C8 6, 16 6, 22 12 S36 22, 46 8" stroke="#111" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Tick marks accent
function TickMark({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="32" viewBox="0 0 20 32" fill="none">
      <path d="M10 2 L4 16 M10 2 L16 16" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 14 L4 28 M10 14 L16 28" stroke="#111" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function FeatureCard({
  icon: Icon, title, desc, accent, delay, link
}: {
  icon: React.ElementType; title: string; desc: string; accent: string; delay: number; link?: string;
}) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ y: -4, boxShadow: "0 12px 40px rgba(0,0,0,0.1)" }}
      className={`group rounded-2xl p-6 bg-white border border-gray-200 transition-all duration-300 h-full flex flex-col ${link ? "cursor-pointer" : "cursor-default"}`}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
        style={{ background: accent + "18", border: `1.5px solid ${accent}40` }}
      >
        <Icon className="w-5 h-5" style={{ color: accent }} strokeWidth={1.8} />
      </div>
      <h3 className="text-black font-black text-base mb-2 tracking-tight">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );

  if (link) {
    return <Link to={link} className="block h-full">{content}</Link>;
  }
  return content;
}

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans overflow-x-hidden" style={{ background: "#F7F7F5", color: "#111111" }}>
      <DotBackground />

      {/* ── Navbar ── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4"
        style={{ background: "#111111" }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-yellow-400 flex items-center justify-center">
            <Binary className="w-4 h-4 text-black" strokeWidth={2.5} />
          </div>
          <span className="font-black text-white tracking-tight text-lg">CodeMaster</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-gray-400">
          <a href="#" className="hover:text-white transition-colors duration-200">Home</a>
          <a href="#features" className="hover:text-white transition-colors duration-200">Features</a>
          <Link to="/companies" className="hover:text-white transition-colors duration-200">Companies</Link>
          <Link to="/system-design" className="hover:text-white transition-colors duration-200">System Design</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/auth">
            <button className="px-4 py-2 rounded-lg text-[13px] font-bold text-white border border-white/20 hover:border-white/50 transition-colors">
              Log In
            </button>
          </Link>
          <Link to="/auth">
            <button
              className="px-4 py-2 rounded-lg text-[13px] font-black text-black transition-all duration-200 hover:scale-105"
              style={{ background: "#FBBF24" }}
            >
              Sign Up
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-24 pb-8 overflow-hidden">

        {/* Floating tech badges */}
        <Badge style={{ top: "22%", left: "6%", background: "#FBBF24", color: "#111" }} delay={0} rotation={-6}>
          C++
        </Badge>
        <Badge style={{ top: "30%", right: "5%", background: "#FBBF24", color: "#111" }} delay={0.6} rotation={5}>
          DSA
        </Badge>
        <Badge style={{ top: "55%", right: "8%", background: "white", color: "#111", border: "2px solid #e5e7eb" }} delay={1.2} rotation={-3}>
          System Design
        </Badge>
        <Badge style={{ top: "58%", left: "5%", background: "white", color: "#111", border: "2px solid #e5e7eb" }} delay={0.9} rotation={4}>
          {"{ }"}
        </Badge>
        <Badge style={{ top: "68%", left: "18%", background: "#111", color: "#FBBF24" }} delay={1.5} rotation={-2}>
          &lt;/&gt;
        </Badge>

        {/* Hand-drawn accents */}
        <Squiggle className="absolute top-[20%] right-[18%] opacity-40 hidden md:block" />
        <TickMark className="absolute top-[18%] left-[32%] opacity-30 hidden md:block" />
        <TickMark className="absolute top-[24%] right-[30%] opacity-25 hidden md:block" />

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full mb-7 text-[12px] font-bold"
          style={{ background: "white", border: "1.5px solid #e5e7eb", color: "#555" }}
        >
          <span>⚡</span> Your Competitive Programming Arena
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center max-w-3xl mx-auto mb-6"
        >
          <h1 className="text-5xl md:text-[72px] font-black tracking-tight leading-[1.0] text-black">
            Master{" "}
            <span
              className="inline-block px-3 py-1 rounded-lg"
              style={{ background: "#FBBF24" }}
            >
              Algorithms.
            </span>
            <br />
            <span
              className="inline-block px-3 py-1 rounded-lg mt-2"
              style={{ background: "#FBBF24" }}
            >
              Outcode
            </span>{" "}
            Everyone.
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-gray-500 text-base md:text-lg text-center max-w-lg mb-10 leading-relaxed"
        >
          Master modern DSA by practicing what matters — clean logic, real contest problems, and data structure visualization that builds intuition.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex items-center gap-4 mb-16"
        >
          <Link to="/auth">
            <button
              className="px-7 py-3.5 rounded-xl text-[15px] font-black text-black transition-all duration-200 hover:scale-105 hover:shadow-xl"
              style={{ background: "#FBBF24", boxShadow: "0 4px 20px rgba(251,191,36,0.4)" }}
            >
              Start Learning
            </button>
          </Link>
          <Link to="/visualize">
            <button
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-black text-white transition-all duration-200 hover:scale-105"
              style={{ background: "#111111" }}
            >
              View Visualizer <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>

        {/* Hero visual — mock code window */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="relative w-full max-w-2xl mx-auto"
        >
          {/* Window chrome */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ border: "2px solid #e5e7eb", background: "#1a1a2e" }}
          >
            {/* Title bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10" style={{ background: "#111" }}>
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs font-mono text-gray-500">trie_quest.cpp</span>
            </div>
            {/* Code body with grid bg */}
            <div
              className="p-6 font-mono text-sm"
              style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            >
              <div className="text-gray-500 mb-1"><span className="text-purple-400">class</span> <span className="text-yellow-400">TrieNode</span> {"{"}</div>
              <div className="text-gray-500 ml-4 mb-1"><span className="text-blue-400">map</span>{"<char, TrieNode*> "}<span className="text-white">children</span>;</div>
              <div className="text-gray-500 ml-4 mb-3"><span className="text-blue-400">bool</span> <span className="text-white">isEnd</span> = <span className="text-orange-400">false</span>;</div>
              <div className="text-gray-500 mb-1">{"}"}</div>
              <div className="mt-4 flex items-center gap-2">
                <span
                  className="px-3 py-1 rounded text-xs font-black text-black"
                  style={{ background: "#FBBF24" }}
                >
                  O(n) insert
                </span>
                <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ background: "#6366F1" }}>
                  O(n) search
                </span>
                <span className="px-3 py-1 rounded text-xs font-bold text-white" style={{ background: "#10B981" }}>
                  prefix match ✓
                </span>
              </div>

              {/* Animated cursor */}
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block w-2 h-5 ml-1 mt-3 align-middle"
                style={{ background: "#FBBF24" }}
              />
            </div>
          </div>

          {/* Floating stat pills on top of window */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -right-8 hidden md:flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg font-black text-sm"
            style={{ background: "white", border: "2px solid #e5e7eb" }}
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            #1 on leaderboard
          </motion.div>

          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -bottom-4 -left-8 hidden md:flex items-center gap-2 px-4 py-2 rounded-xl shadow-lg font-black text-sm"
            style={{ background: "white", border: "2px solid #e5e7eb" }}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            2,400+ members
          </motion.div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative max-w-6xl mx-auto px-6 py-24">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-1 w-8 rounded-full bg-yellow-400" />
          <span className="text-[11px] font-black tracking-widest uppercase text-gray-400">What you get</span>
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-black text-black tracking-tight mb-12"
        >
          Everything a serious <br />
          <span className="inline-block px-2 rounded-lg" style={{ background: "#FBBF24" }}>
            programmer needs.
          </span>
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FeatureCard icon={Zap} title="Live Visualizer" accent="#FBBF24" delay={0} link="/visualize" desc="Step through sorting, graph traversal, and tree operations frame by frame. Build real intuition, not just pattern recognition." />
          <FeatureCard icon={Trophy} title="Group Challenges" accent="#6366F1" delay={0.08} link="/challenges" desc="Create private arenas, invite friends, and race to solve problem sets. Leaderboards update in real time." />
          <FeatureCard icon={Users} title="Company Tracks" accent="#10B981" delay={0.16} link="/companies" desc="Curated lists from FAANG and top startups, tagged by topic and difficulty so your prep maps to the interview." />
          <FeatureCard icon={Network} title="Graph Playground" accent="#F87171" delay={0.24} link="/visualize/bfs-grid" desc="Run BFS, DFS, and Dijkstra on custom graphs you build. Watch the frontier expand live." />
          <FeatureCard icon={Database} title="System Design" accent="#38BDF8" delay={0.32} link="/system-design" desc="Go beyond algorithms with guided system design — caching, load balancing, distributed consensus." />
          <FeatureCard icon={Terminal} title="Test Generator" accent="#A78BFA" delay={0.40} link="/test-generator" desc="Auto-generate edge-case inputs for any problem. Stop failing on corner cases you didn't think to test." />
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="relative max-w-4xl mx-auto px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: "#111111" }}
        >
          {/* Yellow glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 60% 80% at 50% 100%, rgba(251,191,36,0.15) 0%, transparent 70%)" }}
          />
          <span className="text-[11px] font-black tracking-widest uppercase text-yellow-400 block mb-4">
            Free to start · No credit card
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">
            Ready to{" "}
            <span className="px-2 rounded-lg text-black" style={{ background: "#FBBF24" }}>
              level up?
            </span>
          </h2>
          <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
            Join thousands of programmers sharpening their edge on CodeMaster — every day.
          </p>
          <Link to="/auth">
            <button
              className="inline-flex items-center gap-2 px-10 py-4 rounded-xl text-[15px] font-black text-black transition-all duration-200 hover:scale-105"
              style={{ background: "#FBBF24", boxShadow: "0 0 40px rgba(251,191,36,0.3)" }}
            >
              Create free account <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-yellow-400 flex items-center justify-center">
              <Binary className="w-3.5 h-3.5 text-black" strokeWidth={2.5} />
            </div>
            <span className="font-black text-black text-sm tracking-tight">CodeMaster</span>
          </div>
          <span className="text-gray-400 text-xs font-mono">© {new Date().getFullYear()} CodeMaster. Built for programmers.</span>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link to="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-black transition-colors">Terms</Link>
            <a href="https://github.com/harshsharma004" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}