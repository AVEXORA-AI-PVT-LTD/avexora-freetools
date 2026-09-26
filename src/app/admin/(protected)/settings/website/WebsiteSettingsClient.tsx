"use client";

import { useState } from "react";
import { MediaPickerModal } from "@/components/admin/MediaPickerModal";
import { updateWebsiteSettingsAction } from "../settings-actions";
import { Globe, Image as ImageIcon, Mail, Share2, Save, CheckCircle2, AlertCircle } from "lucide-react";

interface WebsiteSettingsClientProps {
  initialSettings: {
    websiteName: string;
    logoUrl: string;
    faviconUrl: string;
    contactEmail: string;
    supportEmail: string;
    socialLinks: {
      twitter: string;
      linkedin: string;
      instagram: string;
      youtube: string;
      facebook: string;
      github: string;
    };
  };
}

export function WebsiteSettingsClient({ initialSettings }: WebsiteSettingsClientProps) {
  const [formData, setFormData] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pickerTarget, setPickerTarget] = useState<"logo" | "favicon" | null>(null);

  const handleSocialChange = (key: keyof typeof formData.socialLinks, val: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: val,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await updateWebsiteSettingsAction(formData);
      if (res.success && res.settings) {
        setSuccessMessage("Website settings updated successfully! Changes reflect across the platform.");
      } else {
        setErrorMessage(res.error || "Failed to update website settings.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setSaving(false);
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
        {/* Basic Brand Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Brand Identity & Branding</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Website Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.websiteName}
                onChange={(e) => setFormData({ ...formData, websiteName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Avexora Tools"
              />
              <p className="text-xs text-slate-500 mt-1">Displayed in platform headers, dynamic page titles, and footers.</p>
            </div>

            {/* Logo and Favicon Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Logo Picker */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Platform Logo</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.logoUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 bg-white"
                      placeholder="/logo.png or CDN URL"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget("logo")}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                    >
                      Select from Media Library
                    </button>
                  </div>
                </div>
              </div>

              {/* Favicon Picker */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <label className="block text-sm font-semibold text-slate-700">Platform Favicon</label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
                    {formData.faviconUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={formData.faviconUrl} alt="Favicon Preview" className="w-8 h-8 object-contain" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formData.faviconUrl}
                      onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-mono text-slate-800 bg-white"
                      placeholder="/favicon.ico or CDN URL"
                    />
                    <button
                      type="button"
                      onClick={() => setPickerTarget("favicon")}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-200 transition-colors"
                    >
                      Select from Media Library
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Emails */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Public Support & Inquiry Emails</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Contact Email Address
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="contact@avextools.com"
              />
              <p className="text-xs text-slate-500 mt-1">Used for general business inquiries.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Customer Support Email
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="support@avextools.com"
              />
              <p className="text-xs text-slate-500 mt-1">Used for user support tickets & help desk links.</p>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-slate-800">Social Media & Network Links</h2>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Twitter / X URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.twitter}
                onChange={(e) => handleSocialChange("twitter", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://x.com/avextools"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.linkedin}
                onChange={(e) => handleSocialChange("linkedin", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://linkedin.com/company/avextools"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Instagram URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.instagram}
                onChange={(e) => handleSocialChange("instagram", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://instagram.com/avextools"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.youtube}
                onChange={(e) => handleSocialChange("youtube", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://youtube.com/@avextools"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Facebook URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.facebook}
                onChange={(e) => handleSocialChange("facebook", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://facebook.com/avextools"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                GitHub URL
              </label>
              <input
                type="url"
                value={formData.socialLinks.github}
                onChange={(e) => handleSocialChange("github", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm text-slate-900 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="https://github.com/avextools"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving Changes..." : "Save Website Settings"}
          </button>
        </div>
      </form>

      {/* Media Picker Modal */}
      {pickerTarget && (
        <MediaPickerModal
          assetType="image"
          onClose={() => setPickerTarget(null)}
          onSelect={(url) => {
            if (pickerTarget === "logo") setFormData((prev) => ({ ...prev, logoUrl: url }));
            if (pickerTarget === "favicon") setFormData((prev) => ({ ...prev, faviconUrl: url }));
          }}
        />
      )}
    </div>
  );
}
