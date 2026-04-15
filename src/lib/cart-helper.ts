// src/lib/cart-helper.ts
// Logged in user = userId se cart
// Guest = sessionId cookie se cart

import { cookies } from "next/headers"
import { prisma } from "./prisma"
import { auth } from "./auth"
import { v4 as uuidv4 } from "uuid"

export async function getOrCreateCart() {
  const session = await auth()
  const cookieStore = await cookies()

  if (session?.user?.id) {
    // ── Logged in user ────────────────────────────────────
    const userId = session.user.id

    // Agar guest cart hai to merge karo
    const guestSessionId = cookieStore.get("guest_session_id")?.value
    if (guestSessionId) {
      const guestCart = await prisma.cart.findUnique({
        where: { sessionId: guestSessionId },
        include: { items: true },
      })
      if (guestCart) {
        // User cart dhundo ya banao
        let userCart = await prisma.cart.findUnique({ where: { userId } })
        if (!userCart) {
          userCart = await prisma.cart.create({ data: { userId } })
        }
        // Guest items ko user cart mein move karo
        for (const item of guestCart.items) {
          const existing = await prisma.cartItem.findUnique({
            where: {
              cartId_productId_variantId: {
                cartId: userCart.id,
                productId: item.productId,
                variantId: item.variantId ?? "",
              },
            },
          })
          if (existing) {
            await prisma.cartItem.update({
              where: { id: existing.id },
              data: { quantity: existing.quantity + item.quantity },
            })
          } else {
            await prisma.cartItem.create({
              data: {
                cartId: userCart.id,
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              },
            })
          }
        }
        // Guest cart delete karo
        await prisma.cart.delete({ where: { id: guestCart.id } })
      }
    }

    let cart = await prisma.cart.findUnique({ where: { userId } })
    if (!cart) cart = await prisma.cart.create({ data: { userId } })
    return { cart, isGuest: false, sessionId: null }

  } else {
    // ── Guest user ────────────────────────────────────────
    let sessionId = cookieStore.get("guest_session_id")?.value
    if (!sessionId) sessionId = uuidv4()

    let cart = await prisma.cart.findUnique({ where: { sessionId } })
    if (!cart) cart = await prisma.cart.create({ data: { sessionId } })

    return { cart, isGuest: true, sessionId }
  }
}