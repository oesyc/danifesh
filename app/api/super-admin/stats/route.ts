// src/app/api/super-admin/stats/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const session = await auth()

  // Sirf SUPER_ADMIN access kar sakta hai
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  try {
    // Sab kuch ek saath fetch karo (parallel queries)
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      pendingOrders,
      refundOrders,
      totalAdmins,
      revenueData,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),

      // Total orders
      prisma.order.count(),

      // Active products
      prisma.product.count({ where: { isActive: true } }),

      // Pending orders
      prisma.order.count({ where: { status: "PENDING" } }),

      // Refund requests
      prisma.order.count({ where: { status: "REFUND_REQUESTED" } }),

      // Total admins (ADMIN + SUPER_ADMIN)
      prisma.user.count({
        where: { role: { in: ["ADMIN", "SUPER_ADMIN"] } },
      }),

      // Total revenue (sirf paid orders)
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID" },
      }),
    ])

    // New users this month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const newUsersThisMonth = await prisma.user.count({
      where: { createdAt: { gte: startOfMonth } },
    })

    // Out of stock products
    const outOfStock = await prisma.product.count({
      where: { stock: 0, isActive: true },
    })

    const totalRevenue = revenueData._sum.totalAmount ?? 0

    return NextResponse.json({
      totalUsers,
      totalOrders,
      totalProducts,
      pendingOrders,
      refundOrders,
      totalAdmins,
      newUsersThisMonth,
      outOfStock,
      // Cents ko rupees mein convert karo (agar PKR use kar rahe)
      totalRevenue: totalRevenue,
    })
  } catch (error) {
    console.error("Stats error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}