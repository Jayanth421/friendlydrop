"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const [selected, setSelected] = useState(images[0]);
  const [origin, setOrigin] = useState("50% 50%");

  return (
    <div className="space-y-3">
      <div
        className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-white"
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
      >
        <Image
          src={selected}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.45]"
          style={{ transformOrigin: origin }}
          sizes="(max-width: 1024px) 100vw, 50vw"
        />
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
