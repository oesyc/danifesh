// src/app/shop/page.tsx
// /shop — saare products ki listing

import ArchivePage from "@/src/components/ArchivePage"

export const metadata = {
  title:       "Shop — Danifesh",
  description: "Browse our complete collection of premium fashion at Danifesh.",
}

export default function ShopPage() {
  return (
    <ArchivePage
      mode="shop"
      apiBase="/api/products"
      title="Shop All"
    />
  )
}