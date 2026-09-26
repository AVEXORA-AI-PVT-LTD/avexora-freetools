"use client";

import { useState } from "react";
import {
  updateIntegrationsSettingsAction,
  sendTestWebhookAction,
} from "../settings-actions";
import {
  BarChart2,
  Bot,
  CreditCard,
  HardDrive,
  Webhook,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface IntegrationsSettingsClientProps {
  initialSettings: {
    googleAnalyticsId: string;
    plausibleDomain: string;
    analyticsEnabled: boolean;
    aiProvider: string;
    aiModelDefault: string;
    aiConfigured: boolean;
    paymentProvider: string;
    paymentConfigured: boolean;
    storageProvider: string;
    cdnBaseUrl: string;
    webhooks: Array<{
      id: string;
      name: string;
      url: string;
      events: string[];
      status: string;
      secretMasked: string;
    }>;
  };
}

export function IntegrationsSettingsClient({
  initialSettings,
}: IntegrationsSettingsClientProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Test Webhook state
  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; success: boolean } | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await updateIntegrationsSettingsAction({
        googleAnalyticsId: formData.googleAnalyticsId,
        plausibleDomain: formData.plausibleDomain,
        analyticsEnabled: formData.analyticsEnabled,
        aiProvider: formData.aiProvider,
        aiModelDefault: formData.aiModelDefault,
        paymentProvider: formData.paymentProvider,
        storageProvider: formData.storageProvider,
        cdnBaseUrl: formData.cdnBaseUrl,
      });

      if (res.success && res.settings) {
        setFormData(res.settings);
        setSuccessMessage("Integration services and provider settings updated successfully!");
      } else {
        setErrorMessage(res.error || "Failed to update integration settings.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestWebhook = async (webhookId: string) => {
    setTestingWebhookId(webhookId);
    setTestResult(null);

    try {
      const res = await sendTestWebhookAction(webhookId);
      if (res.success && res.result) {
        setTestResult({
          id: webhookId,
          success: true,
          message: `Test ping delivered successfully! (Delivery Log ID: ${res.result.deliveryId})`,
        });
      } else {
        setTestResult({
          id: webhookId,
          success: false,
          message: res.error || "Webhook test failed.",
        });
      }
    } catch (err: any) {
      setTestResult({
        id: webhookId,
        success: false,
        message: err.message || "Webhook test failed.",
      });
    } finally {
      setTestingWebhookId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Analytics Integrations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-semibold text-slate-800">Analytics Services & Measurement IDs</h2>
                <p className="text-xs text-slate-500">Configure Google Analytics 4, Plausible, or custom site analytics.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.analyticsEnabled}
                onChange={(e) => setFormData({ ...formData, analyticsEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Google Analytics Measurement ID
              </label>
              <input
                type="text"
                value={formData.googleAnalyticsId}
                onChange={(e) => setFormData({ ...formData, googleAnalyticsId: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="G-XXXXXXXXXX"
              />
              <p className="text-xs text-slate-500 mt-1">Google Analytics 4 Measurement Tag ID.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Plausible Analytics Domain
              </label>
              <input
                type="text"
                value={formData.plausibleDomain}
                onChange={(e) => setFormData({ ...formData, plausibleDomain: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="avextools.com"
              />
              <p className="text-xs text-slate-500 mt-1">Privacy-friendly Plausible analytics tracking domain.</p>
            </div>
          </div>
        </div>

        {/* AI Services */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Bot className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">AI & LLM Provider Configuration</h2>
              <p className="text-xs text-slate-500">Configure foundation models powering content generators and AI tools.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Active AI Engine Provider
              </label>
              <select
                value={formData.aiProvider}
                onChange={(e) => setFormData({ ...formData, aiProvider: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="anthropic">Anthropic Claude</option>
                <option value="openai">OpenAI ChatGPT</option>
                <option value="google-gemini">Google Gemini</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Default LLM Model Preset
              </label>
              <input
                type="text"
                value={formData.aiModelDefault}
                onChange={(e) => setFormData({ ...formData, aiModelDefault: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="claude-3-5-sonnet-20241022"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Payment Gateway Provider</h2>
              <p className="text-xs text-slate-500">Select active payment processor for subscription checkouts.</p>
            </div>
          </div>

          <div className="p-6">
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Active Payment Gateway
            </label>
            <select
              value={formData.paymentProvider}
              onChange={(e) => setFormData({ ...formData, paymentProvider: e.target.value })}
              className="w-full max-w-md px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="razorpay">Razorpay (Cards, UPI, Netbanking, Wallets)</option>
              <option value="stripe">Stripe (Global Credit & Debit Cards)</option>
            </select>
          </div>
        </div>

        {/* CDN & Media Storage */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Storage Provider & CDN Distribution</h2>
              <p className="text-xs text-slate-500">Storage engine and public CDN base URL for media assets.</p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Storage Service Provider
              </label>
              <select
                value={formData.storageProvider}
                onChange={(e) => setFormData({ ...formData, storageProvider: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="local">Local Filesystem Storage</option>
                <option value="s3">Amazon S3 Compatible Storage</option>
                <option value="r2">Cloudflare R2 Storage</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                CDN Base URL (Must start with http:// or https://)
              </label>
              <input
                type="url"
                required
                value={formData.cdnBaseUrl}
                onChange={(e) => setFormData({ ...formData, cdnBaseUrl: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://cdn.avextools.com"
              />
            </div>
          </div>
        </div>

        {/* Webhook Endpoint Manager */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Webhook className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Outgoing Webhooks Manager</h2>
              <p className="text-xs text-slate-500">Registered webhooks for system event dispatches.</p>
            </div>
          </div>

          {formData.webhooks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No outgoing webhooks configured yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {formData.webhooks.map((wh) => (
                <div key={wh.id} className="p-6 space-y-3 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <h3 className="font-semibold text-sm text-slate-900">{wh.name}</h3>
                      <span className="text-xs font-mono text-slate-500 truncate max-w-xs">{wh.url}</span>
                    </div>

                    <button
                      type="button"
                      disabled={testingWebhookId === wh.id}
                      onClick={() => handleTestWebhook(wh.id)}
                      className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {testingWebhookId === wh.id ? "Testing..." : "Send Test Webhook"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Subscribed Events:</span>
                    {wh.events.map((ev) => (
                      <span key={ev} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px]">
                        {ev}
                      </span>
                    ))}
                  </div>

                  {testResult && testResult.id === wh.id && (
                    <div
                      className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                        testResult.success
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}
                    >
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Integrations..." : "Save Integrations Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
