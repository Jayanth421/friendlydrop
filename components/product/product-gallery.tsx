"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(images[0]);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden bg-[#f3f3f3]">
        <div className="relative aspect-[4/5] w-full">
          <Image
            src={selected}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 55vw"
            priority
          />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {images.map((image) => (
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
            <Image src={image} alt={`${title} thumbnail`} fill className="object-cover" sizes="120px" />
          </button>
        ))}
      </div>
    </div>
  );
}
