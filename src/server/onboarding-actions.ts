"use server";

import { requireUserId } from "@/server/auth";
import { prisma } from "@/server/db";
import { revalidatePath } from "next/cache";

export async function completeOnboarding(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const jobRole = String(formData.get("jobRole") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const referralCode = String(formData.get("referralCode") ?? "").trim();
  
  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      name,
      companyName: companyName || null,
      jobRole: jobRole || null,
      phone: phone || null,
      referralCodeUsed: referralCode || null,
      isOnboarded: true, 
    },
  });

  revalidatePath("/", "layout");
}

export async function updateAccountDetails(formData: FormData) {
  const userId = await requireUserId();
  const name = String(formData.get("name") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim();
  const jobRole = String(formData.get("jobRole") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  
  if (!name) {
    throw new Error("Name is required");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { 
      name,
      companyName: companyName || null,
      jobRole: jobRole || null,
      phone: phone || null,
    },
  });

  revalidatePath("/studio/account");
}
