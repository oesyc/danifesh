// app/sitemap.ts
import { MetadataRoute } from "next"
import { prisma } from "@/src/lib/prisma"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ── Static pages ──────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: "https://www.danifesh.store",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: "https://www.danifesh.store/shop",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: "https://www.danifesh.store/contact",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ]

  // ── Product pages ─────────────────────────────────────
  const products = await prisma.product.findMany({
    where: { isActive:true },
    select: { slug: true, updatedAt: true },
  })

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `https://www.danifesh.store/products/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  // ── Category pages ────────────────────────────────────
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { slug: true, updatedAt: true },
  })

  const categoryPages: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `https://www.danifesh.store/category/${c.slug}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }))

  return [...staticPages, ...productPages, ...categoryPages]
}