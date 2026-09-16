import { z } from "zod";

export const ALLOWED_ROLES = ["user", "editor", "admin", "superadmin"] as const;

export const UpdateRoleSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(ALLOWED_ROLES),
});
