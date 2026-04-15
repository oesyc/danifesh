"use client";

// ============================================================
//  app/shop/ShopClient.tsx  ←  CLIENT COMPONENT
// ============================================================
//
//  یہ file صرف UI اور interactivity handle کرتی ہے
//  Data یہاں fetch نہیں ہوتی — page.tsx سے props میں آتی ہے
//
//  آپ کو اس file میں کوئی change نہیں کرنا dynamic products کے لیے
//  صرف page.tsx میں DUMMY_PRODUCTS کو replace کریں
//
// ============================================================

import { useState, useMemo } from "react";
import type { Product } from "./page";

// ── Types ─────────────────────────────────────────────────────
type SortOption = "featured" | "price-asc" | "price-desc" | "rating" | "newest";
type Category = "All" | "Men" | "Women" | "Accessories" | "Footwear";

// ── Icon Components ───────────────────────────────────────────
const GridIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const ListIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);
const FilterIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 12h10M10 20h4" />
  </svg>
);
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-3 h-3 ${filled ? "text-[#3f554f]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);
const HeartIcon = ({ active }: { active: boolean }) => (
  <svg className={`w-4 h-4 transition-colors ${active ? "text-rose-500" : "text-gray-400"}`}
    fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Tag Badge ─────────────────────────────────────────────────
function TagBadge({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    New: "bg-[#3f554f] text-white",
    Sale: "bg-rose-500 text-white",
    Hot: "bg-amber-500 text-white",
    Limited: "bg-[#2f403b] text-[#c8d9d3]",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${colors[tag] ?? "bg-gray-200 text-gray-700"}`}>
      {tag}
    </span>
  );
}

// ── Star Rating ───────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => <StarIcon key={s} filled={s <= Math.round(rating)} />)}
    </div>
  );
}

// ── Product Card ──────────────────────────────────────────────
function ProductCard({ product, view }: { product: Product; view: "grid" | "list" }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  if (view === "list") {
    return (
      <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex gap-0">
        {/* Image */}
        <div className="relative w-36 sm:w-48 shrink-0 overflow-hidden bg-[#f5f8f6]">
          <img
            src={hovered && product.hoverImage ? product.hoverImage : product.image}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
          />
          {product.tag && (
            <div className="absolute top-2 left-2"><TagBadge tag={product.tag} /></div>
          )}
        </div>
        {/* Info */}
        <div className="flex flex-col justify-between p-4 sm:p-6 flex-1 min-w-0">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#8fa89f] font-semibold mb-1">{product.category}</p>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-xl font-black text-gray-900 leading-snug mb-2">{product.name}</h3>
            <div className="flex items-center gap-2 mb-3">
              <Stars rating={product.rating} />
              <span className="text-xs text-gray-400">({product.reviews})</span>
            </div>
            {product.colors && (
              <div className="flex gap-1.5 mb-3">
                {product.colors.slice(0, 4).map((c) => (
                  <div key={c} className="w-4 h-4 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform" style={{ background: c }} />
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-[#3f554f]">Rs. {product.price.toLocaleString()}</span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString()}</span>
              )}
              {discount && <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">-{discount}%</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWishlisted(!wishlisted)}
                className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center hover:border-rose-300 transition-colors"
              >
                <HeartIcon active={wishlisted} />
              </button>
              <button className="bg-[#3f554f] hover:bg-[#2f403b] text-white text-xs font-bold uppercase tracking-widest px-5 py-2.5 rounded-full transition-all active:scale-95">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#f5f8f6]">
        <img
          src={hovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.tag && <TagBadge tag={product.tag} />}
          {discount && (
            <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full">-{discount}%</span>
          )}
        </div>
        {/* Wishlist */}
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <HeartIcon active={wishlisted} />
        </button>
        {/* Quick Add */}
        <div className={`absolute bottom-0 left-0 right-0 bg-[#3f554f] text-white text-xs font-bold uppercase tracking-widest py-3 text-center transition-transform duration-300 ${hovered ? "translate-y-0" : "translate-y-full"}`}>
          Quick Add to Cart
        </div>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-widest text-[#8fa89f] font-semibold mb-1">{product.category}</p>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-base font-black text-gray-800 leading-snug mb-2 line-clamp-1">{product.name}</h3>
        <div className="flex items-center gap-1.5 mb-3">
          <Stars rating={product.rating} />
          <span className="text-[11px] text-gray-400">({product.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-[#3f554f]">Rs. {product.price.toLocaleString()}</span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">Rs. {product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {product.colors && (
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((c) => (
                <div key={c} className="w-3.5 h-3.5 rounded-full border border-gray-200 cursor-pointer hover:scale-125 transition-transform" style={{ background: c }} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Filter Section ─────────────────────────────────────
function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-[#e8f0ed] pb-5 mb-5 last:border-0 last:mb-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full mb-3"
      >
        <span className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && children}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MAIN CLIENT COMPONENT
// ══════════════════════════════════════════════════════════════
export function ShopClient({ products }: { products: Product[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [sortBy, setSortBy] = useState<SortOption>("featured");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const categories: Category[] = ["All", "Men", "Women", "Accessories", "Footwear"];
  const tags = ["New", "Sale", "Hot", "Limited"];

  // ── Filter + Sort logic (pure client-side) ────────────────
  const filtered = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== "All") {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Tag filter
    if (selectedTags.length > 0) {
      result = result.filter((p) => p.tag && selectedTags.includes(p.tag));
    }

    // Price range filter
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Sort
    switch (sortBy) {
      case "price-asc":  result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "rating":     result.sort((a, b) => b.rating - a.rating); break;
      case "newest":     result.sort((a, b) => b.id - a.id); break;
      default: break;
    }

    return result;
  }, [products, activeCategory, sortBy, priceRange, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const resetFilters = () => {
    setActiveCategory("All");
    setSelectedTags([]);
    setPriceRange([0, 10000]);
    setSortBy("featured");
  };

  const hasActiveFilters = activeCategory !== "All" || selectedTags.length > 0 || priceRange[0] > 0 || priceRange[1] < 10000;

  // ── Sidebar (shared between desktop + mobile drawer) ──────
  const SidebarContent = () => (
    <div style={{ fontFamily: "'Lato', sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-2xl font-black text-gray-900">
          Filters
        </h2>
        {hasActiveFilters && (
          <button onClick={resetFilters} className="text-xs text-rose-500 font-bold hover:underline">
            Clear All
          </button>
        )}
      </div>

      {/* Category */}
      <FilterSection title="Category">
        <div className="flex flex-col gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-[#3f554f] text-white"
                  : "text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f]"
              }`}
            >
              {cat}
              <span className={`text-xs ${activeCategory === cat ? "text-white/70" : "text-gray-400"}`}>
                {cat === "All" ? products.length : products.filter((p) => p.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tags */}
      <FilterSection title="Tags">
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full transition-all ${
                selectedTags.includes(tag)
                  ? "bg-[#3f554f] text-white"
                  : "bg-[#f0f5f3] text-[#3f554f] hover:bg-[#dce9e4]"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="px-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#3f554f]">Rs. {priceRange[0].toLocaleString()}</span>
            <span className="text-xs font-bold text-[#3f554f]">Rs. {priceRange[1].toLocaleString()}</span>
          </div>
          <input
            type="range" min={0} max={10000} step={100}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-[#3f554f]"
          />
        </div>
      </FilterSection>
    </div>
  );

  return (
    <main className="bg-white min-h-screen" style={{ fontFamily: "'Lato', sans-serif" }}>

      {/* ── Hero Banner ──────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-16 px-4 flex items-center"
        style={{ background: "linear-gradient(135deg, #2f403b 0%, #3f554f 60%, #5a7a71 100%)" }}
      >
        <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5" />
        <div className="absolute left-1/3 bottom-0 w-1 h-20 bg-white/10 rotate-12" />
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-px bg-[#c8d9d3]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8d9d3]">Danifesh</span>
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-5xl lg:text-6xl font-black text-white leading-tight">
              All Products
            </h1>
            <p className="text-[#a8c4bc] mt-2 text-sm">
              {products.length} curated pieces for every occasion
            </p>
          </div>
          {/* Breadcrumb */}
          <nav className="text-sm text-[#a8c4bc] flex items-center gap-2">
            <a href="/" className="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <span className="text-white font-semibold">Shop</span>
          </nav>
        </div>
      </section>

      {/* ── Main Layout ──────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex gap-8">

          {/* ── Desktop Sidebar ─────────────────────────────── */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-24 bg-[#f5f8f6] rounded-2xl p-6">
              <SidebarContent />
            </div>
          </aside>

          {/* ── Products Area ────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="lg:hidden flex items-center gap-2 border border-[#3f554f] text-[#3f554f] text-sm font-semibold px-4 py-2 rounded-full hover:bg-[#f0f5f3] transition"
                >
                  <FilterIcon /> Filters
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
                <p className="text-sm text-gray-500">
                  <span className="font-bold text-gray-800">{filtered.length}</span> products
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border border-gray-200 rounded-full px-4 py-2 outline-none focus:border-[#3f554f] transition bg-white text-gray-700 cursor-pointer"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>

                {/* View Toggle */}
                <div className="flex items-center bg-[#f0f5f3] rounded-full p-1 gap-1">
                  {(["grid", "list"] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setView(v)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        view === v ? "bg-[#3f554f] text-white shadow-sm" : "text-gray-500 hover:text-[#3f554f]"
                      }`}
                    >
                      {v === "grid" ? <GridIcon /> : <ListIcon />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mb-5">
                {activeCategory !== "All" && (
                  <span className="flex items-center gap-1.5 bg-[#3f554f] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {activeCategory}
                    <button type="button" onClick={() => setActiveCategory("All")} className="hover:text-white/70"><CloseIcon /></button>
                  </span>
                )}
                {selectedTags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1.5 bg-[#3f554f] text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    {tag}
                    <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white/70"><CloseIcon /></button>
                  </span>
                ))}
              </div>
            )}

            {/* Product Grid / List */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-3xl font-black text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 text-sm mb-6">Try adjusting your filters</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="bg-[#3f554f] text-white font-bold text-sm uppercase tracking-widest px-8 py-3 rounded-full hover:bg-[#2f403b] transition"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className={
                view === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
                  : "flex flex-col gap-4"
              }>
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} view={view} />
                ))}
              </div>
            )}

            {/* Load More — static UI */}
            {filtered.length > 0 && (
              <div className="text-center mt-12">
                <button className="inline-flex items-center gap-2 border-2 border-[#3f554f] text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-full hover:bg-[#3f554f] hover:text-white transition-all duration-300">
                  Load More Products
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Mobile Filter Drawer ──────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">Filter Products</span>
              <button type="button" onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-800">
                <CloseIcon />
              </button>
            </div>
            <SidebarContent />
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="mt-4 w-full bg-[#3f554f] text-white font-bold text-sm uppercase tracking-widest py-4 rounded-full hover:bg-[#2f403b] transition"
            >
              Show {filtered.length} Products
            </button>
          </div>
        </>
      )}
    </main>
  );
}