// src/app/api/admin/coupons/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Coupon Not Found" }, { status: 404 })

    const body = await req.json()

    const updated = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(body.description     !== undefined && { description:     body.description }),
        ...(body.discountValue   !== undefined && { discountValue:   parseInt(body.discountValue) }),
        ...(body.minimumOrder    !== undefined && { minimumOrder:    body.minimumOrder ? parseInt(body.minimumOrder) : null }),
        ...(body.maximumDiscount !== undefined && { maximumDiscount: body.maximumDiscount ? parseInt(body.maximumDiscount) : null }),
        ...(body.usageLimit      !== undefined && { usageLimit:      body.usageLimit ? parseInt(body.usageLimit) : null }),
        ...(body.isActive        !== undefined && { isActive:        body.isActive }),
        ...(body.expiresAt       !== undefined && { expiresAt:       body.expiresAt ? new Date(body.expiresAt) : null }),
      },
    })

    await logAction(session!.user.id, "UPDATE_COUPON", "Coupon", params.id, {
      code: existing.code,
    })

    return NextResponse.json({ message: "Coupon updated!", coupon: updated })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const existing = await prisma.coupon.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Coupon Not Found" }, { status: 404 })

    await prisma.coupon.delete({ where: { id: params.id } })

    await logAction(session!.user.id, "DELETE_COUPON", "Coupon", params.id, {
      code: existing.code,
    })

    return NextResponse.json({ message: "Coupon deleted!" })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}