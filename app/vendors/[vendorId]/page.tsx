import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVendorProfile, getProducts } from "@/lib/firebase/firestore";
import { ProductGrid } from "@/components/product/product-grid";
import { Store, CalendarDays } from "lucide-react";

export async function generateMetadata({ params }: { params: { vendorId: string } }): Promise<Metadata> {
  const vendor = await getVendorProfile(params.vendorId);
  if (!vendor) {
    return { title: "Store Not Found" };
  }

  return {
    title: `${vendor.businessName} Store`,
    description: `Shop products from ${vendor.businessName} on our platform`,
  };
}

export default async function VendorStorePage({ params }: { params: { vendorId: string } }) {
  const vendor = await getVendorProfile(params.vendorId);
  
  if (!vendor) {
    notFound();
  }

  const products = await getProducts({ vendorId: vendor.id, status: "published" });

  const joinDate = new Date(vendor.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric"
  });

  return (
    <main className="min-h-screen bg-[#f7f7f7] pb-24">
      {/* Store Header */}
      <div className="bg-white border-b border-[#ecebeb]">
        <div className="mx-auto max-w-[1400px] px-4 py-8 md:px-10 lg:py-12">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left sm:items-start sm:gap-6">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] border border-[#dddbdc] text-[#a1a1a1]">
              <Store className="h-10 w-10" />
            </div>
            
            <div className="space-y-3 pt-2">
              <h1 className="text-3xl font-bold text-[#11121c] lg:text-4xl">{vendor.businessName}</h1>
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-[#737373] sm:justify-start">
                <div className="flex items-center gap-1.5 bg-[#f4f4f4] px-3 py-1 rounded-full border border-[#ecebeb]">
                  <Store className="h-3.5 w-3.5" />
                  <span>Verified Seller</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4" />
                  <span>Joined {joinDate}</span>
                </div>
              </div>
              {vendor.settings?.description && (
                <p className="max-w-2xl text-sm leading-relaxed text-[#555]">
                  {vendor.settings.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-10">
        <h2 className="mb-6 text-xl font-bold text-[#11121c]">All Products ({products.length})</h2>
        {products.length > 0 ? (
          <ProductGrid products={products} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dddbdc] bg-white py-20 text-center">
            <Store className="mb-4 h-12 w-12 text-[#d4d4d4]" />
            <h3 className="text-lg font-medium text-[#262626]">No products yet</h3>
            <p className="mt-1 text-sm text-[#737373]">This seller hasn&apos;t published any products.</p>
          </div>
        )}
      </div>
    </main>
  );
}
