// src/app/api/user/dashboard/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "please login" }, { status: 401 })
    }
    const userId = session.user.id

    const [
      totalOrders,
      pendingOrders,
      deliveredOrders,
      wishlistCount,
      unreadNotifications,
      recentOrders,
      recentNotifications,
      totalSpent,
    ] = await Promise.all([
      // Total orders
      prisma.order.count({ where: { userId } }),

      // Pending / active orders
      prisma.order.count({
        where: { userId, status: { in: ["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY"] } },
      }),

      // Delivered
      prisma.order.count({ where: { userId, status: "DELIVERED" } }),

      // Wishlist items
      prisma.wishlistItem.count({
        where: { wishlist: { userId } },
      }),

      // Unread notifications
      prisma.notification.count({ where: { userId, isRead: false } }),

      // Recent 5 orders with items + address
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          items: {
            take: 3,
            select: {
              id: true, productName: true, quantity: true,
              unitPrice: true, totalPrice: true, productImage: true, variantInfo: true,
            },
          },
          address: {
            select: { city: true, state: true },
          },
          _count: { select: { items: true } },
        },
      }),

      // Recent 5 notifications
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      // Total amount spent (delivered orders only)
      prisma.order.aggregate({
        where: { userId, paymentStatus: "PAID" },
        _sum: { totalAmount: true },
      }),
    ])

    return NextResponse.json({
      stats: {
        totalOrders,
        pendingOrders,
        deliveredOrders,
        wishlistCount,
        unreadNotifications,
        totalSpent: totalSpent._sum.totalAmount ?? 0,
      },
      recentOrders,
      recentNotifications,
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}