// src/app/api/user/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Login Please" }, { status: 401 })
    }

    const { id } = await params

    const order = await prisma.order.findFirst({
      where: { id, userId: session.user.id },
      include: {
        items: {
          select: {
            id: true, productName: true, quantity: true,
            unitPrice: true, totalPrice: true,
            productImage: true, variantInfo: true,
            product: { select: { slug: true } },
          },
        },
        address: true,
        statusHistory: {
          orderBy: { createdAt: "asc" },
          select: { status: true, note: true, createdAt: true },
        },
        shippingMethod: { select: { name: true, carrier: true, estimatedDays: true } },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}