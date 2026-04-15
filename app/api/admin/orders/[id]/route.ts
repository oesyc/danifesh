// src/app/api/admin/orders/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

type Params = { params: { id: string } }

// PATCH — order status update karo
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const existing = await prisma.order.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Order Not Found" }, { status: 404 })

    const { status, trackingNumber, adminNote } = await req.json()

    const validStatuses = [
      "PENDING", "PAYMENT_PENDING", "CONFIRMED", "PROCESSING",
      "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED",
      "CANCELLED", "REFUND_REQUESTED", "REFUNDED", "FAILED",
    ]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        ...(trackingNumber && { trackingNumber }),
        ...(adminNote      && { adminNote }),
        ...(status === "SHIPPED"   && { shippedAt:   new Date() }),
        ...(status === "DELIVERED" && { deliveredAt: new Date() }),
      },
    })

    // History mein daalo
    await prisma.orderStatusHistory.create({
      data: {
        orderId:   params.id,
        status:    status as any,
        note:      adminNote ?? `Status changed to ${status}`,
        createdBy: session!.user.id,
      },
    })

    await logAction(session!.user.id, "UPDATE_ORDER", "Order", params.id, {
      orderNumber:    existing.orderNumber,
      previousStatus: existing.status,
      newStatus:      status,
    })

    return NextResponse.json({ message: "Order updated!", order: updated })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}