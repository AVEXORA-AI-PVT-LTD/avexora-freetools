"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, ArrowLeft, Clock, Globe, Eye } from "lucide-react";
import { useDialog } from "@/components/admin/DialogProvider";
import { saveContent } from "../content-actions";
import { ContentType, ContentStatus } from "@prisma/client";
import type { ContentItem, ContentRevision, User } from "@prisma/client";

/**
 * Editor form state: a full ContentItem when editing, or a blank draft when
 * creating. `scheduledAt` becomes an ISO string once edited in the form.
 */
export type ContentFormData = Omit<Partial<ContentItem>, "scheduledAt"> &
  Pick<ContentItem, "title" | "slug" | "contentType"> & {
    scheduledAt?: Date | string | null;
  };

export interface ContentEditorTool {
  id: string;
  title: string;
  slug: string;
}

interface ContentEditorProps {
  initialData: ContentFormData;
  isNew: boolean;
  revisions: ContentRevision[];
  userRole: string;
  authors: Pick<User, "id" | "name" | "email">[];
  tools: ContentEditorTool[];
  allContent: Pick<ContentItem, "id" | "title" | "slug">[];
}

export function ContentEditor({ initialData, isNew, revisions, userRole, authors, tools, allContent }: ContentEditorProps) {
  const router = useRouter();
  const { showAlert } = useDialog();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [activeTab, setActiveTab] = useState("content");

  const update = <K extends keyof ContentFormData>(field: K, value: ContentFormData[K]) =>
    setData((prev) => ({ ...prev, [field]: value }));

  const canPublish = userRole === "admin" || userRole === "superadmin";

  const handleSave = async (statusOverride?: ContentStatus) => {
    startTransition(async () => {
      try {
        const payload = { ...data };
        if (statusOverride) payload.status = statusOverride;
        
        // The server action receives scheduledAt as a serialized ISO string once edited.
        const res = await saveContent(payload as Parameters<typeof saveContent>[0]);
        if (res.success) {
          showAlert("Success", "Content saved successfully.");
          if (isNew) {
            router.push(`/admin/content/${res.id}`);
          } else {
            router.refresh();
          }
        }
      } catch (err) {
        showAlert("Error", (err instanceof Error ? err.message : String(err)) || "Failed to save content.");
      }
    });
  };

  return (
    <div className="flex gap-6 max-w-7xl mx-auto items-start">
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <Link href="/admin/content" className="text-slate-500 hover:text-slate-800 p-2 border rounded-md">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">{isNew ? "Create Content" : "Edit Content"}</h1>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-200 bg-slate-50">
            {["basic", "content", "seo"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-medium border-b-2 ${activeTab === tab ? 'border-orange-600 text-orange-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="p-6">
            {activeTab === "basic" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Title</label>
                  <input type="text" value={data.title} onChange={e => {
                    update("title", e.target.value);
                    if (isNew) update("slug", e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
                  }} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Slug</label>
                  <input type="text" value={data.slug} onChange={e => update("slug", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Content Type</label>
                    <select value={data.contentType} onChange={e => update("contentType", e.target.value as ContentType)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500">
                      {Object.values(ContentType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Category (Optional)</label>
                    <input type="text" value={data.category || ""} onChange={e => update("category", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">Tags (Comma separated)</label>
                    <input type="text" value={data.tags?.join(", ") || ""} onChange={e => update("tags", e.target.value.split(",").map(s => s.trim()).filter(Boolean))} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" placeholder="e.g. SEO, Marketing, Tools" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Excerpt / Summary</label>
                  <textarea rows={3} value={data.excerpt || ""} onChange={e => update("excerpt", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Featured Image URL</label>
                  <input type="text" value={data.featuredImage || ""} onChange={e => update("featuredImage", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500 focus:border-orange-500" />
                </div>
              </div>
            )}
            
            {activeTab === "content" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-900">Markdown Content</label>
                <div className="border border-slate-300 rounded-md overflow-hidden focus-within:ring-1 focus-within:ring-orange-500 focus-within:border-orange-500">
                  <textarea 
                    value={data.content} 
                    onChange={e => update("content", e.target.value)} 
                    className="w-full h-[500px] p-4 border-0 focus:ring-0 resize-y font-mono text-sm bg-slate-50"
                    placeholder="Write your content here using Markdown..."
                  />
                </div>
                <p className="text-xs text-slate-500">Supports standard Markdown (Headers, Bold, Lists, Links, Codeblocks). HTML is sanitized on render.</p>
              </div>
            )}

            {activeTab === "seo" && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">SEO Title</label>
                  <input type="text" value={data.seoTitle || ""} onChange={e => update("seoTitle", e.target.value)} placeholder="Leave blank to use main Title" className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Meta Description</label>
                  <textarea rows={2} value={data.metaDesc || ""} onChange={e => update("metaDesc", e.target.value)} placeholder="Leave blank to use Excerpt" className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">OG Title</label>
                    <input type="text" value={data.ogTitle || ""} onChange={e => update("ogTitle", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-1">OG Image URL</label>
                    <input type="text" value={data.ogImage || ""} onChange={e => update("ogImage", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-1">Canonical URL</label>
                  <input type="text" value={data.canonicalUrl || ""} onChange={e => update("canonicalUrl", e.target.value)} className="w-full border-slate-300 rounded-md py-2 px-3 focus:ring-orange-500" />
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={data.noIndex} onChange={e => update("noIndex", e.target.checked)} className="rounded text-orange-600 focus:ring-orange-600 border-slate-300" />
                    <span className="text-sm font-medium text-slate-900">No Index (Hide from search engines)</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Publishing</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <div className={`px-3 py-2 rounded-md font-medium text-sm border ${
              data.status === ContentStatus.PUBLISHED ? 'bg-green-50 text-green-700 border-green-200' :
              data.status === ContentStatus.DRAFT ? 'bg-slate-100 text-slate-700 border-slate-200' :
              'bg-yellow-50 text-yellow-700 border-yellow-200'
            }`}>
              Current: {data.status}
            </div>
          </div>


          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Date</label>
            <input type="datetime-local" value={data.scheduledAt ? new Date(data.scheduledAt).toISOString().slice(0,16) : ""} onChange={e => update("scheduledAt", new Date(e.target.value).toISOString())} className="w-full border-slate-300 rounded-md py-1.5 px-3 text-sm focus:ring-orange-500" />
          </div>

          <div className="space-y-2 pt-2">

            <button onClick={() => handleSave()} disabled={isPending || !data.title || !data.slug} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-slate-800 text-white font-medium rounded-md hover:bg-slate-700 disabled:opacity-50">
              <Save className="w-4 h-4" /> Save {data.status === ContentStatus.DRAFT ? "Draft" : "Changes"}
            </button>
            

            {data.status !== ContentStatus.PUBLISHED && canPublish && data.scheduledAt && new Date(data.scheduledAt) > new Date() && (
              <button onClick={() => handleSave(ContentStatus.SCHEDULED)} disabled={isPending || !data.title || !data.slug} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50">
                <Clock className="w-4 h-4" /> Schedule Post
              </button>
            )}

            {data.status !== ContentStatus.PUBLISHED && canPublish && (
              <button onClick={() => handleSave(ContentStatus.PUBLISHED)} disabled={isPending || !data.title || !data.slug} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50">
                <Globe className="w-4 h-4" /> Publish Now
              </button>
            )}

            {!isNew && (
              <Link href={`/api/preview?slug=${data.slug}&type=${data.contentType}`} target="_blank" className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50">
                <Eye className="w-4 h-4" /> Preview
              </Link>
            )}

            {data.status !== ContentStatus.REVIEW && !canPublish && (
              <button onClick={() => handleSave(ContentStatus.REVIEW)} disabled={isPending || !data.title || !data.slug} className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50">
                Submit for Review
              </button>
            )}

            {data.status === ContentStatus.PUBLISHED && canPublish && (
              <button onClick={() => handleSave(ContentStatus.DRAFT)} disabled={isPending} className="w-full flex justify-center items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50">
                Unpublish to Draft
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Settings</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Author</label>
            <select value={data.authorId || ""} onChange={e => update("authorId", e.target.value)} className="w-full border-slate-300 rounded-md py-1.5 px-3 focus:ring-orange-500 text-sm">
              <option value="">Select Author...</option>
              {authors?.map((a) => (
                <option key={a.id} value={a.id}>{a.name || a.email}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={data.featured || false} onChange={e => update("featured", e.target.checked)} className="rounded text-orange-600 focus:ring-orange-600 border-slate-300" />
              <span className="text-sm font-medium text-slate-900">Featured Post</span>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-5">
          <h3 className="font-semibold text-slate-900 border-b pb-2">Relationships</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Related Tools</label>
            <select multiple value={data.relatedTools || []} onChange={e => update("relatedTools", Array.from(e.target.selectedOptions, option => option.value))} className="w-full border-slate-300 rounded-md py-1.5 px-3 focus:ring-orange-500 text-sm" size={5}>
              {tools?.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Hold Cmd/Ctrl to select multiple.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Related Posts</label>
            <select multiple value={data.relatedPosts || []} onChange={e => update("relatedPosts", Array.from(e.target.selectedOptions, option => option.value))} className="w-full border-slate-300 rounded-md py-1.5 px-3 focus:ring-orange-500 text-sm" size={5}>
              {allContent?.filter(c => c.id !== data.id).map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">Hold Cmd/Ctrl to select multiple.</p>
          </div>
        </div>

        {!isNew && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-900 border-b pb-2">Revision History</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-2 text-sm text-slate-600">
                <span className="bg-orange-100 text-orange-800 px-2 rounded font-medium text-xs">v{data.version}</span>
                <span>Current Version</span>
              </div>
              {revisions.map(rev => (
                <div key={rev.id} className="flex items-start gap-2 text-sm text-slate-500">
                  <span className="bg-slate-100 text-slate-600 px-2 rounded font-medium text-xs">v{rev.version}</span>
                  <div>
                    <div>Saved at {new Date(rev.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
              {revisions.length === 0 && <p className="text-sm text-slate-400">No previous revisions.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
