import { useState, useRef } from "react";
import { Loader2, Download, RotateCcw, Zap } from "lucide-react";

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
    <div className="flex flex-col items-center gap-6">
      <div className="w-14 h-14 border-3 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
      <p className="text-amber-500 font-mono text-xs tracking-widest">
        ENGINEERING ROLE…
      </p>
    </div>
  );
}

function CodeBlock({ content, style }: { content: string; style?: React.CSSProperties }) {
  return (
    <pre
      style={style}
      className="bg-slate-950 border border-slate-800 rounded-lg p-5 font-mono text-xs leading-relaxed text-slate-200 whitespace-pre-wrap break-words overflow-y-auto max-h-96"
    >
      {content}
    </pre>
  );
}

function ExamplesPanel({ data }: { data: RoleData }) {
  return (
    <div className="flex flex-col gap-5">
      {[data.example1, data.example2].map((ex, i) => (
        <div key={i} className="border border-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-900 px-5 py-3 border-b border-slate-800">
            <span className="text-amber-500 font-mono text-xs tracking-widest">
              EXAMPLE {i + 1} — {ex.scenario}
            </span>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div>
              <div className="text-slate-500 text-xs tracking-widest font-mono mb-1">INPUT</div>
              <div className="text-slate-200 text-sm leading-relaxed">{ex.input}</div>
            </div>
            <div>
              <div className="text-slate-500 text-xs tracking-widest font-mono mb-1">OUTPUT</div>
              <div className="text-slate-300 text-sm leading-relaxed">{ex.output}</div>
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
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div
          key={i}
          onClick={() => setChecked((p) => ({ ...p, [i]: !p[i] }))}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
            checked[i]
              ? "bg-slate-900 border-green-900"
              : "bg-slate-950 border-slate-800"
          }`}
        >
          <div
            className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
              checked[i]
                ? "bg-green-600 border-green-600"
                : "border-2 border-slate-600"
            }`}
          >
            {checked[i] && <span className="text-black text-xs font-bold">✓</span>}
          </div>
          <span
            className={`text-sm leading-relaxed transition-all ${
              checked[i]
                ? "text-green-400 line-through"
                : "text-slate-200"
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
  // Dynamically load JSZip
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
          <div className="flex flex-col gap-4">
            <CodeBlock
              content={roleData.usageNotes}
              style={{ maxHeight: "200px" }}
            />
            <div className="text-slate-500 text-xs tracking-widest font-mono">
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
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans flex flex-col items-center p-4 sm:p-8 pb-16">
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 146, 60, 0.13); }
          50% { box-shadow: 0 0 40px rgba(251, 146, 60, 0.26); }
        }
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        .animate-pulseGlow {
          animation: pulseGlow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Header */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 mb-4">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulseGlow" />
          <span className="font-mono text-xs text-slate-500 tracking-widest">
            SYSTEM ACTIVE
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-50 mb-2 tracking-tight">
          AI Role <span className="text-amber-500">Engineering</span> Agent
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Powered by the Master Role-Based AI Persona Engineering Framework · Generates
          production-ready role packages
        </p>
      </div>

      {/* Input Card */}
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 shadow-2xl">
        <label className="block font-mono text-xs text-amber-500 tracking-widest mb-3">
          ◆ ROLE SPECIFICATION INPUT
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
          className="w-full min-h-36 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm leading-relaxed p-4 resize-vertical font-sans focus:border-slate-700 focus:outline-none transition-colors"
        />
        <div className="flex justify-between items-center mt-4">
          <span className="text-slate-600 text-xs font-mono">
            {input.length} chars · ⌘+Enter to generate
          </span>
          <button
            onClick={handleGenerate}
            disabled={loading || !input.trim()}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-all ${
              loading || !input.trim()
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 hover:shadow-lg hover:shadow-amber-500/30"
            }`}
          >
            <Zap size={16} />
            {loading ? "GENERATING..." : "ENGINEER ROLE"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl bg-red-950 border border-red-900 rounded-lg p-4 text-red-300 text-sm mb-6">
          ⚠ {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-12 flex justify-center mb-6">
          <Spinner />
        </div>
      )}

      {/* Results */}
      {roleData && (
        <div className="w-full max-w-2xl animate-fadeIn">
          {/* Role Header Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6 mb-4 shadow-lg">
            <div className="flex justify-between items-start flex-wrap gap-3 mb-4">
              <div>
                <div className="font-mono text-xs text-amber-500 tracking-widest mb-2">
                  ◆ ROLE GENERATED
                </div>
                <h2 className="text-2xl font-bold text-slate-50 tracking-tight">
                  {roleData.roleName}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mt-2 max-w-xl">
                  {roleData.coreFunction}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-green-400 text-xs font-mono">
                  {roleData.keyAttributes.expertiseLevel}
                </span>
                <span className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-purple-400 text-xs font-mono">
                  {roleData.keyAttributes.domainFocus}
                </span>
                <span className="bg-slate-800 border border-slate-700 rounded px-3 py-1 text-orange-400 text-xs font-mono">
                  {roleData.keyAttributes.tone}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-slate-500 text-xs tracking-widest font-mono mb-2">
                  USE FOR
                </div>
                {roleData.primaryUseCases.slice(0, 3).map((u, i) => (
                  <div key={i} className="text-slate-300 text-xs mb-1">
                    <span className="text-amber-500 mr-1">→</span>
                    {u}
                  </div>
                ))}
              </div>
              <div>
                <div className="text-slate-500 text-xs tracking-widest font-mono mb-2">
                  AVOID FOR
                </div>
                {roleData.antiUseCases.map((u, i) => (
                  <div key={i} className="text-slate-400 text-xs mb-1">
                    <span className="text-red-500 mr-1">✕</span>
                    {u}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4">
            <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 font-mono text-xs tracking-widest whitespace-nowrap transition-all border-b-2 ${
                    activeTab === tab
                      ? "bg-slate-900 border-b-amber-500 text-amber-500"
                      : "border-b-transparent text-slate-500 hover:text-slate-400"
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="p-5">{renderTabContent()}</div>
          </div>

          {/* Download */}
          <div className="flex gap-3 justify-end items-center">
            <button
              onClick={() => {
                setRoleData(null);
                setInput("");
                setError(null);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-mono tracking-wider hover:border-slate-700 hover:text-slate-300 transition-all"
            >
              <RotateCcw size={14} />
              NEW ROLE
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-mono text-sm font-bold tracking-wider transition-all ${
                downloading
                  ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-700 to-green-600 text-white hover:shadow-lg hover:shadow-green-600/30"
              }`}
            >
              <Download size={16} />
              {downloading ? "PREPARING..." : "DOWNLOAD ZIP PACKAGE"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
