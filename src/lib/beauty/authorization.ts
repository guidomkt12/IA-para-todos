export type OrganizationRole = "platform_admin" | "owner" | "admin" | "receptionist" | "professional" | "viewer";
export type Permission = "manageBilling" | "manageSettings" | "manageTeam" | "manageSchedule" | "manageConversations" | "viewReports";
const matrix: Record<Permission, OrganizationRole[]> = {
  manageBilling: ["platform_admin", "owner"],
  manageSettings: ["platform_admin", "owner", "admin"],
  manageTeam: ["platform_admin", "owner", "admin"],
  manageSchedule: ["platform_admin", "owner", "admin", "receptionist", "professional"],
  manageConversations: ["platform_admin", "owner", "admin", "receptionist"],
  viewReports: ["platform_admin", "owner", "admin", "receptionist", "professional", "viewer"],
};
export const can = (role: OrganizationRole, permission: Permission) => matrix[permission].includes(role);
