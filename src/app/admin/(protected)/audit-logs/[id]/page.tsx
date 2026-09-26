import { requireAdminAuth } from "@/server/admin-auth";
import { notFound } from "next/navigation";
import { getAuditLogByIdAction } from "../audit-actions";
import Link from "next/link";
import { ArrowLeft, History, ShieldAlert, FileCode, CheckCircle2, XCircle, User, Laptop } from "lucide-react";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Audit Log Details | Avex Tools Admin",
};

export default async function AuditLogDetailPage({ params }: PageProps) {
  await requireAdminAuth("audit.view");

  const { id } = await params;
  const log = await getAuditLogByIdAction(id);

  if (!log) {
    notFound();
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div>
        <Link
          href="/admin/audit-logs"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Audit Logs
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              {log.eventId || log.id}
            </span>
            <span
              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                log.severity === "CRITICAL"
                  ? "bg-rose-500 text-white"
                  : log.severity === "WARNING"
                  ? "bg-amber-500 text-white"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {log.severity}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1 flex items-center gap-2">
            <History className="w-7 h-7 text-orange-600" />
            {log.action}
          </h1>
        </div>
      </div>

      {/* Metadata Overview Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Event Overview</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block">Actor Information</span>
            <div className="font-bold text-slate-900 text-sm">{log.actorName || "System Actor"}</div>
            <div className="font-mono text-slate-600">{log.actorEmail || "-"}</div>
            <div className="text-[11px] text-slate-400">Role: {log.actorRole}</div>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block">Target Resource</span>
            <div className="font-bold text-slate-900 text-sm">{log.targetName || log.targetId || "-"}</div>
            <div className="font-mono text-slate-600">Type: {log.targetType}</div>
            <div className="text-[11px] text-slate-400">ID: {log.targetId || "-"}</div>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block">Execution Context</span>
            <div className="font-semibold text-slate-900">{new Date(log.createdAt).toLocaleString()}</div>
            <div className="font-mono text-slate-600">IP: {log.ip || "Local"}</div>
            <div className="font-mono text-slate-600">Request ID: {log.requestId || "-"}</div>
          </div>

          <div className="space-y-1 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-500 block">Status & Environment</span>
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              {log.status === "SUCCESS" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-600" />
              )}
              {log.status}
            </div>
            <div className="font-mono text-slate-600">Environment: {log.environment}</div>
          </div>
        </div>
      </div>

      {/* Raw JSON Payload Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <FileCode className="w-4 h-4 text-slate-400" /> Raw Event Payload
        </h2>
        <pre className="p-4 bg-slate-950 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto">
          {JSON.stringify(log, null, 2)}
        </pre>
      </div>
    </div>
  );
}
