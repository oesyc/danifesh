// src/app/api/search/route.ts
// Product search — keyword based, returns top 6 results

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim()
  if (!q || q.length < 2) return NextResponse.json({ products: [] })

  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name:             { contains: q, mode: "insensitive" } },
          { shortDescription: { contains: q, mode: "insensitive" } },
          { sku:              { contains: q, mode: "insensitive" } },
          { tags: { some: { tag: { name: { contains: q, mode: "insensitive" } } } } },
        ],
      },
      take: 6,
      select: {
        id:        true,
        name:      true,
        slug:      true,
        basePrice: true,
        images:    { where: { isPrimary: true }, take: 1, select: { url: true } },
        category:  { select: { name: true } },
      },
    })
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] })
  }
}