import { AdminPermission, UserRole } from "@/types";

const ALL_PERMISSIONS: AdminPermission[] = [
  "dashboard:view",
  "analytics:view",
  "products:manage",
  "catalog:manage",
  "vendors:manage",
  "banners:manage",
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
  "analytics:view",
  "products:manage",
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
  "catalog:manage",
  "banners:manage",
  "coupons:manage",
  "reports:export",
  "marketing:manage",
  "logs:view",
];

const MANAGER_PERMISSIONS: AdminPermission[] = [
  ...STAFF_PERMISSIONS,
  "products:manage",
  "catalog:manage",
  "vendors:manage",
  "banners:manage",
  "coupons:manage",
  "marketing:manage",
  "reports:export",
];

const ROLE_PERMISSIONS: Record<UserRole, AdminPermission[]> = {
  user: [],
  vendor: [],
  staff: STAFF_PERMISSIONS,
  manager: MANAGER_PERMISSIONS,
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
  return role === "staff" || role === "manager" || role === "admin" || role === "super_admin";
}

export function isVendorRole(role: UserRole) {
  return role === "vendor";
}
