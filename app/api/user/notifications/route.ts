// src/app/api/user/notifications/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ notifications: [] })

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({ notifications })
  } catch {
    return NextResponse.json({ notifications: [] })
  }
}

// PATCH — mark all as read
export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "please login" }, { status: 401 })

    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data:  { isRead: true },
    })

    return NextResponse.json({ message: "All notifications marked as read successfully!" })
  } catch {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 })
  }
}