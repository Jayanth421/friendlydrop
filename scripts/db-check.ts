import { getAdminDb } from "../lib/firebase/admin";

async function checkDb() {
  const collections = ["products", "categories", "banners", "vendors", "orders", "users"];
  console.log("Checking Firestore collections...\n");
  for (const colName of collections) {
    try {
      const snapshot = await getAdminDb().collection(colName).get();
      console.log(`- Collection "${colName}": ${snapshot.size} documents`);
      if (snapshot.size > 0) {
        console.log("  Sample IDs:", snapshot.docs.slice(0, 3).map(d => d.id).join(", "));
      }
    } catch (e: any) {
      console.error(`- Error checking "${colName}":`, e.message);
    }
  }
}

checkDb().catch(console.error);
