"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Play, 
  Sparkles, 
  History, 
  Sliders, 
  FileCode, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Code,
  AlertTriangle 
} from "lucide-react";
import { 
  updateAiToolConfigAction, 
  savePromptRevisionAction, 
  restorePromptRevisionAction, 
  testAiToolAction 
} from "../ai-actions";

interface AiToolEditorProps {
  toolMeta: any;
  effectiveConfig: any;
  isCategoryEnabled?: boolean;
  revisions: any[];
  stats: any;
}

export function AiToolEditor({
  toolMeta,
  effectiveConfig,
  isCategoryEnabled = true,
  revisions: initialRevisions,
  stats,
}: AiToolEditorProps) {
  const [activeTab, setActiveTab] = useState<
    "basic" | "model" | "prompts" | "limits" | "history" | "test"
  >("prompts");

  // Form states
  const [enabled, setEnabled] = useState(effectiveConfig.enabled);
  const [provider, setProvider] = useState(effectiveConfig.provider);
  const [model, setModel] = useState(effectiveConfig.model);
  const [temperature, setTemperature] = useState(effectiveConfig.temperature);
  const [maxTokens, setMaxTokens] = useState(effectiveConfig.maxTokens);
  const [inputLimitChars, setInputLimitChars] = useState(effectiveConfig.inputLimitChars);
  const [dailyLimitPerUser, setDailyLimitPerUser] = useState(effectiveConfig.dailyLimitPerUser);
  const [monthlyLimitPerUser, setMonthlyLimitPerUser] = useState(effectiveConfig.monthlyLimitPerUser);
  const [maintenanceMessage, setMaintenanceMessage] = useState(effectiveConfig.maintenanceMessage || "");

  // Prompt states
  const [systemPrompt, setSystemPrompt] = useState(effectiveConfig.systemPrompt);
  const [userPromptTemplate, setUserPromptTemplate] = useState(effectiveConfig.userPromptTemplate);
  const [changeReason, setChangeReason] = useState("");
  const [revisions, setRevisions] = useState(initialRevisions);

  // Test Runner state
  const [testInputs, setTestInputs] = useState<Record<string, any>>({});
  const [testRunning, setTestRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-detect template variables
  const detectedVariables: string[] = (userPromptTemplate.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g) || []).map(
    (v: string) => v.replace(/[\{\}]/g, "").trim()
  );
  const uniqueVariables: string[] = Array.from(new Set(detectedVariables));

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg(null);
    } else {
      setSuccessMsg(msg);
      setErrorMsg(null);
    }
    setTimeout(() => {
      setSuccessMsg(null);
      setErrorMsg(null);
    }, 4000);
  };

  const handleSaveBasicConfig = async () => {
    try {
      setSaving(true);
      await updateAiToolConfigAction(toolMeta.slug, {
        enabled,
        maintenanceMessage: maintenanceMessage.trim() || null,
      });
      showNotification("Basic settings saved successfully.");
    } catch (err: any) {
      showNotification(err.message || "Failed to save settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveModelConfig = async () => {
    try {
      setSaving(true);
      await updateAiToolConfigAction(toolMeta.slug, {
        provider,
        model,
        temperature,
        maxTokens,
      });
      showNotification("Model & provider settings saved successfully.");
    } catch (err: any) {
      showNotification(err.message || "Failed to save model settings.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLimitsConfig = async () => {
    try {
      setSaving(true);
      await updateAiToolConfigAction(toolMeta.slug, {
        inputLimitChars,
        dailyLimitPerUser,
        monthlyLimitPerUser,
      });
      showNotification("Limits & quotas saved successfully.");
    } catch (err: any) {
      showNotification(err.message || "Failed to save limits.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrompts = async () => {
    if (!changeReason.trim()) {
      showNotification("Please provide a change reason before saving a prompt revision.", true);
      return;
    }

    try {
      setSaving(true);
      const newRev = await savePromptRevisionAction(
        toolMeta.slug,
        systemPrompt,
        userPromptTemplate,
        changeReason
      );

      setRevisions((prev) => [newRev, ...prev.map((r) => ({ ...r, status: "archived" }))]);
      setChangeReason("");
      showNotification(`Prompt Revision v${newRev.version} saved successfully!`);
    } catch (err: any) {
      showNotification(err.message || "Failed to save prompt revision.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreRevision = async (targetVersion: number) => {
    const reason = prompt(`Enter reason for restoring version v${targetVersion}:`, `Restored from v${targetVersion}`);
    if (reason === null) return;

    try {
      setSaving(true);
      const restoredRev = await restorePromptRevisionAction(toolMeta.slug, targetVersion, reason);

      setSystemPrompt(restoredRev.systemPrompt);
      setUserPromptTemplate(restoredRev.userPromptTemplate);
      setRevisions((prev) => [restoredRev, ...prev.map((r) => ({ ...r, status: "archived" }))]);

      showNotification(`Restored version v${targetVersion} as active v${restoredRev.version}!`);
    } catch (err: any) {
      showNotification(err.message || "Failed to restore version.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleRunTest = async () => {
    setTestRunning(true);
    setTestResult(null);
    setTestError(null);

    try {
      const res = await testAiToolAction(toolMeta.slug, testInputs);
      setTestResult(res);
    } catch (err: any) {
      setTestError(err.message || "Test execution failed.");
    } finally {
      setTestRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/admin/ai-writer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Tools Registry
        </Link>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {toolMeta.name}
              </h1>
              <span className="inline-flex items-center rounded-md bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 border border-orange-200">
                v{effectiveConfig.activeVersion} Active
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Slug: <code className="font-mono text-xs font-bold text-orange-600">{toolMeta.slug}</code> • Category: {toolMeta.category}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white border border-slate-200 p-2.5 rounded-lg shadow-sm">
            <span className="font-semibold text-slate-800">
              {stats.totalExecutions.toLocaleString()} total runs
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-600">
              ${stats.totalCost.toFixed(4)} total cost
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800 border border-emerald-200">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-4 text-sm text-rose-800 border border-rose-200">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

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
                Because the category is set to inactive in Category Management, this AI tool is <strong>effectively disabled</strong> for public users even when individual settings show enabled.
              </p>
            </div>
          </div>
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 underline hover:text-amber-700 shrink-0 self-start sm:self-center"
          >
            Reactivate Category →
          </Link>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("prompts")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "prompts"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              <span>Prompt Templates & Variables</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("model")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "model"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              <span>Model & Provider</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("basic")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "basic"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Basic Settings</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("limits")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "limits"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Rate & Quota Limits</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "history"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Prompt Revisions ({revisions.length})</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("test")}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-semibold transition-colors ${
              activeTab === "test"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-600" />
              <span>Test Runner Playground</span>
            </div>
          </button>
        </nav>
      </div>

      {/* TAB: PROMPT TEMPLATES & VARIABLES */}
      {activeTab === "prompts" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-900">
                System Prompt
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Sets the persona, rules, formatting requirements, and constraints for the AI model.
              </p>
              <textarea
                rows={4}
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Enter system prompt instructions..."
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-900">
                User Prompt Template
              </label>
              <p className="text-xs text-slate-500 mb-2">
                Define the template structure using <code className="text-orange-600 font-bold">{"{{variableName}}"}</code> syntax for form fields.
              </p>
              <textarea
                rows={8}
                value={userPromptTemplate}
                onChange={(e) => setUserPromptTemplate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm text-slate-900 focus:border-orange-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. Write a blog outline for topic: {{topic}} targeting {{audience}}..."
              />
            </div>

            {/* Extracted variables preview */}
            <div className="rounded-lg bg-orange-50/60 border border-orange-100 p-4">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-900">
                Auto-Detected Template Variables ({uniqueVariables.length}):
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {uniqueVariables.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">No variables detected in template.</span>
                ) : (
                  uniqueVariables.map((v) => (
                    <span
                      key={v}
                      className="inline-flex items-center gap-1 rounded-md bg-white border border-orange-200 px-2.5 py-1 text-xs font-mono font-bold text-orange-800 shadow-xs"
                    >
                      {"{{"}
                      {v}
                      {"}}"}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Change Reason & Submit */}
            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-900">
                  Mandated Change Reason <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Added tone enforcement and updated formatting constraints"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSavePrompts}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>Save New Revision (v{(revisions[0]?.version || 0) + 1})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MODEL & PROVIDER */}
      {activeTab === "model" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-3xl">
          <div>
            <label className="block text-sm font-bold text-slate-900">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openai">OpenAI (GPT)</option>
              <option value="gemini">Google Gemini</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-orange-500 focus:outline-none"
            >
              <option value="claude-opus-4-8">claude-opus-4-8 ($15/1M in, $75/1M out)</option>
              <option value="claude-3-5-sonnet-20241022">claude-3-5-sonnet-20241022 ($3/1M in, $15/1M out)</option>
              <option value="claude-3-5-haiku-20241022">claude-3-5-haiku-20241022 ($0.80/1M in, $4/1M out)</option>
              <option value="gpt-4o">gpt-4o ($2.50/1M in, $10/1M out)</option>
              <option value="gpt-4o-mini">gpt-4o-mini ($0.15/1M in, $0.60/1M out)</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro ($1.25/1M in, $5/1M out)</option>
              <option value="gemini-1.5-flash">gemini-1.5-flash ($0.075/1M in, $0.30/1M out)</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-bold text-slate-900">
                Temperature ({temperature})
              </label>
              <span className="text-xs text-slate-500">0.0 (precise) → 1.0 (creative)</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900">
              Max Tokens Output Limit
            </label>
            <input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(parseInt(e.target.value) || 2048)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none font-mono"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveModelConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Save Model Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: BASIC SETTINGS */}
      {activeTab === "basic" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-3xl">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <label className="text-sm font-bold text-slate-900">
                Enable Tool Execution
              </label>
              <p className="text-xs text-slate-500">
                When disabled, public users see the maintenance message below instead of AI generation.
              </p>
            </div>
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-5 w-5 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900">
              Maintenance Message (Optional)
            </label>
            <input
              type="text"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="e.g. This AI tool is undergoing planned maintenance. Check back shortly."
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveBasicConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Save Basic Settings</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: LIMITS & QUOTAS */}
      {activeTab === "limits" && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 max-w-3xl">
          <div>
            <label className="block text-sm font-bold text-slate-900">
              Input Limit (Characters)
            </label>
            <input
              type="number"
              value={inputLimitChars}
              onChange={(e) => setInputLimitChars(parseInt(e.target.value) || 5000)}
              className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900">
              Daily Limit Per User / IP
            </label>
            <input
              type="number"
              value={dailyLimitPerUser}
              onChange={(e) => setDailyLimitPerUser(parseInt(e.target.value) || 50)}
              className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900">
              Monthly Limit Per User / IP
            </label>
            <input
              type="number"
              value={monthlyLimitPerUser}
              onChange={(e) => setMonthlyLimitPerUser(parseInt(e.target.value) || 500)}
              className="mt-1 w-full font-mono text-sm rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-orange-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveLimitsConfig}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>Save Quotas & Limits</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB: REVISION HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Change Reason</th>
                  <th className="px-6 py-4">Variables</th>
                  <th className="px-6 py-4">Created Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {revisions.map((rev) => (
                  <tr key={rev.id} className="transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold font-mono text-slate-900">
                      v{rev.version}
                    </td>

                    <td className="px-6 py-4">
                      {rev.version === effectiveConfig.activeVersion ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                          Active Version
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 border border-slate-200">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-slate-800 font-medium">
                      {rev.changeReason || "Initial setup"}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-orange-600">
                      {(rev.variables || []).join(", ") || "none"}
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(rev.createdAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-right">
                      {rev.version !== effectiveConfig.activeVersion && (
                        <button
                          onClick={() => handleRestoreRevision(rev.version)}
                          disabled={saving}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>Restore</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: TEST RUNNER PLAYGROUND */}
      {activeTab === "test" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Input Controls */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Play className="h-5 w-5 text-emerald-600" />
              Dynamic Test Runner Form
            </h2>

            {toolMeta.fields.map((field: any) => (
              <div key={field.name}>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  {field.label} {field.optional ? "(Optional)" : "*"}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    placeholder={field.placeholder}
                    value={testInputs[field.name] || ""}
                    onChange={(e) =>
                      setTestInputs({ ...testInputs, [field.name]: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-2.5 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                ) : field.type === "select" ? (
                  <select
                    value={testInputs[field.name] || field.defaultValue || ""}
                    onChange={(e) =>
                      setTestInputs({ ...testInputs, [field.name]: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  >
                    {field.options?.map((opt: any) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder={field.placeholder}
                    value={testInputs[field.name] || ""}
                    onChange={(e) =>
                      setTestInputs({ ...testInputs, [field.name]: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-orange-500 focus:outline-none"
                  />
                )}
              </div>
            ))}

            <div className="pt-4">
              <button
                onClick={handleRunTest}
                disabled={testRunning}
                className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-50"
              >
                {testRunning ? (
                  <>
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Executing AI Test...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Run AI Test Request</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Test Results */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code className="h-5 w-5 text-orange-600" />
              Test Response & Execution Metrics
            </h2>

            {testError && (
              <div className="rounded-lg bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200">
                {testError}
              </div>
            )}

            {testResult ? (
              <div className="space-y-4">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div>
                    <span className="text-slate-500">Total Tokens: </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {testResult.totalTokens} ({testResult.promptTokens} in / {testResult.completionTokens} out)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Est. Cost: </span>
                    <span className="font-bold text-emerald-600 font-mono">
                      ${testResult.estimatedCost.toFixed(6)} USD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Latency: </span>
                    <span className="font-bold text-slate-900 font-mono">
                      {testResult.durationMs} ms
                    </span>
                  </div>
                </div>

                {/* Output */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Generated Response Output
                  </label>
                  <textarea
                    readOnly
                    rows={8}
                    value={testResult.result}
                    className="w-full font-mono text-xs rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-900"
                  />
                </div>

                {/* Prompt Used */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500 mb-1">
                    Compiled User Prompt Sent to LLM
                  </label>
                  <pre className="w-full font-mono text-xs rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-800 whitespace-pre-wrap">
                    {testResult.userPromptUsed}
                  </pre>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-8 text-center">
                Fill in the form fields on the left and click "Run AI Test Request" to see real-time output and token metrics.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
