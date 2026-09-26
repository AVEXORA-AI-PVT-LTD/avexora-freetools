"use client";

import { useState } from "react";
import { processRefundAction } from "../payment-actions";
import { useRouter } from "next/navigation";

export default function RefundClient({ paymentId, maxRefund, providerTxId }: { paymentId: string, maxRefund: number, providerTxId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState((maxRefund / 100).toString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRefund = async () => {
    setError("");
    const parsedAmount = Math.round(parseFloat(amount) * 100);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Invalid amount");
      return;
    }
    if (parsedAmount > maxRefund) {
      setError("Cannot refund more than the remaining refundable amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await processRefundAction(paymentId, parsedAmount);
      setIsOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium rounded-lg transition-colors border border-red-200"
      >
        Issue Refund
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Process Refund</h3>
            <p className="text-sm text-slate-500 mb-6">
              You are about to refund transaction <span className="font-mono">{providerTxId}</span>. This action cannot be undone.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Refund Amount (INR)</label>
                <input 
                  type="number" 
                  step="0.01"
                  max={maxRefund / 100}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <p className="text-xs text-slate-500 mt-1">Maximum refundable: ₹{(maxRefund / 100).toFixed(2)}</p>
              </div>

              {error && <div className="text-red-500 text-sm bg-red-50 p-3 rounded">{error}</div>}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRefund}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {isSubmitting ? "Processing..." : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
