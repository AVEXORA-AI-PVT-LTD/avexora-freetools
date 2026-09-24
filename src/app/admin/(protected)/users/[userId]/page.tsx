import { requireAdminAuth } from "@/server/admin-auth";
import { prisma } from "@/server/db";
import { notFound } from "next/navigation";
import { UserDetailClient } from "./UserDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = { title: "User Details | Admin" };

export default async function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {

  const admin = await requireAdminAuth("users.view");
  const { userId } = await params;

  // Validate MongoDB ObjectId to prevent Prisma crashes
  if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
    notFound();
  }


  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      subscription: true,
      accounts: true,
      sessions: {
        orderBy: { expires: 'desc' },
        take: 5
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 20
      },
      _count: {
        select: { toolUsages: true }
      }
    }
  });

  if (!user) notFound();

  // Basic tool usage aggregation if they have usages
  let topTools: { slug: string; count: number }[] = [];
  if (user._count.toolUsages > 0) {
    const usageGroups = await prisma.toolUsage.groupBy({
      by: ['toolSlug'],
      where: { userId },
      _count: true,
      orderBy: { _count: { toolSlug: 'desc' } },
      take: 5
    });
    topTools = usageGroups.map(g => ({ slug: g.toolSlug, count: g._count }));
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link href="/admin/users" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-2">
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Users
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
      </div>

      <UserDetailClient 
        user={user} 
        topTools={topTools}
        adminRole={admin.role || "user"}
        adminId={admin.id}
      />
    </div>
  );
}
