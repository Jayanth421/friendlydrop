"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      // Call the logout API endpoint
      const response = await fetch("/api/auth/session", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Redirect to home page
        router.push("/");
        router.refresh();
      } else {
        console.error("Logout failed");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white shadow-lg">
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="absolute right-4 top-4 p-1 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5 text-stone-500" />
        </button>

        {/* Header with icon */}
        <div className="flex items-start gap-4 border-b border-stone-200 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
            <LogOut className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-stone-900">Confirm Logout</h2>
            <p className="text-sm text-stone-600 mt-1">
              Are you sure you want to logout from your admin panel?
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-sm text-stone-600">
            You will be redirected to the login page and your session will be terminated.
          </p>
        </div>

        {/* Footer with buttons */}
        <div className="flex gap-3 border-t border-stone-200 p-6 justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleLogout}
            disabled={isLoading}
            className="gap-2 rounded-lg"
          >
            <LogOut className="h-4 w-4" />
            {isLoading ? "Logging out..." : "Logout"}
          </Button>
        </div>
      </div>
    </div>
  );
}
