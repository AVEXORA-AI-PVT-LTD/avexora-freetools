"use client";

import { useState, useEffect } from "react";
import { getPaymentsAction } from "./payment-actions";
import { exportPaymentsAction } from "./export-actions";
import Link from "next/link";
import { format } from "date-fns";

export default function PaymentsClient() {
  const [payments, setPayments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const data = await getPaymentsAction({ page, search, status: statusFilter });
      setPayments(data.items);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      console.error(err);
    }
    setIsLoading(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const csv = await exportPaymentsAction();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Failed to export payments. Please check permissions.");
    }
    setIsExporting(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchPayments(), 300);
    return () => clearTimeout(timer);
  }, [page, search, statusFilter]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          <input 
            type="search" 
            placeholder="Search Tx ID, email, name..." 
            className="px-4 py-2 border rounded-lg text-sm w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          
          <select 
            className="px-4 py-2 border rounded-lg text-sm bg-white"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="successful">Successful</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
            <option value="partially_refunded">Partially Refunded</option>
          </select>
        </div>
        <button 
          onClick={handleExport} 
          disabled={isExporting}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-medium">Transaction ID</th>
              <th className="px-6 py-3 font-medium">User</th>
              <th className="px-6 py-3 font-medium">Plan</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">Loading...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No payments found.</td></tr>
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-mono text-xs">{p.providerTxId || p.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{p.user?.name || "Unknown"}</div>
                  <div className="text-xs text-slate-500">{p.user?.email || "No email"}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="capitalize">{p.subscription?.plan || "N/A"}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="font-medium">₹{(p.amount / 100).toFixed(2)}</div>
                  {p.refundAmount > 0 && <div className="text-xs text-red-500">Refunded: ₹{(p.refundAmount / 100).toFixed(2)}</div>}
                </td>
                <td className="px-6 py-4">{format(new Date(p.paymentDate), "MMM d, yyyy HH:mm")}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.status === "successful" ? "bg-green-100 text-green-700" :
                    p.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link href={`/admin/monetization/payments/${p.id}`} className="text-blue-600 hover:underline text-sm font-medium">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-200 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          Showing page {page} of {pages}
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
          >
            Prev
          </button>
          <button 
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="px-3 py-1.5 border rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
