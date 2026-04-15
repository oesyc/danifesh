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
          user:    { select: { id: true, name: true, email: true } },
          address: { select: { city: true, country: true } },
          items:   { select: { id: true, productName: true, quantity: true, unitPrice: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({ orders, total, pages: Math.ceil(total / limit) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}