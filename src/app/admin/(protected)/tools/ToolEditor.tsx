"use client";

import { useDialog } from "@/components/admin/DialogProvider";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { saveToolData } from "./editor-actions";
import type { ToolFormData, FAQItem } from "@/types/admin-tool-form";
import { Save, ArrowLeft, Eye, LayoutTemplate, Settings, Code, FileText, Globe, CheckCircle, History } from "lucide-react";

const TABS = [
  { id: "basic", label: "Basic Info", icon: LayoutTemplate },
  { id: "content", label: "Tool Content", icon: FileText },
  { id: "runtime", label: "Runtime", icon: Settings },
  { id: "technical", label: "Technical", icon: Code },
  { id: "seo", label: "SEO", icon: Globe },
  { id: "publishing", label: "Publishing", icon: CheckCircle },
  { id: "versioning", label: "History & Versions", icon: History },
];

export function ToolEditor({ initialData, isNew, categories, allSlugs }: { initialData: ToolFormData, isNew: boolean, categories: {slug: string, name: string}[], allSlugs: {slug: string, name: string}[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { showAlert } = useDialog();
  const [activeTab, setActiveTab] = useState("basic");
  const [data, setData] = useState<ToolFormData>(initialData);
  const [error, setError] = useState("");

  const update = (field: keyof ToolFormData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async (status: "Draft" | "Published") => {
    setError("");
    const payload = { ...data, status };
    setData(payload);

    try {
      const res = await saveToolData(payload);
      if (res.success) {
        showAlert("Success", "Tool saved successfully!");
        if (isNew) {
          router.push(`/admin/tools/${res.slug}`);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to save tool.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4">
          <Link href="/admin/tools" className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Create New Tool" : data.name || "Edit Tool"}</h1>
            <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${data.status === 'Published' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                {data.status}
              </span>
              <span>{data.slug ? `/${data.category}/${data.slug}` : "Unsaved"}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isNew && (
            <a 
              href={`/${data.category}/${data.slug}?preview=true`} 
              target="_blank" 
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-md border border-slate-300 hover:bg-slate-200"
            >
              <Eye className="w-4 h-4" /> Preview
            </a>
          )}
          <button
            onClick={() => handleSave("Draft")}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button
            onClick={() => handleSave("Published")}
            disabled={isPending}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-md hover:bg-orange-700 disabled:opacity-50"
          >
            Publish
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Vertical Tabs */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? "bg-orange-50 text-orange-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? "text-orange-600" : "text-slate-400"}`} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="flex-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm min-h-[500px]">
          {activeTab === "basic" && <BasicTab data={data} update={update} categories={categories} />}
          {activeTab === "content" && <ContentTab data={data} update={update} allSlugs={allSlugs} />}
          {activeTab === "runtime" && <RuntimeTab data={data} update={update} />}
          {activeTab === "technical" && <TechnicalTab data={data} update={update} />}
          {activeTab === "seo" && <SEOTab data={data} update={update} />}
          {activeTab === "publishing" && <PublishingTab data={data} update={update} />}
          {activeTab === "versioning" && <VersioningTab data={data} update={update} />}
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// TAB COMPONENTS
// -----------------------------------------------------------------------------

function BasicTab({ data, update, categories }: any) {
  return (
    <div className="space-y-4 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900 mb-4">Basic Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Tool Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => {
              update("name", e.target.value);
              if (!data.slug && e.target.value) {
                update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
              }
            }}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Slug *</label>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Category *</label>
          <select
            value={data.category}
            onChange={(e) => update("category", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 pl-3 pr-8 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          >
            <option value="">Select Category...</option>
            {categories.map((c: any) => (
              <option key={c.slug} value={c.slug}>{c.name || c.slug}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Tool Type *</label>
          <select
            value={data.type}
            onChange={(e) => update("type", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 pl-3 pr-8 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          >
            <option value="calculator">Calculator</option>
            <option value="generator">Generator</option>
            <option value="converter">Converter</option>
            <option value="formatter">Formatter</option>
            <option value="ai-writer">AI Tool</option>
            <option value="file-tool">File Utility</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Short Description</label>
        <textarea
          value={data.shortDescription}
          onChange={(e) => update("shortDescription", e.target.value)}
          rows={2}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Full Description</label>
        <textarea
          value={data.description}
          onChange={(e) => update("description", e.target.value)}
          rows={4}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Icon (SVG/Class/URL)</label>
          <input
            type="text"
            value={data.icon}
            onChange={(e) => update("icon", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Thumbnail URL</label>
          <input
            type="text"
            value={data.thumbnail}
            onChange={(e) => update("thumbnail", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function ContentTab({ data, update, allSlugs = [] }: any) {
  const addFAQ = () => {
    const next = [...data.faqs, { id: Date.now().toString(), question: "", answer: "", order: data.faqs.length, active: true }];
    update("faqs", next);
  };
  
  const updateFAQ = (index: number, field: string, value: any) => {
    const next = [...data.faqs];
    next[index] = { ...next[index], [field]: value };
    update("faqs", next);
  };

  const removeFAQ = (index: number) => {
    const next = [...data.faqs];
    next.splice(index, 1);
    update("faqs", next);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-lg font-medium text-slate-900">Tool Content & Structure (AEO)</h2>
      
      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Page Heading (H1)</label>
        <input
          type="text"
          value={data.pageHeading}
          onChange={(e) => update("pageHeading", e.target.value)}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Introduction (Direct Answer)</label>
        <textarea
          value={data.introduction}
          onChange={(e) => update("introduction", e.target.value)}
          rows={3}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Formula (Optional)</label>
        <input
          type="text"
          value={data.formula}
          onChange={(e) => update("formula", e.target.value)}
          placeholder="e.g. GST = Amount * Rate / 100"
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-md font-medium text-slate-900 mb-4">Related Tools</h3>
        <p className="text-sm text-slate-500 mb-2">Comma separated tool slugs. Valid slugs only.</p>
        <input
          type="text"
          value={data.relatedTools?.join(', ') || ''}
          onChange={(e) => update("relatedTools", e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
          placeholder="e.g. gst-calculator, sip-calculator"
          className="block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div className="border-t border-slate-200 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-md font-medium text-slate-900">Frequently Asked Questions</h3>
          <button type="button" onClick={addFAQ} className="text-sm bg-slate-100 py-1.5 rounded-md hover:bg-slate-200 font-medium">Add FAQ</button>
        </div>
        
        <div className="space-y-4">
          {data.faqs.map((faq: any, idx: number) => (
            <div key={faq.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex gap-4">
              <div className="flex-1 space-y-3">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => updateFAQ(idx, "question", e.target.value)}
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
                />
                <textarea
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => updateFAQ(idx, "answer", e.target.value)}
                  rows={2}
                  className="block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
                />
              </div>
              <button type="button" onClick={() => removeFAQ(idx)} className="text-red-500 hover:text-red-700 p-2 h-fit">
                Remove
              </button>
            </div>
          ))}
          {data.faqs.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No FAQs added yet.</p>}
        </div>
      </div>
    </div>
  );
}

function RuntimeTab({ data, update }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900">Runtime Settings</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Pricing Tier</label>
          <select
            value={data.pricing}
            onChange={(e) => update("pricing", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 pl-3 pr-8 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          >
            <option value="Free">Free</option>
            <option value="Premium">Premium</option>
          </select>
        </div>
        
        <div className="flex items-center gap-3 pt-8">
          <input
            type="checkbox"
            id="loginRequired"
            checked={data.loginRequired}
            onChange={(e) => update("loginRequired", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
          />
          <label htmlFor="loginRequired" className="text-sm font-medium leading-6 text-slate-900">Login Required to Use</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Daily Usage Limit (Empty = Unlimited)</label>
          <input
            type="number"
            value={data.dailyLimit || ""}
            onChange={(e) => update("dailyLimit", e.target.value ? Number(e.target.value) : null)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-3 pt-8">
          <input
            type="checkbox"
            id="maintenanceMode"
            checked={data.maintenanceMode}
            onChange={(e) => update("maintenanceMode", e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
          />
          <label htmlFor="maintenanceMode" className="text-sm font-medium leading-6 text-red-600">Maintenance Mode (Block Public Access)</label>
        </div>
      </div>
    </div>
  );
}

function TechnicalTab({ data, update }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900">Technical Configuration</h2>
      <p className="text-sm text-slate-500">Only authorized developers should modify these settings.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Route Override (Optional)</label>
          <input
            type="text"
            value={data.route}
            onChange={(e) => update("route", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Internal Service ID</label>
          <input
            type="text"
            value={data.internalServiceId}
            onChange={(e) => update("internalServiceId", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Execution Timeout (ms)</label>
          <input
            type="number"
            value={data.executionTimeoutMs}
            onChange={(e) => update("executionTimeoutMs", Number(e.target.value))}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}

function SEOTab({ data, update }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900">SEO Configuration</h2>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">SEO Title</label>
        <input
          type="text"
          value={data.seoTitle}
          onChange={(e) => update("seoTitle", e.target.value)}
          placeholder={data.name}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium leading-6 text-slate-900">Meta Description</label>
        <textarea
          value={data.metaDescription}
          onChange={(e) => update("metaDescription", e.target.value)}
          rows={3}
          className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">{data.metaDescription.length} / 160 characters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Focus Keyword</label>
          <input
            type="text"
            value={data.focusKeyword}
            onChange={(e) => update("focusKeyword", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium leading-6 text-slate-900">Canonical URL Override</label>
          <input
            type="text"
            value={data.canonicalUrl}
            onChange={(e) => update("canonicalUrl", e.target.value)}
            className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-3 pt-2">
        <input
          type="checkbox"
          id="index"
          checked={data.index}
          onChange={(e) => update("index", e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
        />
        <label htmlFor="index" className="text-sm font-medium leading-6 text-slate-900">Allow Search Engines to Index this Page</label>
      </div>
    </div>
  );
}

function PublishingTab({ data, update }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900">Publishing Settings</h2>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="featured"
              checked={data.featured}
              onChange={(e) => update("featured", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
            />
            <label htmlFor="featured" className="text-sm font-medium leading-6 text-slate-900">Featured Tool (Show on homepage prominently)</label>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="homepageVisible"
              checked={data.homepageVisible}
              onChange={(e) => update("homepageVisible", e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-600"
            />
            <label htmlFor="homepageVisible" className="text-sm font-medium leading-6 text-slate-900">Visible on Homepage Listing</label>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium leading-6 text-slate-900">Schedule Publish Date</label>
            <input
              type="datetime-local"
              value={data.publishDate}
              onChange={(e) => update("publishDate", e.target.value)}
              className="mt-2 block w-full rounded-md border-0 px-3 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function VersioningTab({ data, update }: any) {
  return (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-lg font-medium text-slate-900 mb-4">Version Control</h2>
      
      <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg space-y-4">
        <h3 className="font-medium text-orange-900">Current Version: <span className="font-bold">{data.currentVersion || "1.0.0"}</span></h3>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={data.saveAsNewVersion || false}
            onChange={(e) => update("saveAsNewVersion", e.target.checked)}
            className="rounded border-slate-300 text-orange-600 focus:ring-orange-600 h-4 w-4"
          />
          <span className="text-sm font-medium text-slate-900">Create a new version snapshot on next save</span>
        </label>

        {data.saveAsNewVersion && (
          <div className="space-y-4 pl-6 border-l-2 border-orange-200 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">New Version Number</label>
              <input 
                type="text" 
                value={data.currentVersion} 
                onChange={(e) => update("currentVersion", e.target.value)}
                className="w-48 rounded-md border border-slate-300 py-1.5 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="e.g. 2.1.0"
              />
              <p className="text-xs text-slate-500 mt-1">We recommend semantic versioning (MAJOR.MINOR.PATCH).</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-900 mb-1">Changelog / Release Notes</label>
              <textarea 
                value={data.changelog || ""} 
                onChange={(e) => update("changelog", e.target.value)}
                rows={3}
                className="w-full rounded-md border border-slate-300 py-1.5 px-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                placeholder="Briefly describe what changed in this version..."
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Revision History</h3>
        <p className="text-sm text-slate-500 mb-4">View past configurations, compare changes, and restore previous versions.</p>
        
        {data.slug ? (
          <Link 
            href={`/admin/tools/${data.slug}/history`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700"
          >
            <History className="w-4 h-4" /> Open Revision History
          </Link>
        ) : (
          <p className="text-sm text-slate-400 italic">Save this tool first to view history.</p>
        )}
      </div>
    </div>
  );
}
