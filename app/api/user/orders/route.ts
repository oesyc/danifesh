// src/app/api/user/orders/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "please Login" }, { status: 401 })
    }

    const { searchParams } = req.nextUrl
    const page   = parseInt(searchParams.get("page") ?? "1")
    const status = searchParams.get("status") ?? ""
    const limit  = 8

    const where = {
      userId: session.user.id,
      ...(status ? { status: status as any } : {}),
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          items: {
            select: {
              id: true, productName: true, quantity: true,
              unitPrice: true, totalPrice: true,
              productImage: true, variantInfo: true,
            },
          },
          address: {
            select: {
              firstName: true, lastName: true,
              addressLine1: true, city: true, state: true, phone: true,
            },
          },
          statusHistory: {
            orderBy: { createdAt: "desc" },
            take: 3,
            select: { status: true, note: true, createdAt: true },
          },
          _count: { select: { items: true } },
        },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      orders,
      total,
      pages: Math.ceil(total / limit),
      page,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}