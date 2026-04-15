"use client"

// src/app/products/[slug]/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type VariantValue = {
  id: string
  value: string
  option: { name: string }
}

type Variant = {
  id: string
  sku: string | null
  price: number | null
  stock: number
  imageUrl: string | null
  isActive: boolean
  values: VariantValue[]
}

type ProductImage = {
  id: string
  url: string
  altText: string | null
  isPrimary: boolean
}

type Attribute = { id: string; name: string; value: string }

type Review = {
  id: string
  rating: number
  title: string | null
  body: string | null
  createdAt: string
  user: { name: string | null; image: string | null }
  images: { id: string; url: string }[]
}

type Product = {
  id: string
  name: string
  slug: string
  description: string | null
  shortDescription: string | null
  basePrice: number
  compareAtPrice: number | null
  sku: string | null
  stock: number
  weight: number | null
  isActive: boolean
  isFeatured: boolean
  category: {
    id: string; name: string; slug: string
    parent: { id: string; name: string; slug: string } | null
  }
  images: ProductImage[]
  variants: Variant[]
  attributes: Attribute[]
  tags: { tag: { name: string; slug: string } }[]
  reviews: Review[]
}

type RelatedProduct = {
  id: string; name: string; slug: string
  basePrice: number; compareAtPrice: number | null
  images: { url: string; altText: string | null }[]
  _count: { reviews: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (cents: number) => "Rs " + (cents / 100).toLocaleString("en-PK")
const discount = (base: number, compare: number) =>
  Math.round(((compare - base) / compare) * 100)

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? "#3f554f" : "none"}
          stroke="#3f554f" strokeWidth={1.5}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  )
}

function FeedbackMsg({ msg }: { msg: string }) {
  const [type, ...parts] = msg.split(":")
  const text = parts.join(":")
  const styles: Record<string, string> = {
    success: "text-green-700 bg-green-50 border-green-200",
    error: "text-red-600 bg-red-50 border-red-200",
    warning: "text-amber-700 bg-amber-50 border-amber-200",
    loading: "text-gray-500 bg-gray-50 border-gray-200",
  }
  return (
    <div className={`text-sm font-medium border rounded-xl px-4 py-3 ${styles[type] ?? styles.loading}`}>
      {text}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()

  const [product, setProduct] = useState<Product | null>(null)
  const [avgRating, setAvgRating] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [related, setRelated] = useState<RelatedProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [activeImg, setActiveImg] = useState(0)
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({})
  const [cartMsg, setCartMsg] = useState("")
  const [wishMsg, setWishMsg] = useState("")
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<"desc" | "attrs" | "reviews">("desc")
  const [imgLoaded, setImgLoaded] = useState(false)

  const fetchProduct = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/products/${slug}`)
      if (!res.ok) { setNotFound(true); return }
      const data = await res.json()
      setProduct(data.product)
      setAvgRating(data.avgRating)
      setReviewCount(data.reviewCount)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [slug])

  const fetchRelated = useCallback(async () => {
    const res = await fetch(`/api/products/${slug}/related`)
    const data = await res.json()
    setRelated(data.products ?? [])
  }, [slug])

  useEffect(() => { fetchProduct() }, [fetchProduct])
  useEffect(() => { if (product) fetchRelated() }, [product, fetchRelated])

  // ── Matched variant ───────────────────────────────────────
  // Sab available option names nikalo
  const allOptionNames = [
    ...new Set(
      product?.variants
        .filter(v => v.isActive && v.values.length > 0)
        .flatMap(v => v.values.map(val => val.option.name)) ?? []
    )
  ]

  // Tab hi match karo jab user ne sab options select kiye hon
  const allOptionsSelected =
    allOptionNames.length > 0 &&
    allOptionNames.every(name => !!selectedOpts[name])

  const matchedVariant: Variant | null = allOptionsSelected
    ? product?.variants.find(v =>
      v.isActive &&
      v.values.length > 0 &&
      allOptionNames.every(
        name => v.values.some(
          val => val.option.name === name && val.value === selectedOpts[name]
        )
      )
    ) ?? null
    : null

  // Price aur stock
  const effectivePrice = matchedVariant?.price ?? product?.basePrice ?? 0
  const effectiveStock = allOptionsSelected
    ? (matchedVariant?.stock ?? 0)      // variant select kiya → variant ka stock
    : (product?.stock ?? 0)             // koi select nahi → product ka stock

  // ── Variant options grouped ───────────────────────────────
  const variantOptions: Record<string, string[]> = {}
  if (product?.variants?.length) {
    product.variants
      .filter(v => v.isActive && v.values.length > 0)
      .forEach((v) => {
        v.values.forEach((val) => {
          const key = val.option?.name
          if (!key) return
          if (!variantOptions[key]) variantOptions[key] = []
          if (!variantOptions[key].includes(val.value)) variantOptions[key].push(val.value)
        })
      })
  }

  // ── Active image — variant image override ─────────────────
  // Jab variant select ho aur uski imageUrl ho to woh show karo
  const variantImageUrl = matchedVariant?.imageUrl ?? null

  // All images list — variant image ko front mein rakh doo
  const allImages: { url: string; altText: string | null }[] = product
    ? variantImageUrl
      ? [
        { url: variantImageUrl, altText: matchedVariant?.sku ?? product.name },
        ...product.images.filter(img => img.url !== variantImageUrl),
      ]
      : product.images
    : []

  const displayImageUrl = allImages[activeImg]?.url ?? "/placeholder.png"

  // Variant change hone par image reset karo
  useEffect(() => {
    setActiveImg(0)
    setImgLoaded(false)
  }, [matchedVariant?.id])

  // ── Select variant option ─────────────────────────────────
  function selectOption(optName: string, val: string) {
    setSelectedOpts(prev => {
      const newOpts = { ...prev, [optName]: val }

      // Doosre options ke liye check karo
      const otherOptionNames = allOptionNames.filter(n => n !== optName)

      for (const otherName of otherOptionNames) {
        // Is new selection ke saath doosre option ki available values
        const availableValues = [
          ...new Set(
            product!.variants
              .filter(v =>
                v.isActive &&
                v.stock > 0 &&
                v.values.some(vv => vv.option.name === optName && vv.value === val)
              )
              .flatMap(v => v.values)
              .filter(vv => vv.option.name === otherName)
              .map(vv => vv.value)
          )
        ]

        if (availableValues.length === 1) {
          // Sirf ek available — auto select
          newOpts[otherName] = availableValues[0]
        } else if (availableValues.length > 1) {
          // Multiple available hain
          if (newOpts[otherName] && availableValues.includes(newOpts[otherName])) {
            // Pehle wala abhi bhi available hai — rakho
          } else {
            // Pehle wala available nahi — reset karo taake user choose kare
            delete newOpts[otherName]
          }
        } else {
          delete newOpts[otherName]
        }
      }

      return newOpts
    })
  }

  // ── Add to cart ───────────────────────────────────────────
  async function addToCart() {
    if (!product) return
    const hasVariants = Object.keys(variantOptions).length > 0
    if (hasVariants && !matchedVariant) {
      setCartMsg("warning:Select variant option first")
      setTimeout(() => setCartMsg(""), 3000)
      return
    }
    setCartMsg("loading:Adding...")
    try {
      const res = await fetch("/api/user/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          variantId: matchedVariant?.id ?? null,
          quantity: qty,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setCartMsg("success:✓ Added to Cart!")
        window.dispatchEvent(new Event("cart-updated"))
      } else {
        setCartMsg("error:" + (data.error ?? "Something went wrong"))
      }
    } catch {
      setCartMsg("error:Network error")
    }
    setTimeout(() => setCartMsg(""), 3000)
  }

  // ── Add to wishlist ───────────────────────────────────────
  async function addToWishlist() {
    if (!product) return
    setWishMsg("loading:Adding...")
    try {
      const res = await fetch("/api/user/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (res.ok) {
        setWishMsg(data.alreadyAdded ? "warning:Already in Wishlist" : "success:✓ Added to Wishlist!")
        window.dispatchEvent(new Event("wishlist-updated"))
      } else if (data.requiresLogin) {
        setWishMsg("warning:Login required for Wishlist")
        setTimeout(() => router.push("/login"), 1500)
      } else {
        setWishMsg("error:" + (data.error ?? "Something went wrong"))
      }
    } catch {
      setWishMsg("error:Network error")
    }
    setTimeout(() => setWishMsg(""), 3500)
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#3f554f] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-2xl font-bold text-gray-700">Product not found</p>
        <Link href="/" className="text-sm text-[#3f554f] underline">← Go to Home</Link>
      </div>
    )
  }

  const inStock = effectiveStock > 0
  const hasVariants = Object.keys(variantOptions).length > 0

  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* ── Breadcrumb ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6 pb-2">
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap">
          <Link href="/" className="hover:text-[#3f554f] transition">Home</Link>
          <span className="text-gray-300">/</span>
          {product.category.parent && (
            <>
              <Link href={`/category/${product.category.parent.slug}`} className="hover:text-[#3f554f] transition">
                {product.category.parent.name}
              </Link>
              <span className="text-gray-300">/</span>
            </>
          )}
          <Link href={`/category/${product.category.slug}`} className="hover:text-[#3f554f] transition">
            {product.category.name}
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-600 font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* ── Main Section ───────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">

          {/* ── Image Gallery ──────────────────────────────── */}
          <div className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
            {/* Main image */}
            <div className="relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm group">
              <Image
                key={displayImageUrl}
                src={displayImageUrl}
                alt={allImages[activeImg]?.altText ?? product.name}
                fill
                className={`object-cover transition-all duration-500 group-hover:scale-[1.03] ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                onLoad={() => setImgLoaded(true)}
              />

              {/* Skeleton while loading */}
              {!imgLoaded && (
                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    -{discount(product.basePrice, product.compareAtPrice)}%
                  </span>
                )}
                {product.isFeatured && (
                  <span className="bg-[#3f554f] text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    ✦ Featured
                  </span>
                )}
                {!inStock && (
                  <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Out of Stock
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => { setActiveImg(i); setImgLoaded(false) }}
                    className={`relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${activeImg === i ? "border-[#3f554f] scale-105 shadow-sm" : "border-transparent hover:border-gray-200 opacity-70 hover:opacity-100"
                      }`}
                  >
                    <Image src={img.url} alt={img.altText ?? product.name} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ────────────────────────────────── */}
          <div className="flex flex-col gap-5">

            {/* Category badge + SKU */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href={`/category/${product.category.slug}`}
                className="text-xs font-semibold text-[#3f554f] bg-[#e8f0ec] px-3 py-1.5 rounded-full hover:bg-[#d4e6db] transition"
              >
                {product.category.name}
              </Link>
              {product.sku && (
                <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2.5 py-1 rounded-lg">
                  SKU: {product.sku}
                </span>
              )}
            </div>

            {/* Name */}
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            {reviewCount > 0 && (
              <button onClick={() => setTab("reviews")} className="flex items-center gap-2 w-fit group">
                <StarRating rating={avgRating} />
                <span className="text-sm text-gray-500 group-hover:text-[#3f554f] transition">
                  {avgRating.toFixed(1)} ({reviewCount} reviews)
                </span>
              </button>
            )}

            {/* Short description */}
            {product.shortDescription && (
              <p className="text-gray-500 text-sm leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Price block */}
            <div className="flex items-end gap-3 flex-wrap">
              <span className="text-4xl font-bold text-[#3f554f] tracking-tight">
                {fmt(effectivePrice)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > effectivePrice && (
                <>
                  <span className="text-xl text-gray-300 line-through font-medium">
                    {fmt(product.compareAtPrice)}
                  </span>
                  <span className="text-sm font-bold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg">
                    Save {fmt(product.compareAtPrice - effectivePrice)}
                  </span>
                </>
              )}
            </div>

            {/* Variant Options */}
            {hasVariants && Object.entries(variantOptions).map(([optName, values]) => (
              <div key={optName}>
                <p className="text-sm font-semibold text-gray-800 mb-2.5">
                  {optName}
                  {selectedOpts[optName] && (
                    <span className="font-normal text-gray-400 ml-2">— {selectedOpts[optName]}</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {values.map((val) => {
                    const isSelected = selectedOpts[optName] === val
                    // ✅ Yeh lagao — sirf check karo yeh value kisi bhi active+stock variant mein hai
                    const isAvailable = product.variants.some(
                      v =>
                        v.isActive &&
                        v.stock > 0 &&
                        v.values.some(vv => vv.option.name === optName && vv.value === val)
                    )
                    return (
                      <button
                        key={val}
                        onClick={() => selectOption(optName, val)}
                        disabled={!isAvailable}
                        className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${isSelected
                          ? "border-[#3f554f] bg-[#3f554f] text-white shadow-sm"
                          : isAvailable
                            ? "border-gray-200 text-gray-700 hover:border-[#3f554f] hover:text-[#3f554f] bg-white"
                            : "border-gray-100 text-gray-300 cursor-not-allowed bg-gray-50 line-through"
                          }`}
                      >
                        {val}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Stock status */}
            <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border ${inStock
              ? effectiveStock <= 5
                ? "bg-amber-50 border-amber-200"
                : "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
              }`}>
              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${inStock
                ? effectiveStock <= 5 ? "bg-amber-500" : "bg-green-500"
                : "bg-red-400"
                }`} />
              <span className={`text-sm font-medium ${inStock
                ? effectiveStock <= 5 ? "text-amber-700" : "text-green-700"
                : "text-red-600"
                }`}>
                {inStock
                  ? effectiveStock <= 5
                    ? `⚡ only ${effectiveStock} Availble — Hurry Up!`
                    : `In Stock (${effectiveStock} available)`
                  : "Out of Stock"}
              </span>
            </div>

            {/* Qty + Actions */}
            <div className="flex items-stretch gap-3 flex-wrap">
              {/* Quantity */}
              <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition text-xl font-light"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-bold text-gray-800">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(effectiveStock, q + 1))}
                  disabled={qty >= effectiveStock || !inStock}
                  className="w-11 h-12 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition text-xl font-light disabled:opacity-30"
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                onClick={addToCart}
                disabled={!inStock}
                className="flex-1 min-w-[160px] h-12 bg-[#3f554f] hover:bg-[#2f403b] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>

              {/* Wishlist */}
              <button
                onClick={addToWishlist}
                className="w-12 h-12 flex items-center justify-center border-2 border-gray-200 rounded-xl text-gray-400 hover:border-rose-300 hover:text-rose-400 hover:bg-rose-50 transition-all bg-white"
                title="Wishlist mein add karo"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
              </button>
            </div>

            {/* Feedback */}
            {cartMsg && <FeedbackMsg msg={cartMsg} />}
            {wishMsg && <FeedbackMsg msg={wishMsg} />}

            {/* Meta pills */}
            {(product.weight || product.tags.length > 0) && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                {product.weight && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full">
                    ⚖️ {product.weight} kg
                  </span>
                )}
                {product.tags.map((t) => (
                  <Link
                    key={t.tag.slug}
                    href={`/search?tag=${t.tag.slug}`}
                    className="text-xs bg-[#e8f0ec] text-[#3f554f] px-3 py-1.5 rounded-full hover:bg-[#d4e6db] transition"
                  >
                    #{t.tag.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Delivery info strip */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {[
                { icon: "🚚", title: "Free Delivery", sub: "Orders above Rs 10,000" },
                { icon: "↩️", title: "Easy Returns", sub: "7 day return policy" },
                { icon: "🔒", title: "Secure Payment", sub: "100% safe checkout" },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center p-3 bg-white border border-gray-100 rounded-2xl gap-1">
                  <span className="text-xl">{item.icon}</span>
                  <p className="text-xs font-semibold text-gray-700">{item.title}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tabs Section ──────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto">
            {[
              { key: "desc", label: "Description" },
              ...(product.attributes.length > 0 ? [{ key: "attrs", label: "Details" }] : []),
              ...(reviewCount > 0 ? [{ key: "reviews", label: `Reviews (${reviewCount})` }] : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key as any)}
                className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${tab === key
                  ? "border-[#3f554f] text-[#3f554f] bg-[#fafaf8]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="p-6 lg:p-8">
            {tab === "desc" && (
              <div>
                {product.description ? (
                  <div
                    className="prose prose-sm max-w-none text-gray-600 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: product.description }}
                  />
                ) : (
                  <p className="text-gray-400 text-sm">Not Found Any Discription.</p>
                )}
              </div>
            )}

            {tab === "attrs" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.attributes.map((attr) => (
                  <div key={attr.id} className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[90px] shrink-0 pt-0.5">
                      {attr.name}
                    </span>
                    <span className="text-sm text-gray-800 font-medium">{attr.value}</span>
                  </div>
                ))}
                {product.weight && (
                  <div className="flex items-start gap-3 bg-gray-50 rounded-2xl px-4 py-3.5">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider min-w-[90px] shrink-0 pt-0.5">Weight</span>
                    <span className="text-sm text-gray-800 font-medium">{product.weight} kg</span>
                  </div>
                )}
              </div>
            )}

            {tab === "reviews" && (
              <div>
                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-100">
                  <div className="text-center">
                    <p className="text-5xl font-bold text-[#3f554f]">{avgRating.toFixed(1)}</p>
                    <div className="mt-1"><StarRating rating={avgRating} size={14} /></div>
                    <p className="text-xs text-gray-400 mt-1">{reviewCount} reviews</p>
                  </div>
                </div>
                <div className="space-y-5">
                  {product.reviews.map((r) => (
                    <div key={r.id} className="border-b border-gray-50 pb-5 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#e8f0ec] flex items-center justify-center shrink-0 overflow-hidden">
                          {r.user.image ? (
                            <Image src={r.user.image} alt={r.user.name ?? "User"} width={36} height={36} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-bold text-[#3f554f]">
                              {(r.user.name ?? "U")[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">{r.user.name ?? "Anonymous"}</p>
                            <StarRating rating={r.rating} size={12} />
                            <span className="text-xs text-gray-400">
                              {new Date(r.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          {r.title && <p className="text-sm font-semibold text-gray-700 mt-1">{r.title}</p>}
                          {r.body && <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">{r.body}</p>}
                          {r.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {r.images.map((img) => (
                                <div key={img.id} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-100">
                                  <Image src={img.url} alt="Review" fill className="object-cover" sizes="64px" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Related Products ──────────────────────────────── */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 lg:px-8 pb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-all hover:-translate-y-0.5 duration-200"
              >
                <div className="relative aspect-square bg-gray-50 overflow-hidden">
                  {p.images[0] ? (
                    <Image
                      src={p.images[0].url}
                      alt={p.images[0].altText ?? p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-200 text-xs">No image</div>
                  )}
                  {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                    <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      -{discount(p.basePrice, p.compareAtPrice)}%
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#3f554f] transition">
                    {p.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-sm font-bold text-[#3f554f]">{fmt(p.basePrice)}</span>
                    {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                      <span className="text-xs text-gray-400 line-through">{fmt(p.compareAtPrice)}</span>
                    )}
                  </div>
                  {p._count.reviews > 0 && (
                    <p className="text-[11px] text-gray-400 mt-1">{p._count.reviews} reviews</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}