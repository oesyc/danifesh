// src/app/api/admin/orders/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const status = searchParams.get("status") ?? ""
  const page   = parseInt(searchParams.get("page") ?? "1")
  const limit  = 15

  try {
    const where: any = {
      AND: [
        status ? { status } : {},
        search ? {
          OR: [
            { orderNumber: { contains: search, mode: "insensitive" } },
            { user: { name:  { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        } : {},
      ],
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {

          // ✅ User — customer ki details
          user: {
            select: {
              id:    true,
              name:  true,
              email: true,
              phone: true,   // ← ADD: customer ka phone number
            },
          },

          // ✅ Address — poora shipping address
          address: {
            select: {
              id:           true,
              firstName:    true,   // ← ADD
              lastName:     true,   // ← ADD
              addressLine1: true,   // ← ADD: ghar ka address
              addressLine2: true,   // ← ADD
              city:         true,
              state:        true,   // ← ADD
              postalCode:   true,   // ← ADD
              country:      true,
              phone:        true,   // ← ADD: address wala phone
            },
          },

          // ✅ Order Items — product + variant sab kuch
          items: {
            select: {
              id:           true,
              productName:  true,
              productImage: true,   // ← ADD: product ki photo
              quantity:     true,
              unitPrice:    true,
              totalPrice:   true,   // ← ADD: item ka total
              variantInfo:  true,   // ← ADD: "Red / XL" — customer ne kya select kiya

              // ← ADD: variant ki actual details (agar chahiye filtering ke liye)
              variant: {
                select: {
                  id:       true,
                  sku:      true,
                  price:    true,
                  imageUrl: true,   // variant ki specific photo (e.g. red wali)
                  values: {         // "Color: Red", "Size: XL"
                    select: {
                      value:  true,
                      option: { select: { name: true } },
                    },
                  },
                },
              },
            },
          },

          // ✅ Shipping Method — kaun sa courier, kitne din
         

          // ✅ Coupon — agar discount apply hua tha
          coupon: {
            select: {
              code:          true,
              discountType:  true,
              discountValue: true,
            },
          },

        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
    })

  } catch (e) {
    console.error("[ADMIN_ORDERS_GET]", e)   // ← ADD: server logs mein error dikh sake
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}