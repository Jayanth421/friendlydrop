import { getAdminDb } from "./lib/firebase/admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  const db = getAdminDb();
  console.log("Fetching products...");
  const products = await db.collection("products").get();
  let hasVendorProduct = false;
  products.forEach(p => {
    const data = p.data();
    if (data.vendorId) {
      hasVendorProduct = true;
      console.log(`Product: ${data.name} (ID: ${p.id}) has vendorId: ${data.vendorId}`);
    }
  });

  if (!hasVendorProduct) {
    console.log("NO PRODUCTS HAVE A VENDOR ID.");
  }

  console.log("\nFetching vendor profiles...");
  const vendors = await db.collection("vendor_profiles").get();
  vendors.forEach(v => {
    console.log(`Vendor: ${v.data().businessName} (ID: ${v.id})`);
  });
  if (vendors.empty) {
    console.log("NO VENDOR PROFILES FOUND.");
  }
}

run().catch(console.error);
