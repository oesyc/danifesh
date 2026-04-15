"use client"
// src/app/category/[slug]/[childSlug]/page.tsx
// /category/women/dresses, /category/men/shirts etc.

import { useParams } from "next/navigation"
import ArchivePage from "@/src/components/ArchivePage"

export default function SubCategoryPage() {
  // childSlug use karo — yeh unique hona chahiye DB mein
  const { childSlug } = useParams<{ slug: string; childSlug: string }>()

  return (
    <ArchivePage
      mode="category"
      apiBase={`/api/categories/${childSlug}`}
    />
  )
}