import { Badge } from "@/components/ui/badge";

const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  confirmed: "default",
  packed: "default",
  shipped: "default",
  delivered: "default",
  returned: "destructive",
  cancelled: "destructive",
  refunded: "destructive",
  approved: "default",
  rejected: "destructive",
  flagged: "destructive",
  open: "secondary",
  in_progress: "outline",
  resolved: "default",
  initiated: "secondary",
  success: "default",
  failed: "destructive",
};

export function StatusPill({ status }: { status: string }) {
  return <Badge variant={statusMap[status] ?? "outline"}>{status.replace("_", " ")}</Badge>;
}
