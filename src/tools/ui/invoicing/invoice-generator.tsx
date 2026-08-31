"use client";

import { useState } from "react";
import { formatINR } from "@/tools/compute/format";
import { useToolGate } from "@/components/lead/email-gate";

interface LineItem {
  description: string;
  qty: string;
  rate: string;
  gstRate: string;
}

const emptyItem: LineItem = { description: "", qty: "1", rate: "", gstRate: "18" };

const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none";
const labelCls = "block text-xs font-medium text-slate-600 mb-1";

export default function InvoiceGenerator() {
  const requireEmail = useToolGate();
  const [seller, setSeller] = useState({ name: "", address: "", gstin: "" });
  const [buyer, setBuyer] = useState({ name: "", address: "", gstin: "" });
  const [meta, setMeta] = useState({
    number: "INV-001",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
  });
  const [interState, setInterState] = useState(false);
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);

  const setItem = (i: number, patch: Partial<LineItem>) =>
    setItems((prev) => prev.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const rows = items.map((it) => {
    const qty = Number(it.qty) || 0;
    const rate = Number(it.rate) || 0;
    const gstRate = Number(it.gstRate) || 0;
    const amount = qty * rate;
    const gst = amount * (gstRate / 100);
    return { ...it, qty, rate, gstRate, amount, gst };
  });
  const subtotal = rows.reduce((s, r) => s + r.amount, 0);
  const totalGst = rows.reduce((s, r) => s + r.gst, 0);
  const grandTotal = subtotal + totalGst;

  // Invalid numeric input must never be silently coerced to 0. Any line item a
  // user has filled in with a malformed/non-numeric quantity or rate is flagged
  // with an inline error and blocks printing instead of producing a misleading
  // amount from a coerced zero.
  const numericErrors: string[] = [];
  items.forEach((it, i) => {
    const qtyRaw = it.qty.trim();
    const rateRaw = it.rate.trim();
    const used = it.description.trim() !== "" || qtyRaw !== "" || rateRaw !== "";
    if (!used) return;
    const qtyValid = qtyRaw === "" || (Number.isFinite(Number(qtyRaw)) && Number(qtyRaw) >= 0);
    const rateValid = rateRaw === "" || (Number.isFinite(Number(rateRaw)) && Number(rateRaw) >= 0);
    if (!qtyValid) numericErrors.push(`Line ${i + 1} quantity must be a valid non-negative number.`);
    if (!rateValid) numericErrors.push(`Line ${i + 1} rate must be a valid non-negative number.`);
  });

  const canPrint =
    numericErrors.length === 0 &&
    seller.name.trim() !== "" &&
    buyer.name.trim() !== "" &&
    rows.some((r) => r.description.trim() !== "" && r.amount > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 print:hidden">
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-800 mb-1">From (your business)</legend>
          <div>
            <label className={labelCls} htmlFor="seller-name">Business name</label>
            <input id="seller-name" className={inputCls} value={seller.name}
              onChange={(e) => setSeller({ ...seller, name: e.target.value })} placeholder="Acme Traders Pvt Ltd" />
          </div>
          <div>
            <label className={labelCls} htmlFor="seller-address">Address</label>
            <textarea id="seller-address" className={inputCls} rows={2} value={seller.address}
              onChange={(e) => setSeller({ ...seller, address: e.target.value })} placeholder="Street, City, State, PIN" />
          </div>
          <div>
            <label className={labelCls} htmlFor="seller-gstin">GSTIN (optional)</label>
            <input id="seller-gstin" className={inputCls} value={seller.gstin}
              onChange={(e) => setSeller({ ...seller, gstin: e.target.value })} placeholder="22AAAAA0000A1Z5" />
          </div>
        </fieldset>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-slate-800 mb-1">Bill to (customer)</legend>
          <div>
            <label className={labelCls} htmlFor="buyer-name">Customer name</label>
            <input id="buyer-name" className={inputCls} value={buyer.name}
              onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="buyer-address">Address</label>
            <textarea id="buyer-address" className={inputCls} rows={2} value={buyer.address}
              onChange={(e) => setBuyer({ ...buyer, address: e.target.value })} />
          </div>
          <div>
            <label className={labelCls} htmlFor="buyer-gstin">Customer GSTIN (optional)</label>
            <input id="buyer-gstin" className={inputCls} value={buyer.gstin}
              onChange={(e) => setBuyer({ ...buyer, gstin: e.target.value })} />
          </div>
        </fieldset>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 print:hidden">
        <div>
          <label className={labelCls} htmlFor="inv-number">Invoice number</label>
          <input id="inv-number" className={inputCls} value={meta.number}
            onChange={(e) => setMeta({ ...meta, number: e.target.value })} />
        </div>
        <div>
          <label className={labelCls} htmlFor="inv-date">Invoice date</label>
          <input id="inv-date" type="date" className={inputCls} value={meta.date}
            onChange={(e) => setMeta({ ...meta, date: e.target.value })} />
        </div>
        <div>
          <label className={labelCls} htmlFor="inv-due">Due date (optional)</label>
          <input id="inv-due" type="date" className={inputCls} value={meta.dueDate}
            onChange={(e) => setMeta({ ...meta, dueDate: e.target.value })} />
        </div>
        <div className="flex items-end pb-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={interState} onChange={(e) => setInterState(e.target.checked)} />
            Inter-state (IGST)
          </label>
        </div>
      </div>

      <div className="print:hidden">
        <p className="text-sm font-semibold text-slate-800 mb-2">Line items</p>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 items-start">
              <input aria-label="Item description" className={`${inputCls} col-span-5`} placeholder="Item / service description"
                value={it.description} onChange={(e) => setItem(i, { description: e.target.value })} />
              <input aria-label="Quantity" className={`${inputCls} col-span-2`} type="number" min={0} placeholder="Qty"
                value={it.qty} onChange={(e) => setItem(i, { qty: e.target.value })} />
              <input aria-label="Rate" className={`${inputCls} col-span-2`} type="number" min={0} placeholder="Rate ₹"
                value={it.rate} onChange={(e) => setItem(i, { rate: e.target.value })} />
              <select aria-label="GST rate" className={`${inputCls} col-span-2`} value={it.gstRate}
                onChange={(e) => setItem(i, { gstRate: e.target.value })}>
                {["0", "0.25", "3", "5", "12", "18", "28"].map((r) => (
                  <option key={r} value={r}>{r}% GST</option>
                ))}
              </select>
              <button type="button" aria-label="Remove item"
                className="col-span-1 rounded-md border border-slate-300 py-2 text-sm text-slate-500 hover:text-red-600 disabled:opacity-40"
                disabled={items.length === 1}
                onClick={() => setItems((prev) => prev.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}>
          + Add line item
        </button>
      </div>

      {numericErrors.length > 0 && (
        <ul className="space-y-0.5 text-sm text-red-600 print:hidden">
          {numericErrors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      {/* Invoice preview — the only region visible when printing */}
      <div className="print-area rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-900">
        <div className="flex justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-lg font-bold">{seller.name || "Your Business Name"}</p>
            <p className="whitespace-pre-line text-slate-600">{seller.address}</p>
            {seller.gstin && <p className="text-slate-600">GSTIN: {seller.gstin}</p>}
          </div>
          <div className="text-right">
            <p className="text-xl font-bold tracking-wide text-slate-700">TAX INVOICE</p>
            <p className="mt-1">Invoice #: {meta.number}</p>
            <p>Date: {meta.date}</p>
            {meta.dueDate && <p>Due: {meta.dueDate}</p>}
          </div>
        </div>
        <div className="py-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Bill to</p>
          <p className="font-semibold">{buyer.name || "Customer Name"}</p>
          <p className="whitespace-pre-line text-slate-600">{buyer.address}</p>
          {buyer.gstin && <p className="text-slate-600">GSTIN: {buyer.gstin}</p>}
        </div>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-300 text-left text-xs uppercase text-slate-500">
              <th className="py-2 pr-2">Description</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              <th className="py-2 pr-2 text-right">Rate</th>
              <th className="py-2 pr-2 text-right">GST %</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.filter((r) => r.description.trim() !== "" || r.amount > 0).map((r, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-2 pr-2">{r.description}</td>
                <td className="py-2 pr-2 text-right">{r.qty}</td>
                <td className="py-2 pr-2 text-right">{formatINR(r.rate)}</td>
                <td className="py-2 pr-2 text-right">{r.gstRate}%</td>
                <td className="py-2 text-right">{formatINR(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="ml-auto mt-4 w-64 space-y-1">
          <div className="flex justify-between"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
          {interState ? (
            <div className="flex justify-between"><span>IGST</span><span>{formatINR(totalGst)}</span></div>
          ) : (
            <>
              <div className="flex justify-between"><span>CGST</span><span>{formatINR(totalGst / 2)}</span></div>
              <div className="flex justify-between"><span>SGST</span><span>{formatINR(totalGst / 2)}</span></div>
            </>
          )}
          <div className="flex justify-between border-t border-slate-300 pt-1 font-bold">
            <span>Total</span><span>{formatINR(grandTotal)}</span>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canPrint}
        onClick={() => requireEmail(() => window.print())}
        className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 print:hidden"
        data-lead-action="download"
      >
        Print / Save as PDF
      </button>
      {!canPrint && (
        <p className="text-xs text-slate-500 print:hidden">
          Fill in your business name, customer name and at least one line item to print.
        </p>
      )}
    </div>
  );
}
