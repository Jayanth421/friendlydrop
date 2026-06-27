import { unstable_cache } from "next/cache";
import { getStoreSettingsSafe } from "@/lib/firebase/firestore";

export const getCachedStoreSettings = unstable_cache(
  async () => {
    return getStoreSettingsSafe({ logLabel: "cache" });
  },
  ["store-settings"],
  {
    revalidate: 60,
    tags: ["store-settings"],
  }
);
