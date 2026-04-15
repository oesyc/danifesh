// src/app/api/user/cart/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { getOrCreateCart } from "@/src/lib/cart-helper"

// ─── GET — cart items fetch karo ──────────────────────────
export async function GET() {
  try {
    const { cart, isGuest, sessionId } = await getOrCreateCart()

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, basePrice: true, stock: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
        variant: {
          select: {
            id: true, price: true, stock: true, imageUrl: true,
            values: { include: { option: { select: { name: true } } } },
          },
        },
      },
    })

    const res = NextResponse.json({ items, cartId: cart.id })

    // Guest ke liye cookie set karo
    if (isGuest && sessionId) {
      res.cookies.set("guest_session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
        sameSite: "lax",
      })
    }

    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─── POST — item add karo ─────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { productId, variantId, quantity = 1 } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    // Product check karo
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      select: { id: true, stock: true, name: true },
    })
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Variant check karo (agar diya hai)
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
        select: { stock: true, isActive: true },
      })
      if (!variant || !variant.isActive) {
        return NextResponse.json({ error: "Variant not available" }, { status: 400 })
      }
      if (variant.stock < quantity) {
        return NextResponse.json({ error: `Only ${variant.stock} available` }, { status: 400 })
      }
    } else if (product.stock < quantity) {
      return NextResponse.json({ error: `Only ${product.stock} available` }, { status: 400 })
    }

    const { cart, isGuest, sessionId } = await getOrCreateCart()

    // Upsert — already hai to quantity badhao
    const existing = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId ?? null,
      },
    })

    let item
    if (existing) {
      item = await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
    } else {
      item = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId: variantId ?? null,
          quantity,
        },
      })
    }

    const res = NextResponse.json({
      message: "Item added to cart successfully!",
      item,
    })

    if (isGuest && sessionId) {
      res.cookies.set("guest_session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      })
    }

    return res
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}