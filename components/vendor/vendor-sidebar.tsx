"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Package,
  Archive,
  ShoppingCart,
  Users,
  Wallet,
  Receipt,
  Star,
  Tag,
  Truck,
  MessageSquare,
  Settings,
  MoreVertical,
  User,
  Lock,
  Phone,
  X,
  ChevronRight,
  Mail,
  Store,
  Loader2,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

const navigationSections: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/vendor/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    title: "Store Management",
    items: [
      { href: "/vendor/products", label: "Products", icon: Package },
      { href: "/vendor/inventory", label: "Inventory", icon: Archive },
      { href: "/vendor/orders", label: "Orders", icon: ShoppingCart },
      { href: "/vendor/customers", label: "Customers", icon: Users },
    ],
  },
  {
    title: "Finances",
    items: [
      { href: "/vendor/wallet", label: "Wallet & Payouts", icon: Wallet },
      { href: "/vendor/invoices", label: "Invoices", icon: Receipt },
    ],
  },
  {
    title: "Growth",
    items: [
      { href: "/vendor/reviews", label: "Reviews", icon: Star },
      { href: "/vendor/shipping", label: "Shipping", icon: Truck },
    ],
  },
  {
    title: "Support",
    items: [
      { href: "/vendor/messages", label: "Messages", icon: MessageSquare },
      { href: "/vendor/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

// ─── Edit Profile Modal ────────────────────────────────────────────────────
type EditTab = "username" | "password" | "mobile";

function EditProfileModal({
  name,
  email,
  phone,
  onClose,
}: {
  name: string;
  email: string;
  phone?: string;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<EditTab>("username");
  const [newName, setNewName] = useState(name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mobile, setMobile] = useState(phone ?? "");
  const [showPass, setShowPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tabs: { id: EditTab; label: string; icon: typeof User }[] = [
    { id: "username", label: "Display Name", icon: User },
    { id: "password", label: "Password", icon: Lock },
    { id: "mobile", label: "Mobile Number", icon: Phone },
  ];

  const handleSave = async () => {
    setError(null);
    if (activeTab === "password") {
      if (newPassword !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }
    }
    if (activeTab === "mobile") {
      if (!/^[6-9]\d{9}$/.test(mobile)) {
        setError("Please enter a valid 10-digit Indian mobile number");
        return;
      }
    }

    setSaving(true);
    try {
      const body: Record<string, string> = {};
      if (activeTab === "username") body.name = newName;
      if (activeTab === "password") {
        body.currentPassword = currentPassword;
        body.newPassword = newPassword;
      }
      if (activeTab === "mobile") body.phone = mobile;

      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Failed to save");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
          <h2 className="text-base font-semibold text-stone-900">
            Edit Profile
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-100 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError(null);
                  setSaved(false);
                }}
                className={cn(
                  "flex items-center gap-2 py-3 px-1 mr-4 text-sm font-medium border-b-2 transition -mb-px",
                  activeTab === tab.id
                    ? "border-stone-900 text-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-700"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4">
          {activeTab === "username" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">
                Display Name
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="h-10 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
                placeholder="Your display name"
              />
              <p className="text-xs text-stone-400">
                This name appears on your vendor profile and products.
              </p>
            </div>
          )}

          {activeTab === "password" && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-stone-200 px-3 pr-10 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-stone-200 px-3 pr-10 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
                    placeholder="New password (min 6 chars)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400"
                  >
                    {showNewPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-stone-700">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 w-full rounded-xl border border-stone-200 px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          )}

          {activeTab === "mobile" && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="flex h-10 items-center rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-stone-600 select-none shrink-0">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) =>
                    setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  className="h-10 flex-1 rounded-xl border border-stone-200 px-3 text-sm text-stone-900 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition"
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>
              <p className="text-xs text-stone-400">
                Required for order notifications and e-commerce verification.
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              Changes saved successfully
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-stone-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800 transition disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── User Info Popover ─────────────────────────────────────────────────────
function UserInfoPopover({
  name,
  email,
  phone,
  onClose,
  onEdit,
}: {
  name: string;
  email: string;
  phone?: string;
  onClose: () => void;
  onEdit: (tab: EditTab) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-[calc(100%+8px)] z-50 w-64 rounded-2xl border border-stone-200 bg-white shadow-xl"
    >
      <div className="px-4 py-4 border-b border-stone-100">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-900 text-white text-sm font-bold mb-3">
          {name.charAt(0).toUpperCase()}
        </div>
        <p className="font-semibold text-stone-900 text-sm">{name}</p>
        {email && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-stone-500">
            <Phone className="h-3 w-3 shrink-0" />
            <span>+91 {phone}</span>
          </div>
        )}
        {!phone && (
          <button
            type="button"
            onClick={() => onEdit("mobile")}
            className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 font-medium"
          >
            <Phone className="h-3 w-3" />
            Add mobile number
          </button>
        )}
      </div>
      <div className="px-2 py-2">
        {(
          [
            {
              tab: "username" as EditTab,
              label: "Edit Display Name",
              icon: User,
            },
            { tab: "password" as EditTab, label: "Change Password", icon: Lock },
            {
              tab: "mobile" as EditTab,
              label: "Update Mobile Number",
              icon: Phone,
            },
          ] as { tab: EditTab; label: string; icon: typeof User }[]
        ).map(({ tab, label, icon: Icon }) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              onEdit(tab);
              onClose();
            }}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-100 transition"
          >
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-stone-500" />
              {label}
            </span>
            <ChevronRight className="h-3.5 w-3.5 text-stone-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Sidebar Component ────────────────────────────────────────────────
export function VendorSidebar({
  name,
  email = "",
  phone,
}: {
  name: string;
  email?: string;
  phone?: string;
}) {
  const pathname = usePathname();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [showDotsMenu, setShowDotsMenu] = useState(false);
  const [editTab, setEditTab] = useState<EditTab | null>(null);

  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dotsRef.current && !dotsRef.current.contains(e.target as Node)) {
        setShowDotsMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <>
      <Sidebar className="border-r border-stone-200 bg-white/95 shadow-[0_12px_40px_-24px_rgba(17,24,39,0.45)] backdrop-blur">
        <SidebarHeader className="border-b border-stone-200 px-5 py-5">
          {/* Logo + Brand Row */}
          <div className="flex items-center gap-3 w-full mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm shrink-0 overflow-hidden border border-stone-100">
              <img
                src="https://dl.oqens.me/oq-T558-ZGAC-779/WhatsApp_Image_2026-03-29_at_16.39.58-removebg-preview.png"
                alt="FriendlyDrop Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 truncate">
                FriendlyDrop
              </p>
              <h1 className="mt-0.5 text-base font-semibold text-stone-900 truncate">
                Vendor Dashboard
              </h1>
            </div>
          </div>

          {/* Vendor Name + Dots Menu */}
          <div className="relative flex items-center justify-between gap-2 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2.5">
            {/* Clickable name area */}
            <button
              type="button"
              onClick={() => setShowUserInfo((v) => !v)}
              className="flex items-center gap-2 min-w-0 flex-1 text-left"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-900 text-white text-xs font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate leading-tight">
                  {name}
                </p>
                {email && (
                  <p className="text-xs text-stone-500 truncate leading-tight">
                    {email}
                  </p>
                )}
              </div>
            </button>

            {/* 3-dots menu */}
            <div ref={dotsRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowDotsMenu((v) => !v)}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-stone-400 hover:bg-stone-200 hover:text-stone-700 transition"
                title="Profile options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>

              {showDotsMenu && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl border border-stone-200 bg-white shadow-xl py-1">
                  {(
                    [
                      { tab: "username" as EditTab, label: "Edit Display Name", icon: User },
                      { tab: "password" as EditTab, label: "Change Password", icon: Lock },
                      { tab: "mobile" as EditTab, label: "Update Mobile", icon: Phone },
                    ] as { tab: EditTab; label: string; icon: typeof User }[]
                  ).map(({ tab, label, icon: Icon }) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setEditTab(tab);
                        setShowDotsMenu(false);
                      }}
                      className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition"
                    >
                      <Icon className="h-4 w-4 text-stone-500" />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* User info popover (shown when name is clicked) */}
            {showUserInfo && (
              <UserInfoPopover
                name={name}
                email={email}
                phone={phone}
                onClose={() => setShowUserInfo(false)}
                onEdit={(tab) => {
                  setEditTab(tab);
                  setShowUserInfo(false);
                }}
              />
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-4">
          {navigationSections.map((section) => {
            return (
              <SidebarGroup key={section.title}>
                <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  {section.title}
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const active = isItemActive(pathname, item.href);
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={active}
                            className={cn(
                              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition h-auto",
                              active
                                ? "border border-stone-900 bg-gradient-to-b from-stone-800 to-stone-900 text-white shadow-sm hover:bg-stone-800 hover:text-white"
                                : "border border-transparent text-stone-700 hover:border-stone-200 hover:bg-stone-100",
                            )}
                          >
                            <Link href={item.href}>
                              <Icon className="h-4 w-4 shrink-0" />
                              <span className="min-w-0 flex-1 truncate">
                                {item.label}
                              </span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </SidebarContent>
      </Sidebar>

      {/* Edit Profile Modal */}
      {editTab && (
        <EditProfileModal
          name={name}
          email={email}
          phone={phone}
          onClose={() => setEditTab(null)}
        />
      )}
    </>
  );
}
