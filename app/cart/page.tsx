"use client"

// src/app/cart/page.tsx

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    slug: string
    basePrice: number
    stock: number
    images: { url: string }[]
  }
  variant: {
    id: string
    price: number | null
    stock: number
    imageUrl: string | null
    values: { value: string; option: { name: string } }[]
  } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (cents: number) => "Rs " + (cents / 100).toLocaleString("en-PK")

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CartPage() {
  const router = useRouter()
  const [items,   setItems]   = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null) // itemId being updated

  // ── Fetch cart ────────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/user/cart")
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCart() }, [fetchCart])

  // ── Update quantity ───────────────────────────────────────
  async function updateQty(itemId: string, newQty: number) {
    if (newQty < 1) return
    setUpdating(itemId)
    try {
      await fetch(`/api/user/cart/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      })
      setItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item)
      )
      window.dispatchEvent(new Event("cart-updated"))
    } finally {
      setUpdating(null)
    }
  }

  // ── Remove item ───────────────────────────────────────────
  async function removeItem(itemId: string) {
    setUpdating(itemId)
    try {
      await fetch(`/api/user/cart/${itemId}`, { method: "DELETE" })
      setItems(prev => prev.filter(item => item.id !== itemId))
      window.dispatchEvent(new Event("cart-updated"))
    } finally {
      setUpdating(null)
    }
  }

  // ── Calculations ──────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.basePrice
    return sum + price * item.quantity
  }, 0)

  const FREE_SHIPPING_THRESHOLD = 1000000 // Rs 10000
  const shippingCost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 20000 // Rs 200
  const total = subtotal + shippingCost
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100)

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3f554f] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Cart loading...</p>
        </div>
      </div>
    )
  }

  // ── Empty cart ────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex flex-col items-center justify-center gap-6 px-4">
        <div className="w-24 h-24 bg-[#e8f0ec] rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-[#3f554f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-gray-400 text-sm">No items in your cart yet</p>
        </div>
        <Link
          href="/"
          className="bg-[#3f554f] text-white font-semibold px-8 py-3 rounded-2xl hover:bg-[#2f403b] transition-all active:scale-95 shadow-sm"
        >
          start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Shopping Cart
            <span className="ml-3 text-base font-normal text-gray-400">({items.length} item{items.length > 1 ? "s" : ""})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Cart Items ──────────────────────────────────── */}
          <div className="lg:col-span-2 flex flex-col gap-4">

            {/* Free shipping progress bar */}
            {subtotal < FREE_SHIPPING_THRESHOLD && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">
                    🚚 <span className="font-semibold">{fmt(remaining)}</span> add more and you will get free delivery!
                  </p>
                  <span className="text-xs text-gray-400">{Math.round(freeShippingProgress)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#3f554f] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${freeShippingProgress}%` }}
                  />
                </div>
              </div>
            )}
            {subtotal >= FREE_SHIPPING_THRESHOLD && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
                <p className="text-sm text-green-700 font-medium">🎉 Congrates you are getting free delivery!</p>
              </div>
            )}

            {/* Items list */}
            {items.map((item) => {
              const price     = item.variant?.price ?? item.product.basePrice
              const imageUrl  = item.variant?.imageUrl ?? item.product.images[0]?.url ?? "/placeholder.png"
              const maxQty    = item.variant ? item.variant.stock : item.product.stock
              const isUpdating = updating === item.id

              const variantLabel = item.variant?.values
                .map(v => `${v.option.name}: ${v.value}`)
                .join(", ") ?? null

              return (
                <div
                  key={item.id}
                  className={`bg-white border border-gray-100 rounded-2xl p-4 shadow-sm transition-opacity ${isUpdating ? "opacity-60" : "opacity-100"}`}
                >
                  <div className="flex gap-4">
                    {/* Product image */}
                    <Link href={`/products/${item.product.slug}`} className="shrink-0">
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                        <Image
                          src={imageUrl}
                          alt={item.product.name}
                          fill
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      </div>
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="text-sm font-semibold text-gray-800 hover:text-[#3f554f] transition line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {variantLabel && (
                            <p className="text-xs text-gray-400 mt-0.5 bg-gray-50 inline-block px-2 py-0.5 rounded-lg">
                              {variantLabel}
                            </p>
                          )}
                        </div>

                        {/* Remove button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          className="text-gray-300 hover:text-red-400 transition-colors shrink-0 p-1"
                          title="Remove karo"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>

                      {/* Price + qty row */}
                      <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                        {/* Qty controls */}
                        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-30 text-base"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-bold text-gray-800">
                            {isUpdating ? "..." : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= maxQty}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition disabled:opacity-30 text-base"
                          >
                            +
                          </button>
                        </div>

                        {/* Item total */}
                        <div className="text-right">
                          <p className="text-base font-bold text-[#3f554f]">
                            {fmt(price * item.quantity)}
                          </p>
                          {item.quantity > 1 && (
                            <p className="text-xs text-gray-400">{fmt(price)} × {item.quantity}</p>
                          )}
                        </div>
                      </div>

                      {/* Low stock warning */}
                      {maxQty <= 5 && maxQty > 0 && (
                        <p className="text-xs text-amber-600 mt-2 font-medium">
                          ⚡ only {maxQty} left in stock
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Continue shopping */}
            <Link
              href="/"
              className="flex items-center gap-2 text-sm text-[#3f554f] font-medium hover:underline w-fit mt-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Continue Shopping 
            </Link>
          </div>

          {/* ── Order Summary ───────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-24">
              <h2 className="text-base font-bold text-gray-900 mb-5">Order Summary</h2>

              <div className="space-y-3 mb-5">
                {/* Subtotal */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">
                    Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)
                  </span>
                  <span className="font-semibold text-gray-800">{fmt(subtotal)}</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Delivery</span>
                  {shippingCost === 0 ? (
                    <span className="font-semibold text-green-600">FREE</span>
                  ) : (
                    <span className="font-semibold text-gray-800">{fmt(shippingCost)}</span>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <div className="flex justify-between">
                    <span className="font-bold text-gray-900">Total</span>
                    <span className="font-bold text-xl text-[#3f554f]">{fmt(total)}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Taxes included</p>
                </div>
              </div>

              {/* Checkout button */}
              <button
                onClick={() => router.push("/checkout")}
                className="w-full bg-[#3f554f] hover:bg-[#2f403b] active:scale-[0.98] text-white font-bold py-4 rounded-2xl transition-all shadow-sm text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Checkout Karo — {fmt(total)}
              </button>

              {/* Payment icons */}
              <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                {["💳 Cards", "🏦 Bank Transfer", "💵 COD"].map(m => (
                  <span key={m} className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                    {m}
                  </span>
                ))}
              </div>

              {/* Trust badges */}
              <div className="mt-5 pt-5 border-t border-gray-100 space-y-2">
                {[
                  { icon: "🔒", text: "Secure SSL checkout" },
                  { icon: "↩️", text: "7 din return policy" },
                  { icon: "📞", text: "24/7 customer support" },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2">
                    <span className="text-base">{b.icon}</span>
                    <span className="text-xs text-gray-500">{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}