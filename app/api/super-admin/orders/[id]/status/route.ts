// src/app/api/super-admin/orders/[id]/status/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }   // ← Promise type
) {
  const session = await auth()

  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { id } = await params   // ← await karo

  try {
    const { status, trackingNumber, adminNote } = await req.json()

    const validStatuses = [
      "PENDING", "PAYMENT_PENDING", "CONFIRMED", "PROCESSING",
      "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
      "CANCELLED", "REFUND_REQUESTED", "REFUNDED", "FAILED",
    ]

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const order = await prisma.order.findUnique({ where: { id } })
    if (!order) {
      return NextResponse.json({ error: "Order Not Found" }, { status: 404 })
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(adminNote      && { adminNote }),
        ...(status === "SHIPPED"   && { shippedAt:   new Date() }),
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId:   id,
        status,
        note:      adminNote ?? `Status changed to ${status}`,
        createdBy: session.user.id,
      },
    })

    await prisma.adminLog.create({
      data: {
        adminId:    session.user.id,
        action:     "UPDATE_ORDER",
        entityType: "Order",
        entityId:   id,
        details: {
          previousStatus: order.status,
          newStatus:      status,
          orderNumber:    order.orderNumber,
        },
      },
    })

    return NextResponse.json({ message: "Order updated successfully!", order: updatedOrder })
  } catch (error) {
    console.error("Order update error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}