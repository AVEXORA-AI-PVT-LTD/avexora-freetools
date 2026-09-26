"use client";

import { useState } from "react";
import {
  updateEmailSettingsAction,
  sendTestEmailAction,
  updateEmailTemplateAction,
} from "../settings-actions";
import {
  Mail,
  Send,
  FileCode,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Edit3,
  X,
  Server,
} from "lucide-react";

interface EmailSettingsClientProps {
  initialSettings: {
    senderName: string;
    senderEmail: string;
    provider: string;
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPasswordMasked: string;
    isConfigured: boolean;
  };
  initialTemplates: Array<{
    id: string;
    slug: string;
    name: string;
    subject: string;
    htmlBody: string;
    status: boolean;
  }>;
}

export function EmailSettingsClient({
  initialSettings,
  initialTemplates,
}: EmailSettingsClientProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [templates, setTemplates] = useState(initialTemplates);

  // Email config form state
  const [smtpPassword, setSmtpPassword] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState("");
  const [settingsError, setSettingsError] = useState("");

  // Test Email state
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testRecipient, setTestRecipient] = useState("");
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Template Editing state
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateSubject, setTemplateSubject] = useState("");
  const [templateBody, setTemplateBody] = useState("");
  const [templateStatus, setTemplateStatus] = useState(true);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateError, setTemplateError] = useState("");

  // Save Email Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsSuccess("");
    setSettingsError("");

    try {
      const res = await updateEmailSettingsAction({
        senderName: settings.senderName,
        senderEmail: settings.senderEmail,
        provider: settings.provider,
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpPassword: smtpPassword ? smtpPassword : undefined,
      });

      if (res.success && res.settings) {
        setSettings(res.settings);
        setSmtpPassword("");
        setSettingsSuccess("Email configuration saved successfully!");
      } else {
        setSettingsError(res.error || "Failed to update email settings.");
      }
    } catch (err: any) {
      setSettingsError(err.message || "An error occurred while saving email settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  // Send Test Email
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testRecipient) return;

    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendTestEmailAction(testRecipient);
      if (res.success) {
        setTestResult({
          success: true,
          message: `Test email successfully dispatched to ${testRecipient}!`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || "Failed to send test email.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to send test email.",
      });
    } finally {
      setSendingTest(false);
    }
  };

  // Open Template Modal
  const handleEditTemplate = (tpl: any) => {
    setEditingTemplate(tpl);
    setTemplateSubject(tpl.subject);
    setTemplateBody(tpl.htmlBody);
    setTemplateStatus(tpl.status);
    setTemplateError("");
  };

  // Save Template Edit
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTemplate) return;

    setSavingTemplate(true);
    setTemplateError("");

    try {
      const res = await updateEmailTemplateAction(editingTemplate.id, {
        subject: templateSubject,
        htmlBody: templateBody,
        status: templateStatus,
      });

      if (res.success && res.template) {
        setTemplates((prev) =>
          prev.map((t) => (t.id === res.template!.id ? res.template! : t))
        );
        setEditingTemplate(null);
      } else {
        setTemplateError(res.error || "Failed to save template.");
      }
    } catch (err: any) {
      setTemplateError(err.message || "Failed to save template.");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Settings Alerts */}
      {settingsSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{settingsSuccess}</span>
        </div>
      )}

      {settingsError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span className="font-medium">{settingsError}</span>
        </div>
      )}

      {/* Email Dispatcher Config */}
      <form onSubmit={handleSaveSettings} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Email Gateway Configuration</h2>
              <p className="text-xs text-slate-500">Configure outbound transactional SMTP/email server credentials.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setTestModalOpen(true);
              setTestResult(null);
            }}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs rounded-xl border border-indigo-200 flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Test Email
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Email Service Provider
              </label>
              <select
                value={settings.provider}
                onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="SMTP">Standard SMTP</option>
                <option value="Resend">Resend API</option>
                <option value="SendGrid">SendGrid</option>
                <option value="Postmark">Postmark</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Default Sender Name
              </label>
              <input
                type="text"
                required
                value={settings.senderName}
                onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Avex Tools"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Default Sender Email Address
              </label>
              <input
                type="email"
                required
                value={settings.senderEmail}
                onChange={(e) => setSettings({ ...settings, senderEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="noreply@avextools.com"
              />
            </div>
          </div>

          {/* SMTP Server Details */}
          <div className="border-t border-slate-200 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5" /> SMTP Connection Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Host</label>
                <input
                  type="text"
                  value={settings.smtpHost}
                  onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  placeholder="smtp.gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP Port</label>
                <input
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) || 587 })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  placeholder="587"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">SMTP User / Username</label>
                <input
                  type="text"
                  value={settings.smtpUser}
                  onChange={(e) => setSettings({ ...settings, smtpUser: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  placeholder="user@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>SMTP Password</span>
                  <span className="text-[10px] text-amber-600 font-normal flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5" /> {settings.smtpPasswordMasked}
                  </span>
                </label>
                <input
                  type="password"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-900 bg-white placeholder:font-sans placeholder:text-slate-400"
                  placeholder="Leave blank to keep existing"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {savingSettings ? "Saving Credentials..." : "Save Email Settings"}
            </button>
          </div>
        </div>
      </form>

      {/* Transactional Email Templates */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
          <FileCode className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-800">Transactional Email Templates</h2>
            <p className="text-xs text-slate-500">Manage system email templates for welcome, auth, and billing notifications.</p>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {templates.map((tpl) => (
            <div key={tpl.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-sm text-slate-900">{tpl.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-100 text-slate-600">
                    {tpl.slug}
                  </span>
                  {tpl.status ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600">
                  <span className="font-medium text-slate-700">Subject:</span> {tpl.subject}
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleEditTemplate(tpl)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 font-medium text-xs rounded-lg border border-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Template
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Test Email Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" /> Send Test Email
              </h3>
              <button onClick={() => setTestModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  required
                  value={testRecipient}
                  onChange={(e) => setTestRecipient(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="admin@example.com"
                />
              </div>

              {testResult && (
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

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingTest}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {sendingTest ? "Sending..." : "Dispatch Test"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Email Template Modal */}
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-400" /> Edit Template: {editingTemplate.name}
              </h3>
              <button onClick={() => setEditingTemplate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="p-6 space-y-4">
              {templateError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>{templateError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Subject Line</label>
                <input
                  type="text"
                  required
                  value={templateSubject}
                  onChange={(e) => setTemplateSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  HTML Body Content (Supports <span className="font-mono text-indigo-600">{"{{variable}}"}</span> Placeholders)
                </label>
                <textarea
                  rows={8}
                  required
                  value={templateBody}
                  onChange={(e) => setTemplateBody(e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-300 text-xs font-mono text-slate-900 bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tplStatus"
                  checked={templateStatus}
                  onChange={(e) => setTemplateStatus(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="tplStatus" className="text-xs font-medium text-slate-700">
                  Enable dispatch for this transactional template
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTemplate(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTemplate}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50"
                >
                  {savingTemplate ? "Saving Template..." : "Save Template Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
