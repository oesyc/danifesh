// ============================================================
//  app/shop/page.tsx  ←  SERVER COMPONENT (no "use client")
// ============================================================
//
//  ✅ یہ file Server Component ہے — یہاں async/await چلتا ہے
//  ✅ Database یا API call یہاں کریں
//  ✅ یہ data ShopClient کو props میں دے دیں
//
// ─── DYNAMIC PRODUCTS کے لیے کیا کرنا ہے ─────────────────────
//
//  OPTION A — Prisma (Database):
//    1. نیچے DUMMY_PRODUCTS کی جگہ یہ لکھیں:
//       const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } })
//    2. Product type کو اپنے Prisma model سے match کریں
//
//  OPTION B — External API:
//    1. DUMMY_PRODUCTS کی جگہ:
//       const res = await fetch("https://your-api.com/products", { next: { revalidate: 60 } })
//       const products: Product[] = await res.json()
//
//  OPTION C — Next.js Route Handler (/api/products):
//    1. app/api/products/route.ts بنائیں
//    2. یہاں fetch کریں:
//       const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/products`)
//       const products: Product[] = await res.json()
//
// ─────────────────────────────────────────────────────────────

import { ShopClient } from "./shopClient";

// ══════════════════════════════════════════════════════════════
//  TYPE  — اپنے DB model سے match کریں
// ══════════════════════════════════════════════════════════════
export type Product = {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  hoverImage?: string;
  category: "Men" | "Women" | "Accessories" | "Footwear";
  tag?: "New" | "Sale" | "Hot" | "Limited";
  rating: number;
  reviews: number;
  colors?: string[];
};

// ══════════════════════════════════════════════════════════════
//  DUMMY DATA  — بعد میں صرف یہ حصہ بدلنا ہے
//  TODO: نیچے دیکھیں کہ کیسے replace کریں
// ══════════════════════════════════════════════════════════════
const DUMMY_PRODUCTS: Product[] = [
  {
    id: 1, name: "Sage Linen Co-ord Set", price: 4200, originalPrice: 5500,
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=500&q=75",
    category: "Women", tag: "Sale", rating: 4.8, reviews: 124,
    colors: ["#3f554f", "#c8a882", "#1a1a1a"],
  },
  {
    id: 2, name: "Classic Oxford Shirt", price: 2800,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&q=75",
    category: "Men", tag: "New", rating: 4.6, reviews: 88,
    colors: ["#ffffff", "#3f554f", "#8fa89f"],
  },
  {
    id: 3, name: "Floral Midi Dress", price: 5100,
    image: "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=500&q=75",
    hoverImage: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=500&q=75",
    category: "Women", tag: "Hot", rating: 4.9, reviews: 201,
    colors: ["#f5d7c3", "#3f554f", "#d4a8c7"],
  },
  {
    id: 4, name: "Premium Chino Trousers", price: 3400, originalPrice: 4200,
    image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&q=75",
    category: "Men", tag: "Sale", rating: 4.5, reviews: 67,
    colors: ["#c8a882", "#1a1a1a", "#3f554f"],
  },
  {
    id: 5, name: "Embroidered Lawn Kurti", price: 1900,
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=75",
    category: "Women", tag: "New", rating: 4.7, reviews: 156,
    colors: ["#ffffff", "#f5d7c3", "#c8d9d3"],
  },
  {
    id: 6, name: "Structured Blazer", price: 6800,
    image: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&q=75",
    category: "Women", tag: "Limited", rating: 4.9, reviews: 43,
    colors: ["#1a1a1a", "#3f554f", "#c8a882"],
  },
  {
    id: 7, name: "Slim Fit Kurta Shalwar", price: 3200,
    image: "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?w=500&q=75",
    category: "Men", rating: 4.4, reviews: 92,
    colors: ["#ffffff", "#8fa89f", "#1a1a1a"],
  },
  {
    id: 8, name: "Velvet Evening Clutch", price: 2100, originalPrice: 2800,
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=75",
    category: "Accessories", tag: "Sale", rating: 4.6, reviews: 38,
    colors: ["#3f554f", "#c8a882", "#d4a8c7"],
  },
  {
    id: 9, name: "Summer Breeze Maxi", price: 4800,
    image: "https://images.unsplash.com/photo-1572804013427-4d7ca7268217?w=500&q=75",
    category: "Women", tag: "New", rating: 4.8, reviews: 12,
    colors: ["#f5d7c3", "#c8d9d3"],
  },
  {
    id: 10, name: "Heritage Leather Belt", price: 1600,
    image: "https://images.unsplash.com/photo-1624222247344-550fb60fe8ff?w=500&q=75",
    category: "Accessories", tag: "New", rating: 4.5, reviews: 7,
    colors: ["#c8a882", "#1a1a1a"],
  },
  {
    id: 11, name: "Pintuck Dress Shirt", price: 2600,
    image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=500&q=75",
    category: "Men", tag: "New", rating: 4.6, reviews: 19,
    colors: ["#ffffff", "#3f554f"],
  },
  {
    id: 12, name: "Block Print Dupatta Set", price: 3900,
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=500&q=75",
    category: "Women", tag: "New", rating: 4.7, reviews: 31,
    colors: ["#c8d9d3", "#f5d7c3", "#3f554f"],
  },
];

// ══════════════════════════════════════════════════════════════
//  SERVER COMPONENT — data fetch یہاں ہوتی ہے
// ══════════════════════════════════════════════════════════════
export default async function ShopPage() {

  // ──────────────────────────────────────────────────────────
  //  TODO: جب dynamic products چاہیں تو بس نیچے کی
  //  DUMMY_PRODUCTS لائن کو ان میں سے کسی سے replace کریں:
  //
  //  [Prisma]
  //  const products = await prisma.product.findMany()
  //
  //  [API fetch]
  //  const res = await fetch("https://api.example.com/products")
  //  const products: Product[] = await res.json()
  // ──────────────────────────────────────────────────────────
  const products: Product[] = DUMMY_PRODUCTS;

  // data ShopClient کو pass کریں — وہ filtering/UI handle کرے گا
  return <ShopClient products={products} />;
}