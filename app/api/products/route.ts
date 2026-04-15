// src/app/api/products/route.ts
// GET — shop page ke liye saare products (filter + sort + paginate)

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const search     = searchParams.get("search")     ?? ""
  const sort       = searchParams.get("sort")       ?? "newest"
  const minPrice   = searchParams.get("minPrice")   ? parseInt(searchParams.get("minPrice")!) : undefined
  const maxPrice   = searchParams.get("maxPrice")   ? parseInt(searchParams.get("maxPrice")!) : undefined
  const categoryId = searchParams.get("categoryId") ?? undefined
  const featured   = searchParams.get("featured")   === "true"
  const page       = parseInt(searchParams.get("page") ?? "1")
  const limit      = parseInt(searchParams.get("limit") ?? "12")

  try {
    const where: any = {
      isActive: true,
      AND: [
        search ? {
          OR: [
            { name:             { contains: search, mode: "insensitive" } },
            { description:      { contains: search, mode: "insensitive" } },
            { shortDescription: { contains: search, mode: "insensitive" } },
          ],
        } : {},
        categoryId ? { categoryId } : {},
        featured   ? { isFeatured: true } : {},
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

    // Price range for filters
    const priceAgg = await prisma.product.aggregate({
      _min: { basePrice: true },
      _max: { basePrice: true },
      where: { isActive: true },
    })

    return NextResponse.json({
      products,
      total,
      pages:    Math.ceil(total / limit),
      minPrice: priceAgg._min.basePrice ?? 0,
      maxPrice: priceAgg._max.basePrice ?? 100000,
    })
  } catch (e) {
    console.error("Products API error:", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}