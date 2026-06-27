/**
 * Shared Authentication Utilities for Multi-App Architecture
 * 
 * This module handles cross-domain authentication for:
 * - friendlydrop.in (main website)
 * - vendor.friendlydrop.in (vendor dashboard)
 * - admin.friendlydrop.in (admin dashboard)
 */

export interface UserRole {
  role: 'customer' | 'vendor' | 'admin' | 'super_admin';
  permissions: string[];
}

export interface AuthRedirectUrls {
  customer: string;
  vendor: string;
  admin: string;
}

export const DEFAULT_REDIRECT_URLS: AuthRedirectUrls = {
  customer: "/account",
  vendor: "https://vendor.friendlydrop.in/dashboard",
  admin: "https://admin.friendlydrop.in/dashboard"
};

export const LOCAL_REDIRECT_URLS: AuthRedirectUrls = {
  customer: "/account",
  vendor: "http://vendor.localhost:3002/dashboard", 
  admin: "http://admin.localhost:3001/dashboard"
};

/**
 * Determines the correct redirect URL based on user role and environment
 */
export function getRedirectUrlForRole(role: string, isLocal: boolean = false): string {
  const urls = isLocal ? LOCAL_REDIRECT_URLS : DEFAULT_REDIRECT_URLS;
  
  switch (role) {
    case 'vendor':
      return urls.vendor;
    case 'admin':
    case 'super_admin':
    case 'staff':
    case 'manager':
      return urls.admin;
    case 'customer':
    default:
      return urls.customer;
  }
}

/**
 * Creates authentication headers for cross-domain requests
 */
export function createAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Handles role-based redirection after successful login
 */
export function handleRoleBasedRedirect(role: string, customRedirect?: string) {
  const isLocal = window.location.hostname.includes('localhost');
  
  if (customRedirect && customRedirect.startsWith('/')) {
    // Use custom redirect if it's a relative path (same domain)
    window.location.href = customRedirect;
    return;
  }
  
  const redirectUrl = getRedirectUrlForRole(role, isLocal);
  
  if (redirectUrl.startsWith('http')) {
    // Cross-domain redirect
    window.location.href = redirectUrl;
  } else {
    // Same-domain redirect
    window.location.href = redirectUrl;
  }
}

/**
 * Checks if current user has required permissions for a route
 */
export function hasRequiredPermissions(userRole: UserRole, requiredPermissions: string[]): boolean {
  return requiredPermissions.every(permission => 
    userRole.permissions.includes(permission) || 
    userRole.permissions.includes('*') // Super admin permission
  );
}

/**
 * Logout user from all domains by clearing cookies and redirecting
 */
export function logoutFromAllDomains() {
  // Clear cookies from current domain
  document.cookie = 'friendlydrop_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  document.cookie = 'friendlydrop_refresh=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  
  // Redirect to main website login
  const isLocal = window.location.hostname.includes('localhost');
  const loginUrl = isLocal ? 'http://localhost:3000/login' : 'https://friendlydrop.in/login';
  
  window.location.href = loginUrl;
}