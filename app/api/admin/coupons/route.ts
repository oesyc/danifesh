// src/app/api/admin/coupons/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const coupons = await prisma.coupon.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json({ coupons })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const {
      code, description, discountType, discountValue,
      minimumOrder, maximumDiscount, usageLimit,
      isActive, startsAt, expiresAt,
    } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "code, discountType, discountValue required" }, { status: 400 })
    }

    const exists = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } })
    if (exists) return NextResponse.json({ error: "This coupon code already exists" }, { status: 400 })

    const coupon = await prisma.coupon.create({
      data: {
        code:            code.toUpperCase(),
        description:     description     ?? null,
        discountType,
        discountValue:   parseInt(discountValue),
        minimumOrder:    minimumOrder    ? parseInt(minimumOrder)    : null,
        maximumDiscount: maximumDiscount ? parseInt(maximumDiscount) : null,
        usageLimit:      usageLimit      ? parseInt(usageLimit)      : null,
        isActive:        isActive        ?? true,
        startsAt:        startsAt        ? new Date(startsAt)        : null,
        expiresAt:       expiresAt       ? new Date(expiresAt)       : null,
      },
    })

    await logAction(session!.user.id, "ADD_COUPON", "Coupon", coupon.id, {
      code:          coupon.code,
      discountType:  coupon.discountType,
      discountValue: coupon.discountValue,
    })

    return NextResponse.json({ message: "Coupon created!", coupon }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}