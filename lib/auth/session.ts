import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAdminAuth, getUserDisplayName } from "@/lib/firebase/admin";
import { getUserById } from "@/lib/firebase/firestore";
import { hasPermission, isAdminRole, isVendorRole } from "@/lib/rbac";
import { AdminPermission, UserRole } from "@/types";

/** Detect whether the current request is on a specific subdomain. */
function currentSubdomain(): "admin" | "vendor" | null {
  try {
    const host = (headers().get("host") ?? "").split(":")[0].toLowerCase();
    if (host === "admin.friendlydrop.in" || host === "admin.localhost") return "admin";
    if (host === "vendor.friendlydrop.in" || host === "vendor.localhost") return "vendor";
  } catch {
    // headers() not available outside request scope
  }
  return null;
}

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
    const userData = await getUserById(decoded.uid);

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: userData?.name ?? getUserDisplayName(decoded),
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
    // On admin subdomain stay within it; otherwise redirect to subdomain
    const sub = currentSubdomain();
    redirect(sub === "admin" ? "/access-denied" : "/admin/access-denied");
  }

  return user;
}

export async function requireAdminPermission(permission: AdminPermission) {
  const user = await requireAdmin();

  if (!hasPermission(user.role, permission)) {
    const sub = currentSubdomain();
    redirect(sub === "admin" ? "/control-tower" : "/admin/control-tower");
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
