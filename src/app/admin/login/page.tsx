import { AdminLoginForm } from "@/components/admin/auth/AdminLoginForm";
import { currentUserId } from "@/server/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/server/db";

export const metadata = {
  title: "Admin Login | Avexora Tools",
};

export default async function AdminLoginPage() {
  const userId = await currentUserId();
  
  // If already authenticated, check if they have admin access
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (user?.role && ["superadmin", "admin", "editor"].includes(user.role.toLowerCase().replace('_', ''))) {
      redirect("/admin");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <AdminLoginForm />
    </div>
  );
}
