import { describe, it, expect } from "vitest";
import { hasPermission, Role, Permission } from "../src/lib/admin/permissions";

describe("Admin Permissions RBAC Engine", () => {
  it("SUPER_ADMIN should have highest permission set", () => {
    expect(hasPermission("superadmin", "dashboard.view")).toBe(true);
    expect(hasPermission("superadmin", "tools.edit")).toBe(true);
    expect(hasPermission("superadmin", "users.change_role")).toBe(true);
  });

  it("ADMIN should have expected operational permissions", () => {
    expect(hasPermission("admin", "tools.view")).toBe(true);
    expect(hasPermission("admin", "tools.edit")).toBe(true);
  });

  it("ADMIN should be restricted from role management", () => {
    expect(hasPermission("admin", "roles.manage")).toBe(false);
  });

  it("EDITOR should have limited content permissions", () => {
    expect(hasPermission("editor", "tools.view")).toBe(true);
    expect(hasPermission("editor", "seo.edit")).toBe(true);
    expect(hasPermission("editor", "users.change_role")).toBe(false);
    expect(hasPermission("editor", "settings.edit")).toBe(false);
  });

  it("USER should have no Admin permissions", () => {
    expect(hasPermission("user", "tools.edit")).toBe(false);
    expect(hasPermission("user", "users.view")).toBe(false);
  });

  it("Unknown Role should fail closed", () => {
    // Typecast to bypass TS for test
    expect(hasPermission("UNKNOWN_ROLE" as any, "tools.edit")).toBe(false);
  });

  it("Unknown Permission should fail closed", () => {
    expect(hasPermission("admin", "unknown.permission" as any)).toBe(false);
  });
});
