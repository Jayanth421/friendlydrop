import { getAdminDb } from "@/lib/firebase/admin";
import { getProducts, getAllOrders, getAllUsers } from "@/lib/firebase/firestore";
import { VendorPayout, SupportTicket, Order, Product, UserProfile } from "@/types";

export async function getVendorPayouts(vendorId: string): Promise<VendorPayout[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("vendor_payouts")
    .where("vendorId", "==", vendorId)
    .orderBy("createdAt", "desc")
    .get();
    
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VendorPayout));
}

export async function requestVendorPayout(payout: Omit<VendorPayout, "id" | "status" | "createdAt">): Promise<void> {
  const db = getAdminDb();
  await db.collection("vendor_payouts").add({
    ...payout,
    status: "pending",
    createdAt: new Date().toISOString()
  });
}

export async function getVendorSupportTickets(vendorId: string): Promise<SupportTicket[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("support_tickets")
    .where("vendorId", "==", vendorId)
    .orderBy("createdAt", "desc")
    .get();
    
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SupportTicket));
}

export async function getVendorOrders(vendorId: string): Promise<{ vendorOrders: Order[], vendorProducts: Product[] }> {
  const products = await getProducts({ vendorId });
  const productIds = new Set(products.map(p => p.id));
  
  const allOrders = await getAllOrders();
  
  // Filter orders to only those that contain at least one of the vendor's products
  const vendorOrders = allOrders.filter(order => 
    order.items.some(item => productIds.has(item.productId))
  );

  return { vendorOrders, vendorProducts: products };
}

export async function getVendorCustomers(vendorId: string): Promise<UserProfile[]> {
  const { vendorOrders } = await getVendorOrders(vendorId);
  const customerIds = [...new Set(vendorOrders.map(o => o.userId))];
  
  const allUsers = await getAllUsers();
  return allUsers.filter(user => customerIds.includes(user.id));
}

export async function getVendorReviews(vendorId: string): Promise<any[]> {
  const products = await getProducts({ vendorId });
  const productIds = new Set(products.map(p => p.id));
  
  const db = getAdminDb();
  const snapshot = await db.collection("reviews").get();
  
  const vendorReviews = snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .filter((r: any) => productIds.has(r.productId));
    
  return vendorReviews;
}
