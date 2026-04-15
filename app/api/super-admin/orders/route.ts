// src/app/api/super-admin/orders/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? undefined
  const search = searchParams.get("search") ?? ""
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  try {
    const where = {
      AND: [
        status ? { status: status as any } : {},
        search
          ? {
              OR: [
                { orderNumber: { contains: search, mode: "insensitive" as const } },
                { user: { name: { contains: search, mode: "insensitive" as const } } },
                { user: { email: { contains: search, mode: "insensitive" as const } } },
              ],
            }
          : {},
      ],
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
          address: { select: { city: true, country: true } },
          items: { select: { id: true } },
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
  } catch (error) {
    console.error("Orders error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}