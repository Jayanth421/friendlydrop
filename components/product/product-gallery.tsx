"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(images[0]);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <Image src={selected} alt={title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      <div className="grid grid-cols-4 gap-2">
        {images.map((image) => (
          <button
            key={image}
            onClick={() => setSelected(image)}
            className={`relative aspect-square overflow-hidden rounded-xl border ${selected === image ? "border-ink" : "border-slate-200"}`}
          >
            <Image src={image} alt={`${title} thumbnail`} fill className="object-cover" sizes="120px" />
          </button>
        ))}
      </div>
    </div>
  );
}
