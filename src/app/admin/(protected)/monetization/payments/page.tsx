import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import Link from "next/link";
import { formatINR } from "@/server/studio/plans";
import { format } from "date-fns";

export const metadata = {
  title: "Payments | Avex Tools Admin",
};

export default async function PaymentsAdminPage(props: {
  searchParams: Promise<{ page?: string }>
}) {
  await requireAdminAuth("settings.view" as any);
  
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || "1") || 1;
  const take = 30;
  const skip = (page - 1) * take;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        subscription: { select: { plan: true } }
      },
      orderBy: { paymentDate: "desc" },
      skip,
      take,
    }),
    prisma.payment.count()
  ]);

  const totalPages = Math.ceil(total / take);

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Payment Ledger</h1>
          <p className="mt-2 text-sm text-slate-500">
            A chronological record of all subscription charges captured via Razorpay webhooks.
          </p>
        </div>
      </div>

      <div className="bg-white shadow-sm overflow-hidden sm:rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tx ID</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {payments.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {format(new Date(p.paymentDate), 'MMM d, yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-slate-900">
                    <Link href={`/admin/users/${p.user.id}`} className="hover:underline">{p.user.name}</Link>
                  </div>
                  <div className="text-sm text-slate-500">{p.user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 capitalize">
                  {p.subscription?.plan || "Unknown"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {formatINR(p.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                    p.status === 'successful' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                  {p.providerTxId}
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  No payment records found. Payments are synced automatically via Razorpay webhooks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-slate-200 sm:px-6 flex justify-between items-center">
            <div className="text-sm text-slate-700">
              Showing page <span className="font-medium">{page}</span> of <span className="font-medium">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/admin/monetization/payments?page=${page - 1}`}
                className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md bg-white hover:bg-slate-50 ${page <= 1 ? 'pointer-events-none opacity-50' : 'text-slate-700'}`}
              >
                Previous
              </Link>
              <Link
                href={`/admin/monetization/payments?page=${page + 1}`}
                className={`relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md bg-white hover:bg-slate-50 ${page >= totalPages ? 'pointer-events-none opacity-50' : 'text-slate-700'}`}
              >
                Next
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
