// src/app/api/user/cart/[itemId]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { getOrCreateCart } from "@/src/lib/cart-helper"

// ─── PATCH — quantity update karo ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const { quantity } = await req.json()

    if (!quantity || quantity < 1) {
      return NextResponse.json({ error: "Quantity should be minimum 1" }, { status: 400 })
    }

    const { cart } = await getOrCreateCart()

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    })
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    })

    return NextResponse.json({ message: "Updated!", item: updated })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// ─── DELETE — item remove karo ────────────────────────────
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  try {
    const { itemId } = await params
    const { cart } = await getOrCreateCart()

    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId: cart.id },
    })
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    await prisma.cartItem.delete({ where: { id: itemId } })

    return NextResponse.json({ message: "Item removed successfully!" })
  } catch {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 })
  }
}