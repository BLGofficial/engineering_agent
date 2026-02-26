import { useState, useRef } from "react";
import { Loader2, Download, RotateCcw, Zap, Sparkles, Menu, X } from "lucide-react";

const MASTER_SYSTEM_PROMPT = `You are an elite AI Role Engineering Specialist with 15+ years of expertise in computational linguistics, behavioral AI design, and persona architecture. You create production-ready role-based prompts that transform AI models into highly specialized, contextually appropriate agents.

You follow the B.L.A.S.T. methodology and the Master Role-Based AI Persona Engineering framework precisely.

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
"systemPrompt": "Complete production-ready system prompt following the contract format with ## ROLE, ## SUCCESS CRITERIA, ## CONSTRAINTS, ## UNCERTAINTY HANDLING, ## OUTPUT FORMAT sections",
"userPrompt": "Complete structured user prompt template with ## INSTRUCTIONS, ## CONTEXT, ## TASK, ## OUTPUT FORMAT sections using [PLACEHOLDER] syntax for customizable parts",
"reuseTemplate": "A reusable template version of the user prompt with all variables clearly marked as {{VARIABLE_NAME}} placeholders",
"example1": {
"scenario": "Scenario description",
"input": "Sample user query",
"output": "Ideal response demonstrating role behavior"
},
"example2": {
"scenario": "Different scenario",
"input": "Sample user query",
"output": "Ideal response showing consistency"
},
"evaluatorChecklist": ["Verification question 1", "Verification question 2", "Verification question 3", "Verification question 4"],
"usageNotes": "Platform-specific guidance and iteration tips",
"designRationale": "Explanation of key engineering decisions made for this role"
}

Apply the full framework: multi-dimensional persona construction, behavioral consistency modeling, domain specialization, and production-grade standards. Be thorough and create immediately usable, high-quality prompts.`;

const TABS = ["System Prompt", "User Prompt", "Template", "Examples", "Checklist", "Notes"];

interface RoleData {
  roleName: string;
  coreFunction: string;
  keyAttributes: {
    roleFunction: string;
    expertiseLevel: string;
    tone: string;
    communicationStyle: string;
    coreValues: string;
    domainFocus: string;
  };
  primaryUseCases: string[];
  antiUseCases: string[];
  systemPrompt: string;
  userPrompt: string;
  reuseTemplate: string;
  example1: {
    scenario: string;
    input: string;
    output: string;
  };
  example2: {
    scenario: string;
    input: string;
    output: string;
  };
  evaluatorChecklist: string[];
  usageNotes: string;
  designRationale: string;
}

function Spinner() {
  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6">
      <div className="relative w-12 h-12 sm:w-16 sm:h-16">
        <div className="absolute inset-0 border-4 border-transparent border-t-amber-400 border-r-blue-400 rounded-full animate-spin" />
        <div className="absolute inset-2 border-4 border-transparent border-b-amber-300 rounded-full animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
      </div>
      <p className="text-amber-400 font-mono text-xs sm:text-sm tracking-widest animate-pulse">
        ENGINEERING ROLE…
      </p>
    </div>
  );
}

function CodeBlock({ content, style }: { content: string; style?: React.CSSProperties }) {
  return (
    <pre
      style={style}
      className="bg-slate-950 border border-slate-700/50 rounded-lg p-3 sm:p-5 font-mono text-xs sm:text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words overflow-y-auto max-h-96 shadow-xl hover:border-slate-600/50 transition-colors"
    >
      {content}
    </pre>
  );
}

function ExamplesPanel({ data }: { data: RoleData }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-5">
      {[data.example1, data.example2].map((ex, i) => (
        <div
          key={i}
          className="border border-slate-700/50 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800/30 to-slate-900/30 hover:border-slate-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
        >
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-3 sm:px-5 py-2 sm:py-3 border-b border-slate-700/50">
            <span className="text-amber-400 font-mono text-xs tracking-widest flex items-center gap-2 overflow-hidden">
              <Sparkles size={12} className="flex-shrink-0" />
              <span className="truncate">EXAMPLE {i + 1} — {ex.scenario}</span>
            </span>
          </div>
          <div className="p-3 sm:p-5 flex flex-col gap-3">
            <div>
              <div className="text-amber-400/70 text-xs tracking-widest font-mono mb-2">INPUT</div>
              <div className="text-slate-100 text-xs sm:text-sm leading-relaxed break-words">{ex.input}</div>
            </div>
            <div className="border-t border-slate-700/30 pt-3">
              <div className="text-blue-400/70 text-xs tracking-widest font-mono mb-2">OUTPUT</div>
              <div className="text-slate-200 text-xs sm:text-sm leading-relaxed break-words">{ex.output}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ChecklistPanel({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
          className={`flex items-start gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-300 ${
            checked[i]
              ? "bg-gradient-to-r from-green-950/40 to-emerald-950/40 border-green-700/50 shadow-lg shadow-green-500/10"
              : "bg-slate-800/20 border-slate-700/30 hover:border-slate-600/50 hover:bg-slate-800/30"
          }`}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-300 ${
              checked[i]
                ? "bg-gradient-to-br from-green-400 to-emerald-500 border-green-400 shadow-lg shadow-green-500/50"
                : "border-2 border-slate-600 hover:border-slate-500"
            }`}
          >
            {checked[i] && <span className="text-slate-950 text-xs font-bold">✓</span>}
          </div>
          <span
            className={`text-xs sm:text-sm leading-relaxed transition-all duration-300 break-words ${
              checked[i]
                ? "text-green-300 line-through"
                : "text-slate-200 hover:text-slate-100"
            }`}
          >
            {item}
          </span>
        </div>
      ))}
    </div>
  );
}

async function downloadZip(roleData: RoleData) {
  const script = document.createElement("script");
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
  document.head.appendChild(script);

  await new Promise((r) => {
    script.onload = r;
  });

  const JSZip = (window as any).JSZip;
  const zip = new JSZip();
  const folder = zip.folder(roleData.roleName.replace(/\s+/g, "_"));

  folder.file(
    "system_prompt.md",
    `# ${roleData.roleName} — System Prompt\n\n${roleData.systemPrompt}`
  );
  folder.file(
    "user_prompt.md",
    `# ${roleData.roleName} — User Prompt\n\n${roleData.userPrompt}`
  );
  folder.file(
    "reuse_template.md",
    `# ${roleData.roleName} — Reusable Template\n\n${roleData.reuseTemplate}`
  );
  folder.file(
    "examples.md",
    `# ${roleData.roleName} — Example Interactions\n\n## Example 1: ${roleData.example1.scenario}\n\n**Input:** ${roleData.example1.input}\n\n**Output:** ${roleData.example1.output}\n\n---\n\n## Example 2: ${roleData.example2.scenario}\n\n**Input:** ${roleData.example2.input}\n\n**Output:** ${roleData.example2.output}`
  );
  folder.file(
    "evaluator_checklist.md",
    `# ${roleData.roleName} — Evaluator Checklist\n\n${roleData.evaluatorChecklist
      .map((c, i) => `- [ ] ${c}`)
      .join("\n")}`
  );
  folder.file(
    "usage_notes.md",
    `# ${roleData.roleName} — Usage Notes & Design Rationale\n\n## Usage Notes\n${roleData.usageNotes}\n\n## Design Rationale\n${roleData.designRationale}`
  );
  folder.file(
    "persona_attributes.md",
    `# ${roleData.roleName} — Persona Architecture\n\n## Core Function\n${roleData.coreFunction}\n\n## Key Attributes\n${Object.entries(roleData.keyAttributes)
      .map(([k, v]) => `- **${k}**: ${v}`)
      .join("\n")}\n\n## Primary Use Cases\n${roleData.primaryUseCases
      .map((u) => `- ${u}`)
      .join("\n")}\n\n## Anti-Use Cases\n${roleData.antiUseCases
      .map((u) => `- ${u}`)
      .join("\n")}`
  );
  folder.file("complete_package.json", JSON.stringify(roleData, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${roleData.roleName.replace(/\s+/g, "_")}_role_package.zip`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Home() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("System Prompt");
  const [downloading, setDownloading] = useState(false);
  const [mobileTabOpen, setMobileTabOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setRoleData(null);

    try {
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
              content: `Create a complete role-based AI persona package for the following request:\n\n${input}`,
            },
          ],
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(
          errorData.error?.message || "Failed to generate role"
        );
      }

      const data = await res.json();
      const text = data.content.map((b: any) => b.text || "").join("");
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setRoleData(parsed);
      setActiveTab("System Prompt");
      setMobileTabOpen(false);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to generate role. Please try again."
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!roleData) return;
    setDownloading(true);
    try {
      await downloadZip(roleData);
    } catch (e) {
      console.error(e);
      setError("Failed to download ZIP package");
    } finally {
      setDownloading(false);
    }
  };

  const renderTabContent = () => {
    if (!roleData) return null;
    switch (activeTab) {
      case "System Prompt":
        return <CodeBlock content={roleData.systemPrompt} />;
      case "User Prompt":
        return <CodeBlock content={roleData.userPrompt} />;
      case "Template":
        return <CodeBlock content={roleData.reuseTemplate} />;
      case "Examples":
        return <ExamplesPanel data={roleData} />;
      case "Checklist":
        return <ChecklistPanel items={roleData.evaluatorChecklist} />;
      case "Notes":
        return (
          <div className="flex flex-col gap-3 sm:gap-4">
            <CodeBlock
              content={roleData.usageNotes}
              style={{ maxHeight: "200px" }}
            />
            <div className="text-amber-400/70 text-xs tracking-widest font-mono">
              DESIGN RATIONALE
            </div>
            <CodeBlock
              content={roleData.designRationale}
              style={{ maxHeight: "160px" }}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200 font-sans flex flex-col items-center p-3 sm:p-6 lg:p-8 pb-16 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-amber-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 sm:w-80 sm:h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "10s", animationDelay: "2s" }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.3); }
          50% { box-shadow: 0 0 40px rgba(251, 146, 60, 0.6); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        .animate-pulseGlow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 max-w-3xl relative z-10 animate-slideUp px-2">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-blue-500/10 border border-amber-500/30 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-4 sm:mb-6 backdrop-blur-sm hover:border-amber-500/50 transition-all duration-300">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 animate-pulseGlow" />
          <span className="text-amber-400 font-mono text-xs sm:text-sm tracking-widest">
            SYSTEM ACTIVE
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-slate-50 via-amber-200 to-slate-50 bg-clip-text text-transparent mb-2 sm:mb-3 tracking-tight leading-tight">
          AI Role <span className="text-amber-400">Engineering</span> Agent
        </h1>
        <p className="text-slate-400 text-xs sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto px-2">
          Powered by the Master Role-Based AI Persona Engineering Framework · Generates
          production-ready role packages with precision and elegance
        </p>
      </div>

      {/* Input Card */}
      <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-5 sm:mb-7 shadow-2xl backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300 relative z-10 animate-fadeIn">
        <label className="block font-mono text-xs sm:text-sm text-amber-400 tracking-widest mb-3 sm:mb-4 flex items-center gap-2">
          <Sparkles size={14} />
          ROLE SPECIFICATION INPUT
        </label>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.metaKey) handleGenerate();
          }}
          placeholder={`Describe the AI role you want to engineer...

Examples:
• A senior data scientist who specializes in explaining ML concepts to non-technical executives
• A Socratic philosophy tutor who challenges assumptions and guides discovery
• A bilingual customer support agent for a fintech startup targeting Eastern Europe`}
          className="w-full min-h-32 sm:min-h-40 bg-slate-950/60 border border-slate-700/50 rounded-lg text-slate-100 text-xs sm:text-sm leading-relaxed p-3 sm:p-4 resize-vertical font-sans focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 placeholder-slate-500"
        />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mt-3 sm:mt-4">
          <span className="text-slate-500 text-xs font-mono">
            {input.length} chars · ⌘+Enter to generate
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 ${
              loading || !input.trim()
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105 active:scale-95"
            }`}
          >
            <Zap size={16} />
            {loading ? "GENERATING..." : "ENGINEER ROLE"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl bg-gradient-to-r from-red-950/40 to-rose-950/40 border border-red-700/50 rounded-lg p-3 sm:p-4 text-red-300 text-xs sm:text-sm mb-5 sm:mb-6 backdrop-blur-sm animate-slideUp relative z-10">
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="w-full max-w-2xl bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl p-8 sm:p-12 flex justify-center mb-5 sm:mb-6 backdrop-blur-sm relative z-10 animate-fadeIn">
          <Spinner />
        </div>
      )}

      {/* Results */}
      {roleData && (
        <div className="w-full max-w-2xl animate-slideUp relative z-10 px-2 sm:px-0">
          {/* Role Header Card */}
          <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-7 mb-4 sm:mb-6 shadow-2xl backdrop-blur-sm hover:border-slate-600/50 transition-all duration-300">
            <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div>
                <div className="font-mono text-xs text-amber-400 tracking-widest mb-2 flex items-center gap-2">
                  <Sparkles size={12} />
                  ROLE GENERATED
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 tracking-tight mb-2 break-words">
                  {roleData.roleName}
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl break-words">
                  {roleData.coreFunction}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-full px-2.5 sm:px-3 py-1 text-green-300 text-xs font-mono truncate">
                  {roleData.keyAttributes.expertiseLevel}
                </span>
                <span className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-full px-2.5 sm:px-3 py-1 text-purple-300 text-xs font-mono truncate">
                  {roleData.keyAttributes.domainFocus}
                </span>
                <span className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/50 rounded-full px-2.5 sm:px-3 py-1 text-orange-300 text-xs font-mono truncate">
                  {roleData.keyAttributes.tone}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="text-amber-400/70 text-xs tracking-widest font-mono mb-2 flex items-center gap-2">
                  <span className="text-amber-400">→</span> USE FOR
                </div>
                {roleData.primaryUseCases.slice(0, 3).map((u, i) => (
                  <div key={i} className="text-slate-300 text-xs sm:text-sm mb-1.5 hover:text-amber-300 transition-colors break-words">
                    • {u}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-red-400/70 text-xs tracking-widest font-mono mb-2 flex items-center gap-2">
                  <span className="text-red-400">✕</span> AVOID FOR
                </div>
                {roleData.antiUseCases.map((u, i) => (
                  <div key={i} className="text-slate-400 text-xs sm:text-sm mb-1.5 hover:text-red-300 transition-colors break-words">
                    • {u}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs - Mobile Optimized */}
          <div className="bg-gradient-to-br from-slate-800/40 to-slate-900/40 border border-slate-700/50 rounded-xl sm:rounded-2xl overflow-hidden mb-4 sm:mb-6 backdrop-blur-sm shadow-xl">
            {/* Mobile Tab Selector */}
            <div className="sm:hidden border-b border-slate-700/50 bg-slate-950/30 px-3 py-2">
              <button
                onClick={() => setMobileTabOpen(!mobileTabOpen)}
                className="w-full flex items-center justify-between text-amber-400 font-mono text-xs tracking-widest hover:text-amber-300 transition-colors"
              >
                <span>{activeTab.toUpperCase()}</span>
                {mobileTabOpen ? <X size={16} /> : <Menu size={16} />}
              </button>
              {mobileTabOpen && (
                <div className="mt-2 flex flex-col gap-1">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setMobileTabOpen(false);
                      }}
                      className={`text-left px-3 py-2 rounded text-xs font-mono tracking-widest transition-all ${
                        activeTab === tab
                          ? "bg-amber-500/20 text-amber-400"
                          : "text-slate-500 hover:text-slate-400 hover:bg-slate-800/20"
                      }`}
                    >
                      {tab.toUpperCase()}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Tab Selector */}
            <div className="hidden sm:flex overflow-x-auto border-b border-slate-700/50 bg-slate-950/30">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 lg:px-4 py-2.5 lg:py-3 font-mono text-xs lg:text-sm tracking-widest whitespace-nowrap transition-all duration-300 border-b-2 ${
                    activeTab === tab
                      ? "bg-gradient-to-b from-slate-700/40 to-transparent border-b-amber-400 text-amber-400 shadow-lg shadow-amber-500/10"
                      : "border-b-transparent text-slate-500 hover:text-slate-400 hover:bg-slate-800/20"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-3 sm:p-6">{renderTabContent()}</div>
          </div>

          {/* Download Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-end items-stretch sm:items-center">
            <button
              onClick={() => {
                setRoleData(null);
                setInput("");
                setError(null);
              }}
              className="flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-lg border border-slate-700/50 text-slate-400 text-xs sm:text-sm font-mono tracking-wider hover:border-slate-600/50 hover:text-slate-300 hover:bg-slate-800/20 transition-all duration-300 order-2 sm:order-1"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">NEW ROLE</span>
              <span className="sm:hidden">NEW</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg font-mono text-xs sm:text-sm font-bold tracking-wider transition-all duration-300 order-1 sm:order-2 ${
                downloading
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-700 to-emerald-600 text-white hover:shadow-xl hover:shadow-green-600/40 hover:scale-105 active:scale-95"
              }`}
            >
              <Download size={14} />
              <span className="hidden sm:inline">{downloading ? "PREPARING..." : "DOWNLOAD ZIP PACKAGE"}</span>
              <span className="sm:hidden">{downloading ? "PREP..." : "DOWNLOAD"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
