// src/app/api/checkout/route.ts
// COD checkout — order banao, stock ghatao, cart clear karo

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import { getOrCreateCart } from "@/src/lib/cart-helper"

// ─── Order number generator ───────────────────────────────
async function generateOrderNumber(): Promise<string> {
  const today = new Date()
  const prefix = `ORD-${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`
  const count = await prisma.order.count({
    where: { orderNumber: { startsWith: prefix } },
  })
  return `${prefix}-${String(count + 1).padStart(4, "0")}`
}

// ─── POST — checkout karo ─────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()

  // Checkout ke liye login zaroori hai
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Login required for CheckOut", requiresLogin: true },
      { status: 401 }
    )
  }

  const userId = session.user.id

  try {
    const body = await req.json()

    // ── Validate address fields ──────────────────────────
    const { firstName, lastName, phone, addressLine1, city, state, postalCode, country, saveAddress, customerNote } = body

    if (!firstName || !lastName || !phone || !addressLine1 || !city || !state || !postalCode || !country) {
      return NextResponse.json({ error: "Please fill all required fields" }, { status: 400 })
    }

    // ── Cart fetch karo ───────────────────────────────────
    const { cart } = await getOrCreateCart()

    const cartItems = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: {
        product: {
          select: {
            id: true, name: true, basePrice: true, stock: true,
            trackInventory: true, allowBackorder: true,
            images: { where: { isPrimary: true }, take: 1, select: { url: true } },
          },
        },
        variant: {
          select: {
            id: true, price: true, stock: true, sku: true, imageUrl: true,
            values: { include: { option: { select: { name: true } } } },
          },
        },
      },
    })

    if (cartItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 })
    }

    // ── Stock validate karo ───────────────────────────────
    for (const item of cartItems) {
      const availableStock = item.variant ? item.variant.stock : item.product.stock
      const trackInv = item.product.trackInventory
      const allowBack = item.product.allowBackorder

      if (trackInv && !allowBack && availableStock < item.quantity) {
        return NextResponse.json({
          error: `"${item.product.name}" has insufficient stock — only ${availableStock} available`,
        }, { status: 400 })
      }
    }

    // ── Totals calculate karo ─────────────────────────────
    let subtotal = 0
    for (const item of cartItems) {
      const unitPrice = item.variant?.price ?? item.product.basePrice
      subtotal += unitPrice * item.quantity
    }
    const shippingCost = subtotal >= 299900 ? 0 : 25000 // Free shipping above Rs 2999 (in cents)
    const totalAmount  = subtotal + shippingCost

    // ── Transaction — sab ek saath karo ───────────────────
    const order = await prisma.$transaction(async (tx) => {

      // 1. Address save karo (ya existing use karo)
      let addressId = body.addressId as string | undefined

      if (!addressId) {
        const address = await tx.address.create({
          data: {
            userId,
            label:        "Checkout Address",
            firstName,
            lastName,
            addressLine1,
            addressLine2: body.addressLine2 ?? null,
            city,
            state,
            postalCode,
            country,
            phone,
            isDefault:    saveAddress ? true : false,
          },
        })
        addressId = address.id
      }

      // 2. Order number banao
      const orderNumber = await generateOrderNumber()

      // 3. Order create karo
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          addressId,
          subtotal,
          shippingCost,
          taxAmount:     0,
          discountAmount: 0,
          totalAmount,
          status:        "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod: "COD",
          customerNote:  customerNote ?? null,
        },
      })

      // 4. Order items banao + stock ghatao
      for (const item of cartItems) {
        const unitPrice  = item.variant?.price ?? item.product.basePrice
        const totalPrice = unitPrice * item.quantity

        // Variant info string (e.g. "Red / XL")
        const variantInfo = item.variant
          ? item.variant.values.map((v) => v.value).join(" / ")
          : null

        // Product image
        const productImage = item.variant?.imageUrl ?? item.product.images[0]?.url ?? null

        // OrderItem create karo
        await tx.orderItem.create({
          data: {
            orderId:      newOrder.id,
            productId:    item.productId,
            variantId:    item.variantId ?? null,
            quantity:     item.quantity,
            unitPrice,
            totalPrice,
            productName:  item.product.name,
            productImage,
            variantInfo,
          },
        })

        // Stock ghatao
        if (item.product.trackInventory) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data:  { stock: { decrement: item.quantity } },
            })
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data:  { stock: { decrement: item.quantity } },
            })
          }
        }
      }

      // 5. Order status history mein entry daalo
      await tx.orderStatusHistory.create({
        data: {
          orderId:   newOrder.id,
          status:    "PENDING",
          note:      "Order place hua — Cash on Delivery",
          createdBy: userId,
        },
      })

      // 6. Notification banao
      await tx.notification.create({
        data: {
          userId,
          title:   `Order ${orderNumber} place ho gaya! 🎉`,
          message: `Tumhara order Rs ${(totalAmount / 100).toLocaleString("en-PK")} ka place ho gaya hai. Cash on Delivery.`,
          type:    "ORDER_UPDATE",
          link:    `/dashboard/orders/${newOrder.id}`,
        },
      })

      // 7. Cart clear karo
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } })

      return newOrder
    })

    return NextResponse.json({
      message: "Order place ho gaya!",
      orderId:     order.id,
      orderNumber: order.orderNumber,
    })

  } catch (e) {
    console.error("Checkout error:", e)
    return NextResponse.json({ error: "Failed to place order, Try again" }, { status: 500 })
  }
}