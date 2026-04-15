// src/app/api/admin/stats/route.ts

import { NextResponse } from "next/server"
import { requireAdmin } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  try {
    const today = new Date()
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const [
      totalProducts,
      totalOrders,
      pendingOrders,
      totalCategories,
      outOfStock,
      lowStock,
      pendingReviews,
      revenueToday,
      revenueMonth,
      activeCoupons,
      totalBanners,
      recentOrders,
    ] = await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: 0, isActive: true } }),
      prisma.product.count({ where: { stock: { gt: 0, lte: 5 }, isActive: true } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID", createdAt: { gte: startOfToday } },
      }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      }),
      prisma.coupon.count({ where: { isActive: true } }),
      prisma.banner.count({ where: { isActive: true } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, email: true } },
        },
      }),
    ])

    return NextResponse.json({
      totalProducts,
      totalOrders,
      pendingOrders,
      totalCategories,
      outOfStock,
      lowStock,
      pendingReviews,
      revenueToday: revenueToday._sum.totalAmount ?? 0,
      revenueMonth: revenueMonth._sum.totalAmount ?? 0,
      activeCoupons,
      totalBanners,
      recentOrders,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}