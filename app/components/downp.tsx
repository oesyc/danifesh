"use client"

import { useState, useEffect } from "react"
import ProductCard, { ProductCardData } from "@/src/components/ProductCard"
import HomeCategoryStrip from "@/src/components/HomeCategoryStrip"

type Testimonial = {
  id: number; name: string; location: string
  review: string; rating: number; avatar: string
}

const TESTIMONIALS: Testimonial[] = [
  { id: 1, name: "Ayesha Malik",  location: "Lahore",    rating: 5, avatar: "https://i.pravatar.cc/80?img=47", review: "Absolutely love the quality! The linen co-ord set is so comfortable and the stitching is impeccable. Will definitely order again." },
  { id: 2, name: "Omar Farooq",   location: "Karachi",   rating: 5, avatar: "https://i.pravatar.cc/80?img=11", review: "The Oxford shirt exceeded my expectations. Fast delivery and packaging was beautiful. Danifesh has become my go-to brand." },
  { id: 3, name: "Sara Hussain",  location: "Islamabad", rating: 4, avatar: "https://i.pravatar.cc/80?img=32", review: "Ordered the blazer for a wedding — got so many compliments! The fit is perfect and the fabric feels premium." },
]

// ── Helpers ───────────────────────────────────────────────────────
const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(s => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-[#3f554f]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
)

function SectionHeader({ tag, title, subtitle, cta, href = "#" }: { tag: string; title: string; subtitle?: string; cta?: string; href?: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-px bg-[#3f554f]" />
          <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f554f]">{tag}</span>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif" }} className="text-4xl lg:text-5xl font-black text-gray-900 leading-tight">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-[#8fa89f] mt-2 max-w-md">{subtitle}</p>}
      </div>
      {cta && (
        <a href={href} className="shrink-0 text-sm font-bold text-[#3f554f] border-b-2 border-[#3f554f] pb-0.5 hover:text-[#2f403b] transition-colors">
          {cta} →
        </a>
      )}
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white shadow-sm animate-pulse">
      <div className="aspect-[3/4] bg-gray-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-gray-100 rounded w-1/3" />
        <div className="h-4 bg-gray-100 rounded w-3/4" />
        <div className="h-4 bg-gray-100 rounded w-1/4" />
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────
export default function Downp() {
  const [featuredProducts, setFeaturedProducts] = useState<ProductCardData[]>([])
  const [newArrivals,      setNewArrivals]      = useState<ProductCardData[]>([])
  const [featuredLoading,  setFeaturedLoading]  = useState(true)
  const [newLoading,       setNewLoading]       = useState(true)
  const [activeFilter,     setActiveFilter]     = useState("All")
  const [categories,       setCategories]       = useState<string[]>(["All"])
  const [email,            setEmail]            = useState("")
  const [subscribed,       setSubscribed]       = useState(false)

  // Featured products fetch
  useEffect(() => {
    fetch("/api/products?featured=true&limit=8")
      .then(r => r.json())
      .then(d => {
        const prods: ProductCardData[] = (d.products ?? []).map((p: any) => ({
          ...p,
          images: p.images.length > 0 ? p.images : [{ url: "/placeholder.png", altText: null }],
        }))
        setFeaturedProducts(prods)
        // Category filters from fetched products
        const cats = ["All", ...Array.from(new Set(prods.map((p: ProductCardData) => p.category.name))) as string[]]
        setCategories(cats)
      })
      .finally(() => setFeaturedLoading(false))
  }, [])

  // New arrivals fetch
  useEffect(() => {
    fetch("/api/products?sort=newest&limit=4")
      .then(r => r.json())
      .then(d => {
        const prods: ProductCardData[] = (d.products ?? []).map((p: any) => ({
          ...p,
          images: p.images.length > 0 ? p.images : [{ url: "/placeholder.png", altText: null }],
        }))
        setNewArrivals(prods)
      })
      .finally(() => setNewLoading(false))
  }, [])

  const filteredProducts = activeFilter === "All"
    ? featuredProducts
    : featuredProducts.filter(p => p.category.name === activeFilter)

  return (
    <main className="bg-white" style={{ fontFamily: "'Lato', sans-serif" }}>

      {/* ══ 1. CATEGORIES ════════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader tag="Browse" title="Shop by Category" cta="View All" href="/shop" />
        <HomeCategoryStrip />
      </section>

      {/* ══ 2. FEATURED PRODUCTS ════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader
          tag="Handpicked"
          title="Featured Collection"
          subtitle="Curated pieces that define the season's most coveted looks."
          cta="View All Products"
          href="/shop"
        />

        {/* Filter tabs — categories from actual products */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {categories.map(f => (
            <button key={f} onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeFilter === f
                  ? "bg-[#3f554f] text-white shadow-md"
                  : "bg-[#f0f5f3] text-[#3f554f] hover:bg-[#dce9e4]"
              }`}>
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {featuredLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
            : filteredProducts.length > 0
              ? filteredProducts.map(p => <ProductCard key={p.id} product={p} />)
              : <p className="col-span-4 text-center py-10 text-gray-400">Not Found Any Product</p>
          }
        </div>

        <div className="text-center mt-12">
          <a href="/shop"
            className="inline-flex items-center gap-2 border-2 border-[#3f554f] text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-full hover:bg-[#3f554f] hover:text-white transition-all duration-300">
            Load More Products
          </a>
        </div>
      </section>

      {/* ══ 3. PROMO BANNER ══════════════════════════════════════ */}
      <section className="px-4 max-w-7xl mx-auto pb-16">
        <div className="relative overflow-hidden rounded-3xl min-h-80 flex items-center"
          style={{ background: "linear-gradient(135deg, #2f403b 0%, #3f554f 50%, #5a7a71 100%)" }}>
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-1/3 top-1/2 -translate-y-1/2 w-1 h-32 bg-white/10 rotate-12" />
          <div className="relative z-10 px-8 lg:px-16 py-12 flex flex-col lg:flex-row items-center justify-between gap-8 w-full">
            <div>
              <span className="text-[#c8d9d3] text-xs font-bold uppercase tracking-[0.3em]">Limited Time Offer</span>
              <h2 className="text-4xl lg:text-6xl font-black text-white mt-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Eid Collection<br /><span className="italic font-light">Up to 50% Off</span>
              </h2>
              <p className="text-[#a8c4bc] mt-3 max-w-sm">Dress for every cherished moment. Shop our curated Eid edit before it sells out.</p>
            </div>
            <div className="flex flex-col items-center gap-4 shrink-0">
              <div className="flex gap-3">
                {[["02","Days"],["14","Hours"],["36","Mins"],["52","Secs"]].map(([val, label]) => (
                  <div key={label} className="flex flex-col items-center bg-white/10 rounded-xl px-4 py-3 min-w-15">
                    <span className="text-2xl font-black text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{val}</span>
                    <span className="text-[10px] text-[#c8d9d3] uppercase tracking-widest mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
              <a href="/shop"
                className="w-full text-center bg-white text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-3.5 rounded-full hover:bg-[#f0f5f3] transition-all active:scale-95">
                Shop Eid Sale
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. NEW ARRIVALS ══════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader
          tag="Fresh Drops"
          title="New Arrivals"
          subtitle="Just landed — be the first to own these pieces."
          cta="See All New"
          href="/shop?sort=newest"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {newLoading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : newArrivals.length > 0
              ? newArrivals.map(p => <ProductCard key={p.id} product={p} />)
              : <p className="col-span-4 text-center py-10 text-gray-400">Not Found Any Product</p>
          }
        </div>
      </section>

      {/* ══ 5. WHY DANIFESH ══════════════════════════════════════ */}
      <section className="bg-[#f5f8f6] py-14 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: "🚚", title: "Free Delivery",   desc: "On all orders above Rs. 2,999" },
            { icon: "↩️", title: "Easy Returns",    desc: "7-day hassle-free return policy" },
            { icon: "🔒", title: "Secure Payment",  desc: "100% protected transactions" },
            { icon: "✂️", title: "Premium Quality", desc: "Crafted with finest fabrics" },
          ].map(item => (
            <div key={item.title} className="flex flex-col items-center text-center gap-3">
              <span className="text-3xl">{item.icon}</span>
              <h4 className="font-black text-[#3f554f] text-base">{item.title}</h4>
              <p className="text-xs text-[#8fa89f] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 6. INSTAGRAM GRID ════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader tag="@danifesh" title="Style Feed" subtitle="Tag us to be featured. Real people, real style." />
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {[
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&q=65",
            "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&q=65",
            "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=65",
            "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&q=65",
            "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=300&q=65",
            "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=300&q=65",
          ].map((src, i) => (
            <a key={i} href="#" className="group relative overflow-hidden rounded-xl aspect-square">
              <img src={src} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-[#3f554f]/0 group-hover:bg-[#3f554f]/40 transition-all duration-300 flex items-center justify-center">
                <svg className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ 7. TESTIMONIALS ══════════════════════════════════════ */}
      <section className="bg-[#f5f8f6] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader tag="Reviews" title="What Our Customers Say" subtitle="Thousands of happy customers across Pakistan." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <StarRating rating={t.rating} />
                <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-6 italic">"{t.review}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-bold text-[#3f554f]">{t.name}</p>
                    <p className="text-xs text-[#8fa89f]">{t.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ 8. NEWSLETTER ════════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-[#2f403b] px-8 lg:px-16 py-14 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-1/4 -top-6 w-32 h-32 rounded-full bg-white/5" />
          <div className="relative z-10 text-center lg:text-left">
            <span className="text-[#c8d9d3] text-xs font-bold uppercase tracking-[0.3em]">Stay in the loop</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Join the Danifesh Family
            </h2>
            <p className="text-[#a8c4bc] mt-2 max-w-sm text-sm">Get exclusive early access, style tips, and special offers straight to your inbox.</p>
          </div>
          <div className="relative z-10 w-full max-w-md">
            {subscribed ? (
              <div className="bg-white/10 rounded-2xl py-5 px-6 text-center">
                <span className="text-2xl">🎉</span>
                <p className="text-white font-bold mt-2">You're in! Welcome to the family.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-full px-5 py-3.5 text-sm outline-none focus:border-white/50 transition" />
                <button onClick={() => { if (email) setSubscribed(true) }}
                  className="bg-white text-[#3f554f] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#f0f5f3] transition-all active:scale-95 shrink-0">
                  Subscribe
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

    </main>
  )
} 