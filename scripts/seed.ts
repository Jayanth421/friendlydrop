import { nanoid } from "nanoid";
import { createSlug } from "../lib/utils";
import { FALLBACK_COUPONS, FALLBACK_PRODUCTS } from "../lib/mock-data";
import { getAdminDb } from "../lib/firebase/admin";

async function seedProducts() {
  const batch = getAdminDb().batch();

  FALLBACK_PRODUCTS.forEach((product) => {
    const id = product.id.startsWith("sample") ? nanoid(14) : product.id;
    const ref = getAdminDb().collection("products").doc(id);
    batch.set(ref, {
      ...product,
      id,
      slug: createSlug(product.name),
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
}

async function seedCoupons() {
  const batch = getAdminDb().batch();

  FALLBACK_COUPONS.forEach((coupon) => {
    const ref = getAdminDb().collection("coupons").doc(coupon.id);
    batch.set(ref, {
      ...coupon,
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
}

async function run() {
  await seedProducts();
  await seedCoupons();
  console.log("Seed complete");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
