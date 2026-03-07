"use client";

import { useState } from "react";

// ══════════════════════════════════════════════════════════════════
//  TYPES  —  replace these with your Prisma/DB types later
// ══════════════════════════════════════════════════════════════════
type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  category: string;
  tag?: "New" | "Sale" | "Hot" | "Limited";
  rating: number;
  reviews: number;
  colors?: string[];
};

type Category = {
  id: number;
  name: string;
  image: string;
  count: number;
};

type Testimonial = {
  id: number;
  name: string;
  location: string;
  review: string;
  rating: number;
  avatar: string;
};

// ══════════════════════════════════════════════════════════════════
//  DUMMY DATA  —  swap with your DB fetch / API call later
//  e.g.  const products = await prisma.product.findMany()
// ══════════════════════════════════════════════════════════════════

const CATEGORIES: Category[] = [
  { id: 1, name: "Women", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&q=70", count: 124 },
  { id: 2, name: "Men", image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=400&q=70", count: 98 },
  { id: 3, name: "Abayas", image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=400&q=70", count: 56 },
  { id: 4, name: "Accessories", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=70", count: 73 },
  { id: 5, name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70", count: 45 },
];

// ── FEATURED PRODUCTS ─────────────────────────────────────────────
// TODO: Replace with → const products = await prisma.product.findMany({ where: { featured: true } })
const FEATURED_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Sage Linen Co-ord Set",
    price: 4200,
    originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=75",
    category: "Women",
    tag: "Sale",
    rating: 4.8,
    reviews: 124,
    colors: ["#3f554f", "#c8a882", "#1a1a1a"],
  },
  {
    id: 2,
    name: "Classic Oxford Shirt",
    price: 2800,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=75",
    category: "Men",
    tag: "New",
    rating: 4.6,
    reviews: 88,
    colors: ["#ffffff", "#3f554f", "#8fa89f"],
  },
  {
    id: 3,
    name: "Floral Midi Dress",
    price: 5100,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=75",
    category: "Women",
    tag: "Hot",
    rating: 4.9,
    reviews: 201,
    colors: ["#f5d7c3", "#3f554f", "#d4a8c7"],
  },
  {
    id: 4,
    name: "Premium Chino Trousers",
    price: 3400,
    originalPrice: 4200,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=75",
    category: "Men",
    tag: "Sale",
    rating: 4.5,
    reviews: 67,
    colors: ["#c8a882", "#1a1a1a", "#3f554f"],
  },
  {
    id: 5,
    name: "Embroidered Lawn Kurti",
    price: 1900,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=75",
    category: "Women",
    tag: "New",
    rating: 4.7,
    reviews: 156,
    colors: ["#ffffff", "#f5d7c3", "#c8d9d3"],
  },
  {
    id: 6,
    name: "Structured Blazer",
    price: 6800,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&q=75",
    category: "Women",
    tag: "Limited",
    rating: 4.9,
    reviews: 43,
    colors: ["#1a1a1a", "#3f554f", "#c8a882"],
  },
  {
    id: 7,
    name: "Slim Fit Kurta Shalwar",
    price: 3200,
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=500&q=75",
    category: "Men",
    rating: 4.4,
    reviews: 92,
    colors: ["#ffffff", "#8fa89f", "#1a1a1a"],
  },
  {
    id: 8,
    name: "Velvet Evening Clutch",
    price: 2100,
    originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=75",
    category: "Accessories",
    tag: "Sale",
    rating: 4.6,
    reviews: 38,
    colors: ["#3f554f", "#c8a882", "#d4a8c7"],
  },
];

// ── NEW ARRIVALS ──────────────────────────────────────────────────
// TODO: Replace with → const newArrivals = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 4 })
const NEW_ARRIVALS: Product[] = [
  {
    id: 9,
    name: "Summer Breeze Maxi",
    price: 4800,
    image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=500&q=75",
    category: "Women",
    tag: "New",
    rating: 4.8,
    reviews: 12,
    colors: ["#f5d7c3", "#c8d9d3"],
  },
  {
    id: 10,
    name: "Heritage Leather Belt",
    price: 1600,
    image: "https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=500&q=75",
    category: "Accessories",
    tag: "New",
    rating: 4.5,
    reviews: 7,
    colors: ["#c8a882", "#1a1a1a"],
  },
  {
    id: 11,
    name: "Pintuck Dress Shirt",
    price: 2600,
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=75",
    category: "Men",
    tag: "New",
    rating: 4.6,
    reviews: 19,
    colors: ["#ffffff", "#3f554f"],
  },
  {
    id: 12,
    name: "Block Print Dupatta Set",
    price: 3900,
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=75",
    category: "Women",
    tag: "New",
    rating: 4.7,
    reviews: 31,
    colors: ["#c8d9d3", "#f5d7c3", "#3f554f"],
  },
];

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Ayesha Malik",
    location: "Lahore",
    review: "Absolutely love the quality! The linen co-ord set is so comfortable and the stitching is impeccable. Will definitely order again.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=47",
  },
  {
    id: 2,
    name: "Omar Farooq",
    location: "Karachi",
    review: "The Oxford shirt exceeded my expectations. Fast delivery and packaging was beautiful. Danifesh has become my go-to brand.",
    rating: 5,
    avatar: "https://i.pravatar.cc/80?img=11",
  },
  {
    id: 3,
    name: "Sara Hussain",
    location: "Islamabad",
    review: "Ordered the blazer for a wedding — got so many compliments! The fit is perfect and the fabric feels premium.",
    rating: 4,
    avatar: "https://i.pravatar.cc/80?img=32",
  },
];

// ══════════════════════════════════════════════════════════════════
//  SMALL REUSABLE COMPONENTS
// ══════════════════════════════════════════════════════════════════

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <svg key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? "text-[#3f554f]" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ))}
  </div>
);

const TagBadge = ({ tag }: { tag: string }) => {
  const colors: Record<string, string> = {
    New: "bg-[#3f554f] text-white",
    Sale: "bg-rose-500 text-white",
    Hot: "bg-amber-500 text-white",
    Limited: "bg-[#2f403b] text-[#c8d9d3]",
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${colors[tag] || "bg-gray-200 text-gray-700"}`}>
      {tag}
    </span>
  );
};

// ── Product Card ──────────────────────────────────────────────────
function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;

  return (
    <div
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div className="relative overflow-hidden aspect-[3/4] bg-[#f5f8f6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={hovered && product.hoverImage ? product.hoverImage : product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.tag && <TagBadge tag={product.tag} />}
          {discount && (
            <span className="text-[10px] font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <svg
            className={`w-4 h-4 transition-colors ${wishlisted ? "text-rose-500 fill-rose-500" : "text-gray-400"}`}
            fill={wishlisted ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* Quick Add — slides up on hover */}
        <div className={`absolute bottom-0 left-0 right-0 bg-[#3f554f] text-white text-xs font-bold uppercase tracking-widest py-3 text-center transition-transform duration-300 ${hovered ? "translate-y-0" : "translate-y-full"}`}>
          Quick Add to Cart
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[11px] uppercase tracking-widest text-[#8fa89f] font-semibold mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-bold text-gray-800 leading-snug mb-2 line-clamp-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1rem" }}>
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mb-3">
          <StarRating rating={product.rating} />
          <span className="text-[11px] text-gray-400">({product.reviews})</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-[#3f554f]">
              Rs. {product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                Rs. {product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* Color dots */}
          {product.colors && (
            <div className="flex gap-1">
              {product.colors.slice(0, 3).map((c) => (
                <div
                  key={c}
                  className="w-3.5 h-3.5 rounded-full border border-gray-200 cursor-pointer hover:scale-125 transition-transform"
                  style={{ background: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  SECTION HEADER
// ══════════════════════════════════════════════════════════════════
function SectionHeader({ tag, title, subtitle, cta }: { tag: string; title: string; subtitle?: string; cta?: string }) {
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
        <a href="#" className="shrink-0 text-sm font-bold text-[#3f554f] border-b-2 border-[#3f554f] pb-0.5 hover:text-[#2f403b] transition-colors">
          {cta} →
        </a>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════
export default function Downp() {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = ["All", "Women", "Men", "Accessories"];

  const filteredProducts =
    activeFilter === "All"
      ? FEATURED_PRODUCTS
      : FEATURED_PRODUCTS.filter((p) => p.category === activeFilter);

  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  return (
    <main className="bg-white" style={{ fontFamily: "'Lato', sans-serif" }}>

      {/* ══ 1. CATEGORIES STRIP ══════════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader tag="Browse" title="Shop by Category" cta="View All" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <a
              key={cat.id}
              href="#"
              className="group relative overflow-hidden rounded-2xl aspect-3/4 cursor-pointer"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2f403b]/80 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4">
                <p className="text-white font-black text-lg leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {cat.name}
                </p>
                <p className="text-[#c8d9d3] text-xs mt-0.5">{cat.count} items</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ══ 2. FEATURED PRODUCTS ═════════════════════════════════════════ */}
      {/*
        ── DATABASE INTEGRATION ──
        Replace FEATURED_PRODUCTS with:
        const products = await prisma.product.findMany({ where: { featured: true } })
        or: const { data } = useSWR('/api/products?featured=true', fetcher)
      */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader
          tag="Handpicked"
          title="Featured Collection"
          subtitle="Curated pieces that define the season's most coveted looks."
          cta="View All Products"
        />

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 flex-wrap mb-8">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeFilter === f
                  ? "bg-[#3f554f] text-white shadow-md"
                  : "bg-[#f0f5f3] text-[#3f554f] hover:bg-[#dce9e4]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#"
            className="inline-flex items-center gap-2 border-2 border-[#3f554f] text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-full hover:bg-[#3f554f] hover:text-white transition-all duration-300"
          >
            Load More Products
          </a>
        </div>
      </section>

      {/* ══ 3. PROMO BANNER ══════════════════════════════════════════════ */}
      <section className="px-4 max-w-7xl mx-auto pb-16">
        <div
          className="relative overflow-hidden rounded-3xl min-h-80 flex items-center"
          style={{ background: "linear-gradient(135deg, #2f403b 0%, #3f554f 50%, #5a7a71 100%)" }}
        >
          {/* Decorative circles */}
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute -right-4 bottom-0 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-1/3 top-1/2 -translate-y-1/2 w-1 h-32 bg-white/10 rotate-12" />

          <div className="relative z-10 px-8 lg:px-16 py-12 flex flex-col lg:flex-row items-center justify-between gap-8 w-full">
            <div>
              <span className="text-[#c8d9d3] text-xs font-bold uppercase tracking-[0.3em]">Limited Time Offer</span>
              <h2 className="text-4xl lg:text-6xl font-black text-white mt-2 leading-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                Eid Collection<br />
                <span className="italic font-light">Up to 50% Off</span>
              </h2>
              <p className="text-[#a8c4bc] mt-3 max-w-sm">
                Dress for every cherished moment. Shop our curated Eid edit before it sells out.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4 shrink-0">
              {/* Countdown (static UI — wire up with useEffect + Date for live countdown) */}
              <div className="flex gap-3">
                {[["02", "Days"], ["14", "Hours"], ["36", "Mins"], ["52", "Secs"]].map(([val, label]) => (
                  <div key={label} className="flex flex-col items-center bg-white/10 rounded-xl px-4 py-3 min-w-15">
                    <span className="text-2xl font-black text-white" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{val}</span>
                    <span className="text-[10px] text-[#c8d9d3] uppercase tracking-widest mt-0.5">{label}</span>
                  </div>
                ))}
              </div>
              <a
                href="#"
                className="w-full text-center bg-white text-[#3f554f] font-bold text-sm uppercase tracking-widest px-10 py-3.5 rounded-full hover:bg-[#f0f5f3] transition-all active:scale-95"
              >
                Shop Eid Sale
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══ 4. NEW ARRIVALS ══════════════════════════════════════════════ */}
      {/*
        ── DATABASE INTEGRATION ──
        Replace NEW_ARRIVALS with:
        const newArrivals = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, take: 4 })
        or: const { data } = useSWR('/api/products?sort=newest&limit=4', fetcher)
      */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader
          tag="Fresh Drops"
          title="New Arrivals"
          subtitle="Just landed — be the first to own these pieces."
          cta="See All New"
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {NEW_ARRIVALS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ══ 5. WHY DANIFESH — USP STRIP ════════════════════════════════ */}
      <section className="bg-[#f5f8f6] py-14 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: "🚚", title: "Free Delivery", desc: "On all orders above Rs. 2,999" },
            { icon: "↩️", title: "Easy Returns", desc: "7-day hassle-free return policy" },
            { icon: "🔒", title: "Secure Payment", desc: "100% protected transactions" },
            { icon: "✂️", title: "Premium Quality", desc: "Crafted with finest fabrics" },
          ].map((item) => (
            <div key={item.title} className="flex flex-col items-center text-center gap-3">
              <span className="text-3xl">{item.icon}</span>
              <h4 className="font-black text-[#3f554f] text-base">{item.title}</h4>
              <p className="text-xs text-[#8fa89f] leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ 6. INSTAGRAM / STYLE GRID ══════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <SectionHeader
          tag="@danifesh"
          title="Style Feed"
          subtitle="Tag us to be featured. Real people, real style."
        />
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* ══ 7. TESTIMONIALS ════════════════════════════════════════════ */}
      <section className="bg-[#f5f8f6] py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            tag="Reviews"
            title="What Our Customers Say"
            subtitle="Thousands of happy customers across Pakistan."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.id} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
                <StarRating rating={t.rating} />
                <p className="text-sm text-gray-600 leading-relaxed mt-4 mb-6 italic">
                  "{t.review}"
                </p>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* ══ 8. NEWSLETTER ═══════════════════════════════════════════════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-[#2f403b] px-8 lg:px-16 py-14 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="absolute -left-10 -bottom-10 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-1/4 -top-6 w-32 h-32 rounded-full bg-white/5" />

          <div className="relative z-10 text-center lg:text-left">
            <span className="text-[#c8d9d3] text-xs font-bold uppercase tracking-[0.3em]">Stay in the loop</span>
            <h2 className="text-3xl lg:text-4xl font-black text-white mt-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              Join the Danifesh Family
            </h2>
            <p className="text-[#a8c4bc] mt-2 max-w-sm text-sm">
              Get exclusive early access, style tips, and special offers straight to your inbox.
            </p>
          </div>

          <div className="relative z-10 w-full max-w-md">
            {subscribed ? (
              <div className="bg-white/10 rounded-2xl py-5 px-6 text-center">
                <span className="text-2xl">🎉</span>
                <p className="text-white font-bold mt-2">You're in! Welcome to the family.</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 bg-white/10 border border-white/20 text-white placeholder-white/50 rounded-full px-5 py-3.5 text-sm outline-none focus:border-white/50 transition"
                />
                <button
                  onClick={() => { if (email) setSubscribed(true); }}
                  className="bg-white text-[#3f554f] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#f0f5f3] transition-all active:scale-95 shrink-0"
                >
                  Subscribe
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ══ 9. FOOTER ════════════════════════════════════════════════════ */}
      <footer className="bg-[#1e2e2a] text-white pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#3f554f] flex items-center justify-center text-white font-black text-sm">D</div>
                <span className="text-xl font-black tracking-tight uppercase">Danifesh</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                Crafting refined fashion for modern Pakistan. Quality, style, and confidence — delivered to your door.
              </p>
              <div className="flex gap-3 mt-6">
                {["instagram", "facebook", "twitter", "tiktok"].map((s) => (
                  <a key={s} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3f554f] transition-colors text-xs font-bold uppercase">
                    {s[0].toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Shop",
                links: ["New Arrivals", "Women", "Men", "Accessories", "Sale"],
              },
              {
                title: "Help",
                links: ["My Account", "Track Order", "Returns & Exchanges", "Size Guide", "FAQs"],
              },
              {
                title: "Company",
                links: ["About Danifesh", "Sustainability", "Careers", "Press", "Contact Us"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-widest font-bold text-[#8fa89f] mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Danifesh. All rights reserved.</p>
            <div className="flex gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}