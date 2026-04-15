// src/app/api/user/wishlist/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

// ─── GET — wishlist items ─────────────────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please Login" }, { status: 401 })
    }

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true, name: true, slug: true,
                basePrice: true, compareAtPrice: true, stock: true,
                images: { where: { isPrimary: true }, take: 1, select: { url: true } },
              },
            },
          },
          orderBy: { addedAt: "desc" },
        },
      },
    })

    return NextResponse.json({ items: wishlist?.items ?? [] })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─── POST — wishlist mein add karo ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      // Guest ke liye friendly message
      return NextResponse.json(
        { error: "Login required for wishlist", requiresLogin: true },
        { status: 401 }
      )
    }

    const { productId } = await req.json()
    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Wishlist dhundo ya banao
    let wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    })
    if (!wishlist) {
      wishlist = await prisma.wishlist.create({
        data: { userId: session.user.id },
      })
    }

    // Already wishlist mein hai?
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId,
        },
      },
    })

    if (existing) {
      return NextResponse.json({ message: "Product is already in your wishlist!", alreadyAdded: true })
    }

    await prisma.wishlistItem.create({
      data: { wishlistId: wishlist.id, productId },
    })

    return NextResponse.json({ message: "Product added to your wishlist! ♥" })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─── DELETE — wishlist se remove karo ────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please Login" }, { status: 401 })
    }

    const { productId } = await req.json()

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
    })
    if (!wishlist) return NextResponse.json({ message: "Removed successfully!" })

    await prisma.wishlistItem.deleteMany({
      where: { wishlistId: wishlist.id, productId },
    })

    return NextResponse.json({ message: "Product removed from your wishlist!" })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}