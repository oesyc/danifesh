"use client"
// src/app/category/[slug]/page.tsx
// /category/women, /category/men etc.

import { useParams } from "next/navigation"
import ArchivePage from "@/src/components/ArchivePage"

export default function CategoryClient({ slug }: { slug: string }) {
  

  return (
    <ArchivePage
      mode="category"
      apiBase={`/api/categories/${slug}`}
    />
  )
}