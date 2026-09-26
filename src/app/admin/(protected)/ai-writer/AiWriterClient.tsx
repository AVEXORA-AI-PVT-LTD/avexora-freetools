"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  Zap, 
  Activity, 
  DollarSign, 
  CheckCircle, 
  XCircle, 
  Settings2, 
  Search, 
  Filter, 
  Layers,
  AlertTriangle
} from "lucide-react";
import { updateAiToolConfigAction } from "./ai-actions";

interface AiToolSummary {
  slug: string;
  name: string;
  category: string;
  tagline: string;
  fieldsCount: number;
  enabled: boolean;
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  activePromptVersion: number;
  totalExecutions: number;
  totalTokens: number;
  totalCost: number;
}

interface AnalyticsData {
  totalCalls: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  totalCost: number;
  byTool: { toolSlug: string; calls: number; tokens: number; cost: number }[];
  byModel: { model: string; calls: number; tokens: number; cost: number }[];
  recentLogs: any[];
  modelPricing: Record<string, { input: number; output: number }>;
}

export function AiWriterClient({
  initialTools,
  isCategoryEnabled = true,
  analytics,
}: {
  initialTools: AiToolSummary[];
  isCategoryEnabled?: boolean;
  analytics: AnalyticsData;
}) {
  const [tools, setTools] = useState<AiToolSummary[]>(initialTools);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [activeTab, setActiveTab] = useState<"tools" | "analytics" | "pricing">("tools");
  const [togglingSlug, setTogglingSlug] = useState<string | null>(null);

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(search.toLowerCase()) ||
      tool.slug.toLowerCase().includes(search.toLowerCase()) ||
      tool.tagline.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && tool.enabled) ||
      (statusFilter === "disabled" && !tool.enabled);
    return matchesSearch && matchesStatus;
  });

  const handleToggleStatus = async (slug: string, currentStatus: boolean) => {
    try {
      setTogglingSlug(slug);
      const nextStatus = !currentStatus;
      await updateAiToolConfigAction(slug, { enabled: nextStatus });

      setTools((prev) =>
        prev.map((t) => (t.slug === slug ? { ...t, enabled: nextStatus } : t))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update AI tool status.");
    } finally {
      setTogglingSlug(null);
    }
  };

  const totalExecutions = tools.reduce((acc, t) => acc + t.totalExecutions, 0);
  const totalTokens = tools.reduce((acc, t) => acc + t.totalTokens, 0);
  const totalCost = tools.reduce((acc, t) => acc + t.totalCost, 0);
  const activeToolsCount = isCategoryEnabled ? tools.filter((t) => t.enabled).length : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-orange-600" />
            AI Writer Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage system prompts, model overrides, token limits, versioning, and cost tracking across all 13 AI Writer tools.
          </p>
        </div>
      </div>

      {/* Category Inactive Warning Banner */}
      {!isCategoryEnabled && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Parent Category "AI Writers" (/ai-writers) is Currently Inactive
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                This category is disabled in Category Management. Even if tools show "Enabled Config", all 13 AI Writer tools are <strong>effectively disabled</strong> for end-users on the public website.
              </p>
            </div>
          </div>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-700 shrink-0 self-start sm:self-center"
          >
            Go to Category Management →
          </Link>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Discovered AI Tools
            </span>
            <Bot className="h-5 w-5 text-orange-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {activeToolsCount} / {tools.length}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isCategoryEnabled
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {isCategoryEnabled ? "Active" : "Category Inactive"}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total AI Executions
            </span>
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {totalExecutions.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500">runs</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Token Consumption
            </span>
            <Activity className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              {(totalTokens / 1000).toFixed(1)}k
            </span>
            <span className="text-xs text-slate-500">tokens</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Estimated AI Cost
            </span>
            <DollarSign className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ${totalCost.toFixed(4)}
            </span>
            <span className="text-xs text-slate-500">USD</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("tools")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "tools"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>AI Tools Registry ({tools.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "analytics"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Usage & Cost Analytics</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("pricing")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "pricing"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Model Pricing Reference</span>
            </div>
          </button>
        </nav>
      </div>

      {/* TAB 1: AI TOOLS REGISTRY */}
      {activeTab === "tools" && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search AI tools by name or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="enabled">Enabled Only</option>
                <option value="disabled">Disabled Only</option>
              </select>
            </div>
          </div>

          {/* Tools Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                  <tr>
                    <th className="px-6 py-3.5">Tool Name & Slug</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Model & Provider</th>
                    <th className="px-6 py-3.5">Prompt Version</th>
                    <th className="px-6 py-3.5">Usage & Cost</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTools.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                        No AI tools found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredTools.map((tool) => (
                      <tr
                        key={tool.slug}
                        className="transition-colors hover:bg-slate-50/80"
                      >
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900">
                              {tool.name}
                            </span>
                            <span className="text-xs text-orange-600 font-mono">
                              {tool.slug}
                            </span>
                            <span className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {tool.tagline}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1 items-start">
                            <button
                              onClick={() => handleToggleStatus(tool.slug, tool.enabled)}
                              disabled={togglingSlug === tool.slug}
                              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                                tool.enabled
                                  ? isCategoryEnabled
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200 opacity-60"
                                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                              }`}
                            >
                              {tool.enabled ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                                  <span>Enabled</span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3.5 w-3.5 text-slate-400" />
                                  <span>Disabled</span>
                                </>
                              )}
                            </button>

                            {!isCategoryEnabled && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                Category Inactive
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-slate-800">
                              {tool.model}
                            </span>
                            <span className="text-xs text-slate-500 capitalize">
                              {tool.provider} • Max {tool.maxTokens} Tokens
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                            v{tool.activePromptVersion}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex flex-col text-xs">
                            <span className="font-semibold text-slate-900">
                              {tool.totalExecutions.toLocaleString()} calls
                            </span>
                            <span className="text-slate-500">
                              ${tool.totalCost.toFixed(4)} USD
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/ai-writer/${tool.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-orange-500 shadow-sm"
                          >
                            <Settings2 className="h-3.5 w-3.5" />
                            <span>Configure & Prompts</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANALYTICS & USAGE */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top AI Tools by Call Count */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Zap className="h-5 w-5 text-amber-500" />
                Usage Breakdown by Tool
              </h2>
              {analytics.byTool.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No tool execution logs recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.byTool.map((item) => {
                    const toolName = tools.find((t) => t.slug === item.toolSlug)?.name || item.toolSlug;
                    const percent = Math.min(100, Math.round((item.calls / (analytics.totalCalls || 1)) * 100));

                    return (
                      <div key={item.toolSlug} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-900">
                            {toolName}
                          </span>
                          <span className="text-slate-500 font-mono">
                            {item.calls} calls • ${item.cost.toFixed(4)}
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                          <div
                            className="h-2 rounded-full bg-orange-600"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Model Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
                <Layers className="h-5 w-5 text-orange-600" />
                Usage Breakdown by Model
              </h2>
              {analytics.byModel.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No model execution logs recorded yet.</p>
              ) : (
                <div className="space-y-4">
                  {analytics.byModel.map((item) => (
                    <div
                      key={item.model}
                      className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <div>
                        <div className="font-mono text-sm font-bold text-slate-900">
                          {item.model}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.tokens.toLocaleString()} tokens
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-emerald-600">
                          ${item.cost.toFixed(4)} USD
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.calls} total calls
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MODEL PRICING REFERENCE */}
      {activeTab === "pricing" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              LLM Model Pricing Matrix (per 1,000,000 Tokens)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Token costs are automatically calculated on every execution using these official rates.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Model Name</th>
                  <th className="px-4 py-3">Input Tokens Price (per 1M)</th>
                  <th className="px-4 py-3">Output Tokens Price (per 1M)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {Object.entries(analytics.modelPricing).map(([model, pricing]) => (
                  <tr key={model}>
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {model}
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      ${pricing.input.toFixed(2)} USD
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-mono">
                      ${pricing.output.toFixed(2)} USD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
