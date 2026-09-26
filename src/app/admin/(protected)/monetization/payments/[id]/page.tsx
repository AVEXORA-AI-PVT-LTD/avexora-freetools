import { requireAdminAuth } from "@/server/admin-auth";
import { getPaymentDetailAction } from "../payment-actions";
import Link from "next/link";
import { format } from "date-fns";
import RefundClient from "./RefundClient";

export default async function PaymentDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdminAuth("settings.view");
  const payment = await getPaymentDetailAction(params.id);

  if (!payment) {
    return <div className="p-6">Payment not found.</div>;
  }

  const isRefundable = payment.status === "successful" || payment.status === "partially_refunded";
  const remainingRefundable = payment.amount - payment.refundAmount;

  return (
    <main className="p-6 max-w-4xl">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/monetization/payments" className="text-slate-500 hover:text-slate-900">
          &larr; Back
        </Link>
        <h1 className="text-2xl font-bold text-slate-800">Payment Details</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Transaction Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Transaction</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-slate-500">System ID</div>
            <div className="font-mono">{payment.id}</div>
            
            <div className="text-slate-500">Gateway Ref</div>
            <div className="font-mono">{payment.providerTxId || "N/A"}</div>
            
            <div className="text-slate-500">Status</div>
            <div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payment.status === "successful" ? "bg-green-100 text-green-700" :
                    payment.status === "failed" ? "bg-red-100 text-red-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {payment.status}
              </span>
            </div>
            
            <div className="text-slate-500">Date</div>
            <div>{format(new Date(payment.paymentDate), "PPpp")}</div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">User</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-slate-500">Name</div>
            <div>{payment.user?.name}</div>
            
            <div className="text-slate-500">Email</div>
            <div>{payment.user?.email}</div>
            
            <div className="text-slate-500">User ID</div>
            <div className="font-mono truncate" title={payment.userId}>{payment.userId}</div>
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Financials</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-slate-500">Gross Amount</div>
            <div className="font-semibold">₹{(payment.amount / 100).toFixed(2)}</div>
            
            <div className="text-slate-500">Refunded</div>
            <div className="text-red-600">₹{(payment.refundAmount / 100).toFixed(2)}</div>
            
            <div className="text-slate-500">Net Revenue</div>
            <div className="font-semibold text-green-600">₹{((payment.amount - payment.refundAmount) / 100).toFixed(2)}</div>
            
            <div className="text-slate-500">Currency</div>
            <div>{payment.currency}</div>
          </div>
        </div>

        {/* Subscription Info */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Subscription</h2>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div className="text-slate-500">Plan Name</div>
            <div className="capitalize">{payment.subscription?.plan}</div>
            
            <div className="text-slate-500">Cycle</div>
            <div className="capitalize">{payment.subscription?.cycle}</div>
            
            <div className="text-slate-500">Sub Status</div>
            <div className="capitalize">{payment.subscription?.status}</div>
          </div>
        </div>

      </div>

      {(admin as any).role === "SUPERADMIN" && isRefundable && remainingRefundable > 0 && (
        <div className="mt-6">
          <RefundClient 
            paymentId={payment.id} 
            maxRefund={remainingRefundable} 
            providerTxId={payment.providerTxId!}
          />
        </div>
      )}
    </main>
  );
}
