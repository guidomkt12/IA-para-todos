import type { OrganizationRole } from "./types";

const permissions = {
  managePlatform: ["platform_admin"],
  manageBilling: ["platform_admin", "owner"],
  manageSettings: ["platform_admin", "owner", "admin"],
  manageTeam: ["platform_admin", "owner", "admin"],
  manageSchedule: ["platform_admin", "owner", "admin", "receptionist", "professional"],
  manageConversations: ["platform_admin", "owner", "admin", "receptionist"],
  viewReports: ["platform_admin", "owner", "admin", "receptionist", "professional", "viewer"],
} as const;

export type Permission = keyof typeof permissions;

export function can(role: OrganizationRole, permission: Permission): boolean {
  return (permissions[permission] as readonly OrganizationRole[]).includes(role);
}
