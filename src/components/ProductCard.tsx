"use client"
// src/components/ProductCard.tsx
// Exact same design as home page ProductCard — but with real DB types

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────
export type ProductCardData = {
  id: string
  name: string
  slug: string
  basePrice: number
  compareAtPrice: number | null
  stock: number
  isFeatured: boolean
  images: { url: string; altText: string | null }[]
  category: { name: string; slug: string }
  _count: { reviews: number }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (cents: number) => "Rs " + (cents / 100).toLocaleString("en-PK")

const discountPct = (base: number, compare: number) =>
  Math.round(((compare - base) / compare) * 100)

// ─── Tag Badge ────────────────────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    Featured: "bg-[#3f554f] text-white",
    Sale:     "bg-rose-500 text-white",
    New:      "bg-[#3f554f] text-white",
    "Out of Stock": "bg-gray-700 text-white",
  }
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${colors[tag] ?? "bg-gray-200 text-gray-700"}`}>
      {tag}
    </span>
  )
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="w-3.5 h-3.5 text-[#3f554f]" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
      <span className="text-[11px] text-gray-400 ml-0.5">({count})</span>
    </div>
  )
}

// ─── Main Card Component ──────────────────────────────────────────────────────
export default function ProductCard({ product }: { product: ProductCardData }) {
  const [hovered,    setHovered]    = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [adding,     setAdding]     = useState(false)
  const [added,      setAdded]      = useState(false)

  const inStock  = product.stock > 0
  const hasOffer = product.compareAtPrice && product.compareAtPrice > product.basePrice
  const pct      = hasOffer ? discountPct(product.basePrice, product.compareAtPrice!) : null

  // Primary image + second image for hover swap (same as home page)
  const img1 = product.images[0]?.url ?? "/placeholder.png"
  const img2 = product.images[1]?.url ?? img1

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault()
    if (!inStock || adding) return
    setAdding(true)
    try {
      await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      setAdded(true)
      window.dispatchEvent(new Event("cart-updated"))
      setTimeout(() => setAdded(false), 2000)
    } catch {}
    setAdding(false)
  }

  async function handleWishlist(e: React.MouseEvent) {
    e.preventDefault()
    setWishlisted(!wishlisted)
    try {
      await fetch("/api/user/wishlist", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ productId: product.id }),
      })
      window.dispatchEvent(new Event("wishlist-updated"))
    } catch {}
  }

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#f5f8f6]">
        <img
          src={hovered ? img2 : img1}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && <TagBadge tag="Featured" />}
          {pct && (
            <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">
              -{pct}%
            </span>
          )}
          {!inStock && <TagBadge tag="Out of Stock" />}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform z-10"
        >
          <svg
            className={`w-4 h-4 transition-colors ${wishlisted ? "text-rose-500 fill-rose-500" : "text-gray-400"}`}
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick Add — slides up on hover (same as home page) */}
        <button
          onClick={handleQuickAdd}
          disabled={!inStock || adding}
          className={`absolute bottom-0 left-0 right-0 text-xs font-bold uppercase tracking-widest py-3 text-center transition-transform duration-300 z-10 ${
            added
              ? "bg-green-600 text-white translate-y-0"
              : inStock
              ? "bg-[#3f554f] text-white " + (hovered ? "translate-y-0" : "translate-y-full")
              : "bg-gray-400 text-white translate-y-full"
          }`}
        >
          {adding ? "Adding..." : added ? "✓ Added to Cart!" : "Quick Add to Cart"}
        </button>
      </div>

      {/* ── Info ───────────────────────────────────────────── */}
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-widest text-[#8fa89f] font-semibold mb-1">
          {product.category.name}
        </p>
        <h3
          className="text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-1 group-hover:text-[#3f554f] transition-colors"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}
        >
          {product.name}
        </h3>

        {product._count.reviews > 0 && (
          <div className="mb-3">
            <Stars count={product._count.reviews} />
          </div>
        )}

        <div className="flex items-baseline gap-2">
          <span className="text-base font-black text-[#3f554f]">
            {fmt(product.basePrice)}
          </span>
          {hasOffer && (
            <span className="text-xs text-gray-400 line-through">
              {fmt(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}