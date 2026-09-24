"use server";

import { prisma } from "@/server/db";
import { authenticator } from "otplib";
import { randomBytes } from "crypto";
import { logAdminAction } from "@/server/audit";
import { currentUserId } from "@/server/auth";
import { createAdminSession } from "./admin-auth";
import bcrypt from "bcryptjs";

// Generates a 2FA secret and returns the otpauth URL for QR code generation
export async function generate2FASecretAction() {
  const userId = await currentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };

  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(user.email, "Avexora Admin", secret);

  // Store secret temporarily (don't enable yet)
  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorSecret: secret }
  });

  return { success: true, secret, otpauthUrl };
}

// Verifies the code and enables 2FA
export async function enable2FAAction(code: string) {
  const userId = await currentUserId();
  if (!userId) return { success: false, error: "Unauthorized" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) return { success: false, error: "Setup incomplete" };

  const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
  
  if (!isValid) {
    return { success: false, error: "Invalid authenticator code." };
  }

  // Generate 8 recovery codes
  const plaintextCodes = Array.from({ length: 8 }, () => randomBytes(4).toString("hex"));
  
  // Hash recovery codes before saving
  const hashedCodes = await Promise.all(plaintextCodes.map(code => bcrypt.hash(code, 10)));

  await prisma.user.update({
    where: { id: userId },
    data: { 
      twoFactorEnabled: true,
      recoveryCodes: hashedCodes
    }
  });

  await logAdminAction({
    action: "LOGIN", // Add to audit types later
    targetType: "USER",
    targetId: userId,
    metadata: { action: "two_factor_enabled" }
  });

  // Return plaintext codes ONCE for the user to copy
  return { success: true, recoveryCodes: plaintextCodes };
}

// Verifies a 2FA code during login
export async function verify2FALoginAction(userId: string, code: string, rememberMe: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "Invalid state." };
  }

  // Check if it's a TOTP code
  let isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });

  // If not TOTP, check if it's a recovery code
  if (!isValid && user.recoveryCodes && user.recoveryCodes.length > 0) {
    for (let i = 0; i < user.recoveryCodes.length; i++) {
      const isMatch = await bcrypt.compare(code, user.recoveryCodes[i]);
      if (isMatch) {
        isValid = true;
        // Invalidate this recovery code
        const remainingCodes = [...user.recoveryCodes];
        remainingCodes.splice(i, 1);
        await prisma.user.update({
          where: { id: userId },
          data: { recoveryCodes: remainingCodes }
        });
        
        await logAdminAction({
          action: "LOGIN",
          targetType: "USER",
          targetId: userId,
          metadata: { action: "recovery_code_used" }
        });
        break;
      }
    }
  }

  if (!isValid) {
    return { success: false, error: "Invalid code." };
  }

  // Generate session since 2FA passed
  return await createAdminSession(user, rememberMe);
}
