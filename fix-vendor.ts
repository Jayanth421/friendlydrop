import { getAdminDb } from "./lib/firebase/admin";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function run() {
  const db = getAdminDb();
  const vendorId = "zgJBuKIHOBdlChR8eAcvVl0tKTS2";
  
  await db.collection("vendor_profiles").doc(vendorId).set({
    id: vendorId,
    businessName: "Goo Official Store",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "active",
    settings: {
      description: "Welcome to Goo Official Store!",
    }
  });

  console.log("Created vendor profile for", vendorId);
}

run().catch(console.error);
