import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_2FA_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAdminAuth, getAdminDb } from "@/lib/firebase/admin";
import { hasPermission, isAdminRole, isVendorRole } from "@/lib/rbac";
import { AdminPermission, UserRole } from "@/types";

export interface SessionUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  twoFactorEnabled: boolean;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const userDoc = await getAdminDb().collection("users").doc(decoded.uid).get();
    const userData = userDoc.data();

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: userData?.name ?? decoded.name ?? "Customer",
      role: userData?.role ?? "user",
      twoFactorEnabled: Boolean(userData?.twoFactorEnabled),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!isAdminRole(user.role)) {
    redirect("/");
  }

  if (user.twoFactorEnabled && !cookies().get(ADMIN_2FA_COOKIE_NAME)?.value) {
    redirect("/admin-2fa");
  }

  return user;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await requireAdmin();

  if (!hasPermission(user.role, permission)) {
    redirect("/admin/dashboard");
  }

  return user;
}

export async function requireVendorOrAdmin() {
  const user = await requireUser();

  if (!(isVendorRole(user.role) || isAdminRole(user.role))) {
    redirect("/");
  }

  return user;
}
