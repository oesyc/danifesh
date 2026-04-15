"use client"
// src/components/ArchivePage.tsx
// Reusable archive — shop page aur category page dono use karte hain

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import ProductCard, { type ProductCardData } from "./ProductCard"

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = {
  id: string
  name: string
  slug: string
  parent: { id: string; name: string; slug: string } | null
  children: { id: string; name: string; slug: string }[]
}

type ArchiveProps = {
  // "category" mode → apiUrl = /api/categories/[slug]
  // "shop" mode     → apiUrl = /api/products
  mode:    "category" | "shop"
  apiBase: string        // e.g. "/api/categories/women" or "/api/products"
  title?:  string        // override title (shop page)
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-4/5" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
      </div>
    </div>
  )
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────
type FilterState = {
  sort:     string
  minPrice: string
  maxPrice: string
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ArchivePage({ mode, apiBase, title }: ArchiveProps) {
  // Data state
  const [products,    setProducts]    = useState<ProductCardData[]>([])
  const [category,    setCategory]    = useState<Category | null>(null)
  const [loading,     setLoading]     = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [total,       setTotal]       = useState(0)
  const [page,        setPage]        = useState(1)
  const [totalPages,  setTotalPages]  = useState(1)
  const [priceRange,  setPriceRange]  = useState({ min: 0, max: 100000 })
  const [notFound,    setNotFound]    = useState(false)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    sort:     "newest",
    minPrice: "",
    maxPrice: "",
  })

  // Sidebar open on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // ── Build query string ──────────────────────────────────
  function buildQuery(p = 1) {
    const q = new URLSearchParams({ sort: filters.sort, page: String(p), limit: "12" })
    if (filters.minPrice) q.set("minPrice", String(parseInt(filters.minPrice) * 100))
    if (filters.maxPrice) q.set("maxPrice", String(parseInt(filters.maxPrice) * 100))
    return q.toString()
  }

  // ── Fetch products ──────────────────────────────────────
  const fetchProducts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const res  = await fetch(`${apiBase}?${buildQuery(p)}`)
      const data = await res.json()

      if (!res.ok) { setNotFound(true); return }

      if (mode === "category") setCategory(data.category ?? null)

      setProducts(prev => append ? [...prev, ...(data.products ?? [])] : (data.products ?? []))
      setTotal(data.total ?? 0)
      setTotalPages(data.pages ?? 1)
      if (data.minPrice !== undefined) setPriceRange({ min: data.minPrice, max: data.maxPrice })
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [apiBase, filters])

  // Reset on filter change
  useEffect(() => {
    setPage(1)
    fetchProducts(1, false)
  }, [filters, apiBase])

  function handleLoadMore() {
    const next = page + 1
    setPage(next)
    fetchProducts(next, true)
  }

  // ── Display title ───────────────────────────────────────
  const pageTitle = title ?? category?.name ?? "Shop"

  // ── Breadcrumb ──────────────────────────────────────────
  const breadcrumb = (
    <nav className="flex items-center gap-1.5 text-xs text-gray-400 flex-wrap mb-6">
      <Link href="/" className="hover:text-[#3f554f] transition">Home</Link>
      <span className="text-gray-300">/</span>
      {mode === "shop" ? (
        <span className="text-gray-600 font-medium">Shop</span>
      ) : (
        <>
          {category?.parent && (
            <>
              <Link href={`/category/${category.parent.slug}`} className="hover:text-[#3f554f] transition">
                {category.parent.name}
              </Link>
              <span className="text-gray-300">/</span>
            </>
          )}
          <span className="text-gray-600 font-medium">{category?.name ?? "..."}</span>
        </>
      )}
    </nav>
  )

  // ── Sort options ────────────────────────────────────────
  const sortOptions = [
    { value: "newest",     label: "Newest First" },
    { value: "popular",    label: "Most Popular" },
    { value: "price_asc",  label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
  ]

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafaf8]">
        <p className="text-2xl font-bold text-gray-700">Not Find this Category</p>
        <Link href="/shop" className="text-sm text-[#3f554f] underline">← Go To Shop</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">

        {/* Breadcrumb */}
        {breadcrumb}

        {/* ── Hero Header ──────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-px bg-[#3f554f]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f554f]">
              {mode === "shop" ? "All Products" : "Collection"}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1
              className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {loading ? (
                <span className="inline-block w-48 h-10 bg-gray-100 rounded animate-pulse" />
              ) : pageTitle}
            </h1>
            {!loading && (
              <p className="text-sm text-gray-400 shrink-0">
                {total} {total === 1 ? "product" : "products"} Found
              </p>
            )}
          </div>

          {/* Subcategory pills — agar parent category hai */}
          {category?.children && category.children.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              <Link
                href={`/category/${category.slug}`}
                className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#3f554f] text-white"
              >
                All
              </Link>
              {category.children.map(child => (
                <Link
                  key={child.id}
                  href={`/category/${category.slug}/${child.slug}`}
                  className="px-4 py-1.5 rounded-full text-sm font-semibold bg-[#f0f5f3] text-[#3f554f] hover:bg-[#dce9e4] transition-colors"
                >
                  {child.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Toolbar ──────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:border-[#3f554f] hover:text-[#3f554f] transition lg:hidden"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2" />
            </svg>
            Filters
          </button>

          {/* Sort dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-gray-500 hidden sm:inline">Sort:</span>
            <select
              value={filters.sort}
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#3f554f] text-gray-700"
            >
              {sortOptions.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Main Layout ──────────────────────────────────── */}
        <div className="flex gap-8">

          {/* ── Sidebar Filters ─────────────────────────────── */}
          {/* Desktop sidebar (always visible on lg+) */}
          <aside className={`
            w-64 shrink-0 
            hidden lg:block
          `}>
            <FilterPanel
              filters={filters}
              priceRange={priceRange}
              onChange={setFilters}
            />
          </aside>

          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
              <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <p className="font-semibold text-sm">Filters</p>
                  <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-700">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-4">
                  <FilterPanel
                    filters={filters}
                    priceRange={priceRange}
                    onChange={(f) => { setFilters(f); setSidebarOpen(false) }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Products Grid ─────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 bg-[#f0f5f3] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-[#3f554f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-gray-700 mb-2">Not found any product</p>
                <p className="text-sm text-gray-400 mb-5">Change filter or see all products</p>
                <button
                  onClick={() => setFilters({ sort: "newest", minPrice: "", maxPrice: "" })}
                  className="px-6 py-2.5 bg-[#3f554f] text-white text-sm font-semibold rounded-full hover:bg-[#2f403b] transition"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>

                {/* Load More */}
                {page < totalPages && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="inline-flex items-center gap-2 border-2 border-[#3f554f] text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-full hover:bg-[#3f554f] hover:text-white transition-all duration-300 disabled:opacity-50"
                    >
                      {loadingMore ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `Load More  (${total - products.length} remaining)`
                      )}
                    </button>
                  </div>
                )}

                {/* End of results */}
                {page >= totalPages && products.length > 0 && (
                  <p className="text-center text-xs text-gray-400 mt-8">
                    Seen {total} all Products ✓
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Filter Panel Component ───────────────────────────────────────────────────
function FilterPanel({
  filters,
  priceRange,
  onChange,
}: {
  filters:    FilterState
  priceRange: { min: number; max: number }
  onChange:   (f: FilterState) => void
}) {
  const minRs = Math.floor(priceRange.min / 100)
  const maxRs = Math.ceil(priceRange.max  / 100)

  function reset() {
    onChange({ sort: "newest", minPrice: "", maxPrice: "" })
  }

  const hasActive = filters.minPrice || filters.maxPrice

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm text-gray-800">Filters</p>
        {hasActive && (
          <button onClick={reset} className="text-xs text-[#3f554f] hover:underline font-medium">
            Clear all
          </button>
        )}
      </div>

      {/* Price Range */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Price Range</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Min (Rs)</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={e => onChange({ ...filters, minPrice: e.target.value })}
              placeholder={String(minRs)}
              min={minRs}
              max={maxRs}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#3f554f]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max (Rs)</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={e => onChange({ ...filters, maxPrice: e.target.value })}
              placeholder={String(maxRs)}
              min={minRs}
              max={maxRs}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-sm bg-white focus:outline-none focus:border-[#3f554f]"
            />
          </div>
        </div>

        {/* Quick price buttons */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {[
            { label: "Under 2k",  max: "2000" },
            { label: "2k–5k",     min: "2000", max: "5000" },
            { label: "5k–10k",    min: "5000", max: "10000" },
            { label: "Above 10k", min: "10000" },
          ].map(opt => (
            <button
              key={opt.label}
              onClick={() => onChange({ ...filters, minPrice: opt.min ?? "", maxPrice: opt.max ?? "" })}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filters.minPrice === (opt.min ?? "") && filters.maxPrice === (opt.max ?? "")
                  ? "bg-[#3f554f] text-white border-[#3f554f]"
                  : "border-gray-200 text-gray-600 hover:border-[#3f554f] hover:text-[#3f554f]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Availability</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-[#3f554f]" defaultChecked />
            <span className="text-sm text-gray-700">In Stock</span>
          </label>
        </div>
      </div>
    </div>
  )
}