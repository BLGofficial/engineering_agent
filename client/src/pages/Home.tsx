import { useState, useRef, useEffect } from "react";
import {
  Loader2,
  Download,
  RotateCcw,
  Zap,
  Sparkles,
  Copy,
  Check,
  ChevronRight,
  Settings,
  Clock,
  Trash2,
} from "lucide-react";

const MASTER_SYSTEM_PROMPT = `You are an elite AI Role Engineering Specialist with 15+ years of expertise in computational linguistics, behavioral AI design, and persona architecture. You create production-ready role-based prompts that transform AI models into highly specialized, contextually appropriate agents.

When given a role request, you MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text) in this exact structure:

{
"roleName": "Descriptive role identifier",
"coreFunction": "1-3 sentence summary of what this role does",
"keyAttributes": {
"roleFunction": "value",
"expertiseLevel": "value",
"tone": "value",
"communicationStyle": "value",
"coreValues": "value",
"domainFocus": "value"
},
"primaryUseCases": ["use case 1", "use case 2", "use case 3"],
"antiUseCases": ["what NOT to use for 1", "what NOT to use for 2"],
"systemPrompt": "Complete production-ready system prompt",
"userPrompt": "Complete structured user prompt template",
"reuseTemplate": "Reusable template version with {{VARIABLE_NAME}} placeholders",
"example1": {"scenario": "Scenario", "input": "Sample query", "output": "Response"},
"example2": {"scenario": "Scenario", "input": "Sample query", "output": "Response"},
"evaluatorChecklist": ["Question 1", "Question 2", "Question 3"],
"usageNotes": "Platform-specific guidance",
"designRationale": "Explanation of key decisions"
}`;

interface RoleData {
  roleName: string;
  coreFunction: string;
  keyAttributes: Record<string, string>;
  primaryUseCases: string[];
  antiUseCases: string[];
  systemPrompt: string;
  userPrompt: string;
  reuseTemplate: string;
  example1: { scenario: string; input: string; output: string };
  example2: { scenario: string; input: string; output: string };
  evaluatorChecklist: string[];
  usageNotes: string;
  designRationale: string;
}

interface RecentPersona {
  id: string;
  name: string;
  topic: string;
  timestamp: number;
  data: RoleData;
}

function GlassCard({ children, className = "", glow = false, style }: { children: React.ReactNode; className?: string; glow?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      style={style}
      className={`bg-white/8 backdrop-blur-2xl border border-amber-400/30 rounded-2xl shadow-2xl transition-all duration-500 hover:border-amber-400/60 hover:bg-white/12 hover:shadow-2xl ${
        glow ? "animate-glow-pulse" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

function PipelineStep({
  label,
  status,
}: {
  label: string;
  status: "pending" | "active" | "complete";
}) {
  return (
    <div className="flex items-center gap-3 animate-fade-in">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-500 ${
          status === "complete"
            ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-amber-950 shadow-lg shadow-amber-400/50 animate-pulse-glow"
            : status === "active"
              ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white animate-pulse-glow"
              : "bg-amber-950/40 text-amber-300/60 border border-amber-400/20"
        }`}
      >
        {status === "complete" ? "✓" : status === "active" ? "●" : "○"}
      </div>
      <span
        className={`text-xs font-semibold transition-all duration-500 ${
          status === "complete"
            ? "text-amber-300"
            : status === "active"
              ? "text-orange-300 font-bold"
              : "text-amber-200/50"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:bg-amber-400/20 rounded-lg transition-all duration-300 hover:scale-110 active:scale-95"
      title="Copy to clipboard"
    >
      {copied ? (
        <Check size={16} className="text-amber-300 animate-bounce-in" />
      ) : (
        <Copy size={16} className="text-amber-200/70 hover:text-amber-300 transition-colors" />
      )}
    </button>
  );
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [recentPersonas, setRecentPersonas] = useState<RecentPersona[]>([]);
  const [pipelineStep, setPipelineStep] = useState<"idle" | "received" | "generating" | "review" | "ready">("idle");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load recent personas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentPersonas");
    if (saved) {
      setRecentPersonas(JSON.parse(saved));
    }
  }, []);

  const savePersona = (data: RoleData, topic: string) => {
    const newPersona: RecentPersona = {
      id: Date.now().toString(),
      name: data.roleName,
      topic,
      timestamp: Date.now(),
      data,
    };
    const updated = [newPersona, ...recentPersonas].slice(0, 5);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const deletePersona = (id: string) => {
    const updated = recentPersonas.filter((p) => p.id !== id);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setRoleData(null);
    setPipelineStep("received");

    try {
      setPipelineStep("generating");
      const apiKey = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
      const apiUrl = import.meta.env.VITE_FRONTEND_FORGE_API_URL;

      if (!apiKey || !apiUrl) {
        throw new Error("API configuration missing");
      }

      const res = await fetch(`${apiUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: MASTER_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: `Create a complete role-based AI persona package for: ${input}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Failed to generate role");
      }

      const data = await res.json();
      const text = data.content.map((b: any) => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRoleData(parsed);
      savePersona(parsed, input);
      setPipelineStep("ready");
      setCheckedItems({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate role");
      setPipelineStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!roleData) return;
    setDownloading(true);
    try {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      document.head.appendChild(script);

      await new Promise((r) => {
        script.onload = r;
      });

      const JSZip = (window as any).JSZip;
      const zip = new JSZip();
      const folder = zip.folder(roleData.roleName.replace(/\s+/g, "_"));

      folder.file("system_prompt.md", `# ${roleData.roleName} — System Prompt\n\n${roleData.systemPrompt}`);
      folder.file("user_prompt.md", `# ${roleData.roleName} — User Prompt\n\n${roleData.userPrompt}`);
      folder.file("reuse_template.md", `# ${roleData.roleName} — Reusable Template\n\n${roleData.reuseTemplate}`);
      folder.file("examples.md", `# Examples\n\n${roleData.example1.scenario}\n\n${roleData.example1.input}\n\n${roleData.example1.output}`);
      folder.file("evaluator_checklist.md", `# Checklist\n\n${roleData.evaluatorChecklist.map((c) => `- [ ] ${c}`).join("\n")}`);
      folder.file("usage_notes.md", `# Usage\n\n${roleData.usageNotes}`);
      folder.file("persona_attributes.md", `# Attributes\n\n${JSON.stringify(roleData.keyAttributes, null, 2)}`);
      folder.file("complete_package.json", JSON.stringify(roleData, null, 2));

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roleData.roleName.replace(/\s+/g, "_")}_role_package.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("Failed to download ZIP package");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-950 via-amber-900 to-amber-950 text-white font-sans overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: "10s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-orange-400/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDuration: "12s", animationDelay: "4s" }} />
      </div>

      <style>{`
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.3), inset 0 0 20px rgba(251, 146, 60, 0.1); }
          50% { box-shadow: 0 0 40px rgba(251, 146, 60, 0.6), inset 0 0 30px rgba(251, 146, 60, 0.2); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 10px rgba(251, 146, 60, 0.5), 0 0 20px rgba(251, 146, 60, 0.3); }
          50% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.8), 0 0 40px rgba(251, 146, 60, 0.5); }
        }
        @keyframes bounce-in {
          0% { opacity: 0; transform: scale(0.5); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 200% center; }
          50% { background-position: -200% center; }
        }
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }
        .animate-bounce-in {
          animation: bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
        }
      `}</style>

      <div className="relative z-10 flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r border-amber-400/20 bg-gradient-to-b from-amber-950/90 to-amber-900/90 backdrop-blur-xl flex flex-col overflow-y-auto animate-slide-up">
          {/* Logo/Header */}
          <div className="p-6 border-b border-amber-400/20">
            <div className="flex items-center gap-3 mb-2 animate-fade-in">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-400/50 animate-pulse-glow">
                <Sparkles size={20} className="text-amber-950" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">AI Engineer</div>
                <div className="text-xs text-amber-300">v1.0</div>
              </div>
            </div>
          </div>

          {/* AI Engineer Card */}
          <div className="p-4 m-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <GlassCard className="p-4 glow" glow>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-400/50 animate-pulse-glow" />
                <div className="flex-1">
                  <div className="text-xs font-bold text-white">AI Engineer</div>
                  <div className="text-xs text-amber-200">Active</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse-glow" />
                <span className="text-amber-200 font-semibold">System Ready</span>
              </div>
            </GlassCard>
          </div>

          {/* Recent Personas */}
          <div className="flex-1 px-4 py-6 border-t border-amber-400/20">
            <div className="text-xs font-bold text-amber-300 mb-3 flex items-center gap-2">
              <Clock size={14} />
              RECENT PERSONAS
            </div>
            <div className="space-y-2">
              {recentPersonas.map((persona, idx) => (
                <div
                  key={persona.id}
                  className="group p-3 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 transition-all duration-300 cursor-pointer relative animate-fade-in hover:shadow-lg hover:shadow-amber-400/30"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                  onClick={() => {
                    setRoleData(persona.data);
                    setInput(persona.topic);
                    setPipelineStep("ready");
                  }}
                >
                  <div className="text-xs font-semibold text-white truncate pr-6">{persona.name}</div>
                  <div className="text-xs text-amber-200/70 truncate">{persona.topic}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePersona(persona.id);
                    }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  >
                    <Trash2 size={12} className="text-amber-300/60 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-amber-400/20">
            <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 transition-all duration-300 text-xs font-semibold text-amber-200 hover:text-white hover:shadow-lg hover:shadow-amber-400/30">
              <Settings size={14} />
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 border-b border-amber-400/20 bg-gradient-to-r from-amber-950/80 to-amber-900/80 backdrop-blur-xl flex items-center px-8 justify-between animate-slide-up">
            <div>
              <h1 className="text-2xl font-bold text-white">Role Engineering Studio</h1>
              <p className="text-xs text-amber-200/70">Master Framework Powered</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-xs text-amber-200/70">Status</div>
                <div className="text-sm font-bold text-amber-300 animate-pulse-glow">Ready</div>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Input Section */}
              <GlassCard className="p-8 animate-slide-up" glow>
                <label className="block text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-300 animate-pulse-glow" />
                  DESCRIBE YOUR ROLE
                </label>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.metaKey) handleGenerate();
                  }}
                  placeholder="A senior data scientist who explains ML concepts to non-technical executives..."
                  className="w-full min-h-32 bg-amber-950/60 border border-amber-400/30 rounded-xl text-white text-sm p-4 focus:border-amber-300/60 focus:outline-none focus:ring-2 focus:ring-amber-400/30 transition-all placeholder-amber-200/40"
                />
                <div className="flex justify-between items-center mt-4">
                  <span className="text-xs text-amber-200/60">{input.length} characters</span>
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !input.trim()}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                      loading || !input.trim()
                        ? "bg-amber-950/60 text-amber-200/40 cursor-not-allowed"
                        : "bg-gradient-to-r from-amber-500 to-yellow-500 text-amber-950 hover:shadow-2xl hover:shadow-amber-400/50 hover:scale-105 active:scale-95 animate-pulse-glow"
                    }`}
                  >
                    <Zap size={16} />
                    {loading ? "GENERATING..." : "ENGINEER ROLE"}
                  </button>
                </div>
              </GlassCard>

              {/* Error */}
              {error && (
                <GlassCard className="p-4 border-red-500/50 bg-red-500/15 animate-slide-up">
                  <p className="text-sm text-red-200">⚠ {error}</p>
                </GlassCard>
              )}

              {/* Loading */}
              {loading && (
                <GlassCard className="p-12 flex justify-center animate-slide-up" glow>
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
                    <p className="text-sm text-amber-200 font-semibold">Engineering your role...</p>
                  </div>
                </GlassCard>
              )}

              {/* Pipeline Tracker */}
              {roleData && (
                <GlassCard className="p-6 animate-slide-up" glow>
                  <div className="text-xs font-bold text-amber-300 mb-4">GENERATION PIPELINE</div>
                  <div className="flex items-center justify-between">
                    <PipelineStep label="Topic Received" status={pipelineStep !== "idle" ? "complete" : "pending"} />
                    <ChevronRight size={16} className="text-amber-400/50" />
                    <PipelineStep label="Prompts Generating" status={pipelineStep === "ready" ? "complete" : pipelineStep === "generating" ? "active" : "pending"} />
                    <ChevronRight size={16} className="text-amber-400/50" />
                    <PipelineStep label="Awaiting Review" status={pipelineStep === "ready" ? "complete" : "pending"} />
                    <ChevronRight size={16} className="text-amber-400/50" />
                    <PipelineStep label="Ready to Export" status={pipelineStep === "ready" ? "active" : "pending"} />
                  </div>
                </GlassCard>
              )}

              {/* Results */}
              {roleData && (
                <>
                  {/* Role Header */}
                  <GlassCard className="p-8 animate-slide-up" glow>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{roleData.roleName}</h2>
                        <p className="text-amber-100 text-sm leading-relaxed max-w-2xl">{roleData.coreFunction}</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-amber-400/25 border border-amber-400/50 text-amber-200 text-xs font-semibold animate-pulse-glow">
                          {roleData.keyAttributes.expertiseLevel}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-400/40 text-yellow-200 text-xs font-semibold animate-pulse-glow">
                          {roleData.keyAttributes.tone}
                        </span>
                      </div>
                    </div>
                  </GlassCard>

                  {/* System Prompt Preview */}
                  <GlassCard className="p-6 animate-slide-up" glow>
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        SYSTEM PROMPT
                      </label>
                      <CopyButton text={roleData.systemPrompt} />
                    </div>
                    <pre className="bg-amber-950/60 border border-amber-400/30 rounded-lg p-4 text-xs text-amber-100 overflow-x-auto max-h-64 font-mono leading-relaxed">
                      {roleData.systemPrompt}
                    </pre>
                  </GlassCard>

                  {/* Bento Grid - Template Outputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* User Message Template */}
                    <GlassCard className="p-6 animate-slide-up" glow style={{ animationDelay: "0.1s" }}>
                      <label className="text-sm font-bold text-white mb-4 block flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        USER MESSAGE TEMPLATE
                      </label>
                      <pre className="bg-amber-950/60 border border-amber-400/30 rounded-lg p-4 text-xs text-amber-100 overflow-x-auto max-h-48 font-mono leading-relaxed">
                        {roleData.userPrompt}
                      </pre>
                    </GlassCard>

                    {/* Reusable Template */}
                    <GlassCard className="p-6 animate-slide-up" glow style={{ animationDelay: "0.15s" }}>
                      <label className="text-sm font-bold text-white mb-4 block flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        REUSABLE TEMPLATE
                      </label>
                      <pre className="bg-amber-950/60 border border-amber-400/30 rounded-lg p-4 text-xs text-amber-100 overflow-x-auto max-h-48 font-mono leading-relaxed">
                        {roleData.reuseTemplate}
                      </pre>
                    </GlassCard>

                    {/* Example Exchanges */}
                    <GlassCard className="p-6 lg:col-span-2 animate-slide-up" glow style={{ animationDelay: "0.2s" }}>
                      <label className="text-sm font-bold text-white mb-4 block flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        EXAMPLE EXCHANGES
                      </label>
                      <div className="space-y-4">
                        {[roleData.example1, roleData.example2].map((ex, i) => (
                          <div key={i} className="bg-amber-950/60 border border-amber-400/30 rounded-lg p-4 hover:border-amber-400/60 transition-all duration-300">
                            <div className="text-xs font-bold text-amber-300 mb-2">{ex.scenario}</div>
                            <div className="text-xs text-amber-100 mb-2">
                              <span className="text-amber-300 font-semibold">Input:</span> {ex.input}
                            </div>
                            <div className="text-xs text-amber-100">
                              <span className="text-amber-300 font-semibold">Output:</span> {ex.output}
                            </div>
                          </div>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Evaluator Checklist */}
                    <GlassCard className="p-6 animate-slide-up" glow style={{ animationDelay: "0.25s" }}>
                      <label className="text-sm font-bold text-white mb-4 block flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        EVALUATOR CHECKLIST
                      </label>
                      <div className="space-y-2">
                        {roleData.evaluatorChecklist.map((item, i) => (
                          <label key={i} className="flex items-start gap-3 cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checkedItems[i] || false}
                              onChange={(e) => setCheckedItems((p) => ({ ...p, [i]: e.target.checked }))}
                              className="mt-1 w-4 h-4 rounded border-amber-400/50 bg-amber-950/60 accent-amber-400 cursor-pointer"
                            />
                            <span className="text-xs text-amber-100 group-hover:text-white transition-colors duration-300">
                              {item}
                            </span>
                          </label>
                        ))}
                      </div>
                    </GlassCard>

                    {/* Usage Notes */}
                    <GlassCard className="p-6 animate-slide-up" glow style={{ animationDelay: "0.3s" }}>
                      <label className="text-sm font-bold text-white mb-4 block flex items-center gap-2">
                        <Sparkles size={14} className="text-amber-300 animate-pulse-glow" />
                        USAGE NOTES
                      </label>
                      <p className="text-xs text-amber-100 leading-relaxed max-h-32 overflow-y-auto">
                        {roleData.usageNotes}
                      </p>
                    </GlassCard>
                  </div>

                  {/* Export Card */}
                  <GlassCard className="p-8 border-amber-300/50 bg-gradient-to-r from-amber-400/20 to-yellow-400/10 animate-slide-up" glow>
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">Ready to Export</h3>
                        <p className="text-sm text-amber-100">Your complete role package is ready for download</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 animate-pulse-glow shadow-lg shadow-amber-400/50" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {["system_prompt.md", "user_prompt.md", "reuse_template.md", "examples.md", "evaluator_checklist.md", "usage_notes.md", "persona_attributes.md", "complete_package.json"].map((file) => (
                        <div key={file} className="text-center">
                          <div className="text-xs text-amber-300 mb-1 font-semibold">✓</div>
                          <div className="text-xs font-medium text-amber-100 truncate">{file}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setRoleData(null);
                          setInput("");
                          setError(null);
                          setPipelineStep("idle");
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-amber-400/40 text-amber-200 text-sm font-bold hover:bg-amber-400/15 transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/30 hover:scale-105 active:scale-95"
                      >
                        <RotateCcw size={16} />
                        NEW ROLE
                      </button>
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                          downloading
                            ? "bg-amber-950/60 text-amber-200/40 cursor-not-allowed"
                            : "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:shadow-2xl hover:shadow-amber-400/50 hover:scale-105 active:scale-95 animate-pulse-glow"
                        }`}
                      >
                        <Download size={16} />
                        {downloading ? "PREPARING..." : "DOWNLOAD ZIP PACKAGE"}
                      </button>
                    </div>
                  </GlassCard>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
