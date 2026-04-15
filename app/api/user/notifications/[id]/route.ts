// src/app/api/user/notifications/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

// PATCH — single notification read mark karo
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login" }, { status: 401 })
    }

    const { id } = await params

    // Sirf us user ki notification update ho
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data:  { isRead: true },
    })

    return NextResponse.json({ message: "Read mark updated successfully!" })
  } catch {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 })
  }
}