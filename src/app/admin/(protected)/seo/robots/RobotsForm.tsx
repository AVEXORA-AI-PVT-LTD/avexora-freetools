"use client";
import { useState, useTransition } from "react";
import { updateRobotsTxt, resetRobotsTxt } from "./actions";
import { useDialog } from "@/components/admin/DialogProvider";
import { Save, RotateCcw } from "lucide-react";

export function RobotsForm({ initialContent, defaultContent }: { initialContent: string, defaultContent: string }) {
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const { showAlert, showConfirm } = useDialog();

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateRobotsTxt(content);
        showAlert("Success", "Robots.txt updated successfully.");
      } catch (e: any) {
        showAlert("Error", e.message || "Failed to update.");
      }
    });
  };

  const handleReset = () => {
    showConfirm("Reset Robots.txt", "Are you sure you want to reset robots.txt to safe defaults?", async () => {
      startTransition(async () => {
        try {
          await resetRobotsTxt();
          setContent(defaultContent);
          showAlert("Success", "Reset to default.");
        } catch (e: any) {
          showAlert("Error", e.message || "Failed to reset.");
        }
      });
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-900 mb-2">Robots.txt Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="w-full h-64 p-4 font-mono text-sm border border-slate-300 rounded-md focus:ring-orange-500 bg-slate-50"
          placeholder="User-Agent: *"
        />
      </div>
      <div className="flex items-center gap-3 justify-end pt-4 border-t border-slate-100">
        <button onClick={handleReset} disabled={isPending} className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 disabled:opacity-50">
          <RotateCcw className="w-4 h-4" /> Reset to Safe Default
        </button>
        <button onClick={handleSave} disabled={isPending || !content} className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 disabled:opacity-50">
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>
    </div>
  );
}
