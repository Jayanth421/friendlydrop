import { AdminPermission, UserRole } from "@/types";

const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard:view",
  "products:manage",
  "orders:manage",
  "users:manage",
  "reviews:manage",
  "coupons:manage",
  "inventory:manage",
  "payments:view",
  "reports:export",
  "settings:manage",
  "team:manage",
  "support:manage",
  "returns:manage",
  "marketing:manage",
  "logs:view",
];

const STAFF_PERMISSIONS: AdminPermission[] = [
  "dashboard:view",
  "orders:manage",
  "users:manage",
  "reviews:manage",
  "inventory:manage",
  "support:manage",
  "returns:manage",
  "payments:view",
];

const ADMIN_PERMISSIONS: AdminPermission[] = [
  ...STAFF_PERMISSIONS,
  "products:manage",
  "coupons:manage",
  "reports:export",
  "marketing:manage",
  "logs:view",
];

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  user: [],
  staff: STAFF_PERMISSIONS,
  admin: ADMIN_PERMISSIONS,
  super_admin: ALL_PERMISSIONS,
};

export function getRolePermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: UserRole, permission: AdminPermission) {
  if (role === "super_admin") {
    return true;
  }

  return getRolePermissions(role).includes(permission);
}

export function isAdminRole(role: UserRole) {
  return role === "staff" || role === "admin" || role === "super_admin";
}
