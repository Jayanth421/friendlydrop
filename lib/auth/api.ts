import { NextRequest } from "next/server";
import { ADMIN_2FA_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/constants";
import { getAdminAuth } from "@/lib/firebase/admin";
import { getUserById } from "@/lib/firebase/firestore";
import { hasPermission, isAdminRole } from "@/lib/rbac";
import { AdminPermission, UserRole } from "@/types";

export interface RequestUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  twoFactorEnabled: boolean;
}

export async function getRequestUser(request: NextRequest): Promise<RequestUser | null> {
  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const profile = await getUserById(decoded.uid);

    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: profile?.name ?? decoded.name ?? "Customer",
      role: profile?.role ?? "user",
      twoFactorEnabled: Boolean(profile?.twoFactorEnabled),
    };
  } catch {
    return null;
  }
}

export async function requireApiUser(request: NextRequest) {
  const user = await getRequestUser(request);

  if (!user) {
    throw new Error("UNAUTHORIZED");
  }

  return user;
}

export async function requireApiAdmin(request: NextRequest) {
  const user = await requireApiUser(request);

  if (!isAdminRole(user.role)) {
    throw new Error("FORBIDDEN");
  }

  if (user.twoFactorEnabled && !request.cookies.get(ADMIN_2FA_COOKIE_NAME)?.value) {
    throw new Error("2FA_REQUIRED");
  }

  return user;
}

export async function requireApiPermission(request: NextRequest, permission: AdminPermission) {
  const user = await requireApiAdmin(request);

  if (!hasPermission(user.role, permission)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}
