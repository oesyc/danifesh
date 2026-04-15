// src/components/HomeCategoryStrip.tsx
// Home page par categories strip — DB se dynamic
// Is component ko home page mein import karo aur static CATEGORIES array hatao

"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Category = {
  id:       string
  name:     string
  slug:     string
  imageUrl: string | null
  _count:   { products: number }
}

// Fallback images agar DB mein imageUrl nahi
const FALLBACKS = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=70",
  "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&q=70",
  "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=70",
  "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=70",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70",
]

export default function HomeCategoryStrip() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    fetch("/api/nav/categories")
      .then(r => r.json())
      .then(d => setCategories(d.categories ?? []))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-gray-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {categories.map((cat, i) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer block"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cat.imageUrl ?? FALLBACKS[i % FALLBACKS.length]}
            alt={cat.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2f403b]/80 via-transparent to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p
              className="text-white font-black text-lg leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {cat.name}
            </p>
            <p className="text-[#c8d9d3] text-xs mt-0.5">{cat._count.products} items</p>
          </div>
        </Link>
      ))}

      {/* View All tile */}
      <Link
        href="/shop"
        className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer block bg-[#3f554f] flex flex-col items-center justify-center text-center p-6"
      >
        <div className="w-12 h-12 border-2 border-white/30 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
        <p className="text-white font-black text-base leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          View All
        </p>
        <p className="text-[#c8d9d3] text-xs mt-0.5">Shop everything</p>
      </Link>
    </div>
  )
}