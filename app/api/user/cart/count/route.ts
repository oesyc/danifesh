// src/app/api/user/cart/count/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { getOrCreateCart } from "@/src/lib/cart-helper"

export async function GET() {
  try {
    const { cart, isGuest, sessionId } = await getOrCreateCart()

    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      select: { quantity: true },
    })

    const count = items.reduce((sum, item) => sum + item.quantity, 0)

    const res = NextResponse.json({ count })

    if (isGuest && sessionId) {
      res.cookies.set("guest_session_id", sessionId, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 30,
        path: "/",
        sameSite: "lax",
      })
    }

    return res
  } catch {
    return NextResponse.json({ count: 0 })
  }
}