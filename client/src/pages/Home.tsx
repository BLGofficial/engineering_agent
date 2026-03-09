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
  Menu,
  X,
  Search,
  FileJson,
  FileText,
  Package,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const MASTER_SYSTEM_PROMPT = "You are an elite AI Role Engineering Specialist with 15+ years of expertise in computational linguistics, behavioral AI design, and persona architecture. You create production-ready role-based prompts that transform AI models into highly specialized, contextually appropriate agents. When given a role request, you MUST respond with ONLY a valid JSON object (no markdown, no backticks, no extra text) in this exact structure: {\"roleName\": \"Descriptive role identifier\", \"coreFunction\": \"1-3 sentence summary of what this role does\", \"keyAttributes\": {\"roleFunction\": \"value\", \"expertiseLevel\": \"value\", \"tone\": \"value\", \"communicationStyle\": \"value\", \"coreValues\": \"value\", \"domainFocus\": \"value\"}, \"primaryUseCases\": [\"use case 1\", \"use case 2\", \"use case 3\"], \"antiUseCases\": [\"what NOT to use for 1\", \"what NOT to use for 2\"], \"systemPrompt\": \"Complete production-ready system prompt\", \"userPrompt\": \"Complete structured user prompt template\", \"reuseTemplate\": \"Reusable template version with {{VARIABLE_NAME}} placeholders\", \"example1\": {\"scenario\": \"Scenario\", \"input\": \"Sample query\", \"output\": \"Response\"}, \"example2\": {\"scenario\": \"Scenario\", \"input\": \"Sample query\", \"output\": \"Response\"}, \"evaluatorChecklist\": [\"Question 1\", \"Question 2\", \"Question 3\"], \"usageNotes\": \"Platform-specific guidance\", \"designRationale\": \"Explanation of key decisions\"}";

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

type ExportFormat = "zip" | "json" | "markdown";
type TabType = "system" | "templates" | "examples" | "checklist" | "notes";

export default function Home() {
  const [input, setInput] = useState("");
  const [roleData, setRoleData] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recentPersonas, setRecentPersonas] = useState<RecentPersona[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState("kimi-k2");
  const [activeTab, setActiveTab] = useState<TabType>("system");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("zip");
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});
  const [pipelineStep, setPipelineStep] = useState<"idle" | "received" | "generating" | "review" | "ready">("idle");

  const generateRoleMutation = trpc.roleEngine.generate.useMutation();
  const modelsQuery = trpc.roleEngine.listModels.useQuery();

  // Load recent personas from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentPersonas");
    if (saved) {
      try {
        setRecentPersonas(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load recent personas:", e);
      }
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
    const updated = [newPersona, ...recentPersonas].slice(0, 10);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const deletePersona = (id: string) => {
    const updated = recentPersonas.filter((p) => p.id !== id);
    setRecentPersonas(updated);
    localStorage.setItem("recentPersonas", JSON.stringify(updated));
  };

  const filteredPersonas = recentPersonas.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setRoleData(null);
    setPipelineStep("received");

    try {
      setPipelineStep("generating");

      const result = await generateRoleMutation.mutateAsync({
        topic: input,
        masterPrompt: MASTER_SYSTEM_PROMPT,
        model: selectedModel as "kimi-k2" | "llama-3.3" | "gemma2-9b" | "deepseek-r1",
      });

      if (result.success && result.data) {
        setRoleData(result.data);
        savePersona(result.data, input);
        setPipelineStep("ready");
        setCheckedItems({});
        setActiveTab("system");
      } else {
        throw new Error("Failed to generate role");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate role");
      setPipelineStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!roleData) return;

    const files: Record<string, string> = {
      "system_prompt.md": roleData.systemPrompt,
      "user_prompt.md": roleData.userPrompt,
      "reuse_template.md": roleData.reuseTemplate,
      "examples.md": `# Examples\n\n## Example 1\n**Scenario:** ${roleData.example1.scenario}\n\n**Input:** ${roleData.example1.input}\n\n**Output:** ${roleData.example1.output}\n\n## Example 2\n**Scenario:** ${roleData.example2.scenario}\n\n**Input:** ${roleData.example2.input}\n\n**Output:** ${roleData.example2.output}`,
      "evaluator_checklist.md": `# Evaluator Checklist\n\n${roleData.evaluatorChecklist.map((item) => `- [ ] ${item}`).join("\n")}`,
      "usage_notes.md": roleData.usageNotes,
      "persona_attributes.md": `# Persona Attributes\n\n${Object.entries(roleData.keyAttributes).map(([key, value]) => `- **${key}:** ${value}`).join("\n")}`,
      "complete_package.json": JSON.stringify(roleData, null, 2),
    };

    if (exportFormat === "zip") {
      // Create ZIP file (simplified - in production use a library)
      const content = Object.entries(files)
        .map(([name, content]) => `${name}:\n${content}\n\n---\n\n`)
        .join("");
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roleData.roleName.replace(/\s+/g, "_")}_package.txt`;
      a.click();
    } else if (exportFormat === "json") {
      const blob = new Blob([JSON.stringify(roleData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roleData.roleName.replace(/\s+/g, "_")}.json`;
      a.click();
    } else if (exportFormat === "markdown") {
      const markdown = `# ${roleData.roleName}\n\n${roleData.coreFunction}\n\n## System Prompt\n\n${roleData.systemPrompt}\n\n## User Prompt\n\n${roleData.userPrompt}`;
      const blob = new Blob([markdown], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${roleData.roleName.replace(/\s+/g, "_")}.md`;
      a.click();
    }
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progressPercent = roleData ? (checkedCount / roleData.evaluatorChecklist.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-hidden">
      {/* Grid overlay and ambient orbs */}
      <div className="grid-overlay" />
      <div className="orb-1" />
      <div className="orb-2" />

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <div
          className={`fixed sm:static inset-y-0 left-0 w-64 bg-[#0F0F0F]/80 backdrop-blur-xl border-r border-orange-500/20 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } sm:translate-x-0 flex flex-col`}
        >
          {/* AI Engineer Card */}
          <div className="p-4 border-b border-orange-500/20">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <div className="font-bold text-sm">AI Engineer</div>
                <div className="text-xs text-orange-400">Active</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-orange-300">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              System Ready
            </div>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-orange-500/20">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-orange-400/50" />
              <input
                type="text"
                placeholder="Search personas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#1A1A1A] border border-orange-500/20 rounded-lg text-xs focus:outline-none focus:border-orange-500/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-2.5 text-orange-400/50 hover:text-orange-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="text-xs text-orange-300/60 mt-2">{filteredPersonas.length}/10</div>
          </div>

          {/* Recent Personas */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-xs font-bold text-orange-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              RECENT
            </div>
            <div className="space-y-2">
              {filteredPersonas.map((persona) => (
                <div
                  key={persona.id}
                  className="p-3 bg-[#1A1A1A] border border-orange-500/20 rounded-lg hover:border-orange-500/40 transition-all cursor-pointer group"
                  onClick={() => {
                    setRoleData(persona.data);
                    setInput(persona.topic);
                    setActiveTab("system");
                  }}
                >
                  <div className="text-xs font-semibold text-orange-300 truncate">{persona.name}</div>
                  <div className="text-xs text-orange-200/60 truncate">{persona.topic}</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deletePersona(persona.id);
                    }}
                    className="mt-2 w-full py-1 text-xs text-orange-400/60 hover:text-orange-400 hover:bg-orange-500/10 rounded transition-all"
                  >
                    <Trash2 className="w-3 h-3 inline mr-1" />
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div className="p-4 border-t border-orange-500/20">
            <button className="w-full py-2 px-3 bg-orange-500/20 border border-orange-500/40 rounded-lg text-xs font-semibold text-orange-400 hover:bg-orange-500/30 transition-all flex items-center justify-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top Bar */}
          <div className="h-16 bg-[#0F0F0F]/50 backdrop-blur-xl border-b border-orange-500/20 flex items-center justify-between px-4 sm:px-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="sm:hidden text-orange-400 hover:text-orange-300"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <h1 className="text-xl sm:text-2xl font-bold gradient-text">Role Engineering</h1>
            <div className="text-xs text-orange-400">
              {pipelineStep === "ready" ? "✓ Ready" : pipelineStep === "generating" ? "⚡ Generating..." : "○ Idle"}
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!roleData ? (
              <div className="max-w-2xl mx-auto">
                {/* Input Card */}
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Zap className="w-5 h-5 text-orange-400" />
                    <h2 className="text-lg font-bold">DESCRIBE YOUR ROLE</h2>
                  </div>

                  {/* Model Selector */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-orange-300 mb-2 block">Select Model</label>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1A1A1A] border border-orange-500/20 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                    >
                      {modelsQuery.data?.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Input Textarea */}
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="A senior data scientist who explains ML concepts..."
                    className="w-full h-32 px-4 py-3 bg-[#1A1A1A] border border-orange-500/20 rounded-lg text-white placeholder-orange-300/40 focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                  <div className="text-xs text-orange-300/60 mt-2">{input.length} characters</div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!input.trim() || loading}
                    className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        ENGINEER ROLE
                      </>
                    )}
                  </button>

                  {error && <div className="mt-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-sm text-red-300">{error}</div>}
                </div>

                {/* Empty State */}
                {recentPersonas.length === 0 && (
                  <div className="empty-state">
                    <Sparkles className="empty-state-icon text-orange-400" />
                    <h3 className="text-lg font-bold mb-2">No personas yet</h3>
                    <p className="text-sm text-orange-200/60">Describe a role above to get started</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {/* Role Header Card */}
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold gradient-text mb-2">{roleData.roleName}</h2>
                      <p className="text-sm text-orange-200/80">{roleData.coreFunction}</p>
                    </div>
                    <div className="text-xs text-orange-400 bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/40">
                      {selectedModel.toUpperCase()}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div>
                      <div className="text-xs font-bold text-orange-400 mb-2">PRIMARY USE CASES</div>
                      <div className="space-y-1">
                        {roleData.primaryUseCases.map((uc, i) => (
                          <div key={i} className="text-xs text-orange-200/70">• {uc}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-orange-400 mb-2">ANTI USE CASES</div>
                      <div className="space-y-1">
                        {roleData.antiUseCases.map((auc, i) => (
                          <div key={i} className="text-xs text-orange-200/70">• {auc}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="tabs-container mb-6 bg-[#0F0F0F]/50 rounded-lg p-1">
                  {(["system", "templates", "examples", "checklist", "notes"] as TabType[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab-button ${activeTab === tab ? "active" : ""}`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="glass-card p-6 mb-6 max-h-96 overflow-y-auto">
                  {activeTab === "system" && (
                    <div>
                      <h3 className="font-bold mb-3 text-orange-300">System Prompt</h3>
                      <p className="text-sm text-orange-200/80 whitespace-pre-wrap">{roleData.systemPrompt}</p>
                    </div>
                  )}
                  {activeTab === "templates" && (
                    <div>
                      <h3 className="font-bold mb-3 text-orange-300">Reusable Template</h3>
                      <p className="text-sm text-orange-200/80 whitespace-pre-wrap font-mono">{roleData.reuseTemplate}</p>
                    </div>
                  )}
                  {activeTab === "examples" && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-bold text-orange-300 mb-2">Example 1: {roleData.example1.scenario}</h4>
                        <p className="text-sm text-orange-200/80"><strong>Input:</strong> {roleData.example1.input}</p>
                        <p className="text-sm text-orange-200/80 mt-2"><strong>Output:</strong> {roleData.example1.output}</p>
                      </div>
                      <div className="border-t border-orange-500/20 pt-4">
                        <h4 className="font-bold text-orange-300 mb-2">Example 2: {roleData.example2.scenario}</h4>
                        <p className="text-sm text-orange-200/80"><strong>Input:</strong> {roleData.example2.input}</p>
                        <p className="text-sm text-orange-200/80 mt-2"><strong>Output:</strong> {roleData.example2.output}</p>
                      </div>
                    </div>
                  )}
                  {activeTab === "checklist" && (
                    <div>
                      <h3 className="font-bold mb-4 text-orange-300">Evaluator Checklist</h3>
                      <div className="mb-4">
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
                        </div>
                        <div className="text-xs text-orange-300/60 mt-2">{checkedCount}/{roleData.evaluatorChecklist.length} items</div>
                      </div>
                      <div className="space-y-2">
                        {roleData.evaluatorChecklist.map((item, i) => (
                          <label key={i} className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checkedItems[i] || false}
                              onChange={(e) => setCheckedItems({ ...checkedItems, [i]: e.target.checked })}
                              className="w-4 h-4 accent-orange-500"
                            />
                            <span className="text-sm text-orange-200/80">{item}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === "notes" && (
                    <div>
                      <h3 className="font-bold mb-3 text-orange-300">Usage Notes</h3>
                      <p className="text-sm text-orange-200/80 whitespace-pre-wrap">{roleData.usageNotes}</p>
                    </div>
                  )}
                </div>

                {/* Export Section */}
                <div className="glass-card p-6">
                  <h3 className="font-bold mb-4 text-orange-300 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Export Package
                  </h3>

                  {/* Export Format Picker */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    {(["zip", "json", "markdown"] as ExportFormat[]).map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportFormat(format)}
                        className={`p-3 rounded-lg border transition-all text-center ${
                          exportFormat === format
                            ? "bg-orange-500/30 border-orange-500 text-orange-300"
                            : "bg-[#1A1A1A] border-orange-500/20 text-orange-200/60 hover:border-orange-500/40"
                        }`}
                      >
                        {format === "zip" && <Package className="w-4 h-4 mx-auto mb-1" />}
                        {format === "json" && <FileJson className="w-4 h-4 mx-auto mb-1" />}
                        {format === "markdown" && <FileText className="w-4 h-4 mx-auto mb-1" />}
                        <div className="text-xs font-semibold">{format.toUpperCase()}</div>
                      </button>
                    ))}
                  </div>

                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all"
                  >
                    <Download className="w-5 h-5" />
                    DOWNLOAD {exportFormat.toUpperCase()}
                  </button>
                </div>

                {/* Back Button */}
                <button
                  onClick={() => {
                    setRoleData(null);
                    setInput("");
                    setPipelineStep("idle");
                  }}
                  className="w-full mt-4 py-2 text-orange-400 hover:text-orange-300 text-sm font-semibold transition-all"
                >
                  ← Generate Another Role
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
