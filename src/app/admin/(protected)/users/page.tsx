import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { UsersClient } from "./UsersClient";

export const metadata = { title: "User Management | Admin" };

export default async function UsersAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const admin = await requireAdminAuth("users.view");
  const params = await searchParams;

  const page = Number(params.page) || 1;
  const limit = 25;
  const skip = (page - 1) * limit;

  const q = typeof params.q === "string" ? params.q : "";
  const role = typeof params.role === "string" ? params.role : "";
  const status = typeof params.status === "string" ? params.status : "";
  
  const where: any = {};
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (status) where.status = status;
  else where.status = { not: "DELETED" }; // hide soft deleted by default

  const [users, totalUsers] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        lastActiveAt: true,
        subscription: {
          select: { plan: true, status: true }
        }
      }
    }),
    prisma.user.count({ where })
  ]);

  // Aggregate stats
  const [totalActive, totalPremium, totalBlocked] = await Promise.all([
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "active", plan: { not: "free" } } }),
    prisma.user.count({ where: { status: "BLOCKED" } })
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <p className="mt-1 text-slate-600">Manage user accounts, roles, subscriptions, and access controls.</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500">Total Users</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalActive + totalBlocked}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500">Active Accounts</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{totalActive}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500">Premium Subscribers</div>
          <div className="text-2xl font-bold text-purple-600 mt-1">{totalPremium}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
          <div className="text-sm font-medium text-slate-500">Blocked</div>
          <div className="text-2xl font-bold text-red-600 mt-1">{totalBlocked}</div>
        </div>
      </div>

      <UsersClient 
        users={users} 
        total={totalUsers} 
        page={page} 
        limit={limit} 
        initialFilters={{ q, role, status }}
        adminRole={admin.role || "user"}
      />
    </div>
  );
}
