// src/app/api/categories/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

type Params = { params: Promise<{ slug: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const { slug } = await params  // ← Next.js 16 fix

  const { searchParams } = new URL(req.url)
  const sort     = searchParams.get("sort")     ?? "newest"
  const minPrice = searchParams.get("minPrice") ? parseInt(searchParams.get("minPrice")!) : undefined
  const maxPrice = searchParams.get("maxPrice") ? parseInt(searchParams.get("maxPrice")!) : undefined
  const page     = parseInt(searchParams.get("page")  ?? "1")
  const limit    = parseInt(searchParams.get("limit") ?? "12")

  try {
    const category = await prisma.category.findUnique({
      where: { slug },  // ← params.slug ki jagah slug
      include: {
        parent:   { select: { id: true, name: true, slug: true } },
        children: { where: { isActive: true }, select: { id: true, name: true, slug: true } },
      },
    })

    if (!category || !category.isActive) {
      return NextResponse.json({ error: "Category Not Found" }, { status: 404 })
    }

    const categoryIds = category.children.length > 0
      ? [category.id, ...category.children.map(c => c.id)]
      : [category.id]

    const where: any = {
      isActive:   true,
      categoryId: { in: categoryIds },
      AND: [
        minPrice !== undefined ? { basePrice: { gte: minPrice } } : {},
        maxPrice !== undefined ? { basePrice: { lte: maxPrice } } : {},
      ],
    }

    const orderBy =
      sort === "price_asc"  ? { basePrice: "asc"  as const } :
      sort === "price_desc" ? { basePrice: "desc" as const } :
      sort === "popular"    ? { reviews:   { _count: "desc" as const } } :
                              { createdAt: "desc" as const }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images:   { where: { isPrimary: true }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          _count:   { select: { reviews: true } },
        },
        orderBy,
        skip:  (page - 1) * limit,
        take:  limit,
      }),
      prisma.product.count({ where }),
    ])

    const priceAgg = await prisma.product.aggregate({
      _min: { basePrice: true },
      _max: { basePrice: true },
      where: { isActive: true, categoryId: { in: categoryIds } },
    })

    return NextResponse.json({
      category,
      products,
      total,
      pages:    Math.ceil(total / limit),
      minPrice: priceAgg._min.basePrice ?? 0,
      maxPrice: priceAgg._max.basePrice ?? 100000,
    })
  } catch (e) {
    console.error("Category API error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}