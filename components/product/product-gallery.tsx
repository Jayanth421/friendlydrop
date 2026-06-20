"use client";

import { useState } from "react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(images[0]);
  const selectedUrl = resolveMediaUrl(selected, { width: 1200, quality: 75, format: "webp" }) || "/file.svg";

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden bg-[#f3f3f3]">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={selectedUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((image) => {
          const thumbUrl = resolveMediaUrl(image, { width: 240, quality: 70, format: "webp" }) || "/file.svg";
          return (
          <button
            key={image}
            onClick={() => setSelected(image)}
            className={`relative aspect-[4/5] overflow-hidden border transition ${
              selected === image
                ? "border-[#262626]"
                : "border-[#dddbdc] hover:border-[#a7a7a7]"
            }`}
            aria-label="Select product image"
          >
            <Image src={thumbUrl} alt={`${title} thumbnail`} fill className="object-cover" sizes="120px" />
          </button>
          );
        })}
      </div>
    </div>
  );
}
