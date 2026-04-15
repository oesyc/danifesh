// src/app/api/products/[slug]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        category: {
          select: {
            id: true, name: true, slug: true,
            parent: { select: { id: true, name: true, slug: true } },
          },
        },
        images: {
          orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        },
        variants: {
          where: { isActive: true },
          include: {
            values: {
              include: { option: { select: { name: true } } },
            },
          },
        },
        attributes: true,
        tags: {
          include: { tag: { select: { name: true, slug: true } } },
        },
        reviews: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            user: { select: { name: true, image: true } },
            images: true,
          },
        },
        _count: {
          select: { reviews: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: "Product Not Found" }, { status: 404 })
    }

    // Average rating calculate karo
    const approvedReviews = await prisma.review.aggregate({
      where: { productId: product.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: { rating: true },
    })

    return NextResponse.json({
      product,
      avgRating: approvedReviews._avg.rating ?? 0,
      reviewCount: approvedReviews._count.rating,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}