// src/app/api/super-admin/revenue/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  try {
    // Last 6 months ka revenue
    const months = []

    for (let i = 5; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)

      const start = new Date(date.getFullYear(), date.getMonth(), 1)
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

      const revenue = await prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          paymentStatus: "PAID",
          createdAt: { gte: start, lte: end },
        },
      })

      const orderCount = await prisma.order.count({
        where: {
          createdAt: { gte: start, lte: end },
        },
      })

      months.push({
        month: start.toLocaleString("default", { month: "short" }),
        year: start.getFullYear(),
        revenue: revenue._sum.totalAmount ?? 0,
        orders: orderCount,
      })
    }

    // Revenue by category
    const categories = await prisma.category.findMany({
      select: {
        name: true,
        products: {
          select: {
            orderItems: {
              select: { totalPrice: true },
            },
          },
        },
      },
    })

    const categoryRevenue = categories.map((cat) => ({
      name: cat.name,
      revenue: cat.products.reduce(
        (sum, p) =>
          sum + p.orderItems.reduce((s, oi) => s + oi.totalPrice, 0),
        0
      ),
    }))

    return NextResponse.json({ months, categoryRevenue })
  } catch (error) {
    console.error("Revenue error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}