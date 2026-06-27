import { requireVendorOrAdmin } from "@/lib/auth/session";
import { VendorMessagesContent } from "@/components/vendor/vendor-messages-content";

import { getVendorSupportTickets } from "@/lib/firebase/vendor";
import { isAdminRole } from "@/lib/rbac";
import { getAdminDb } from "@/lib/firebase/admin";
import { SupportTicket } from "@/types";

export const dynamic = "force-dynamic";

export default async function VendorMessagesPage() {
  const user = await requireVendorOrAdmin();
  const isInternalAdmin = isAdminRole(user.role);
  
  let tickets: SupportTicket[] = [];
  if (isInternalAdmin) {
    const db = getAdminDb();
    const snap = await db.collection("support_tickets").get();
    tickets = snap.docs.map(d => ({ id: d.id, ...d.data() } as SupportTicket));
  } else {
    tickets = await getVendorSupportTickets(user.uid);
  }

  return <VendorMessagesContent initialTickets={tickets} />;
}
