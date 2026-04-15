// src/app/api/products/[slug]/related/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const current = await prisma.product.findUnique({
      where: { slug },
      select: { id: true, categoryId: true },
    })

    if (!current) return NextResponse.json({ products: [] })

    const related = await prisma.product.findMany({
      where: {
        categoryId: current.categoryId,
        isActive: true,
        id: { not: current.id },
      },
      take: 4,
      select: {
        id: true, name: true, slug: true,
        basePrice: true, compareAtPrice: true,
        images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
        _count: { select: { reviews: true } },
      },
    })

    return NextResponse.json({ products: related })
  } catch {
    return NextResponse.json({ products: [] })
  }
}