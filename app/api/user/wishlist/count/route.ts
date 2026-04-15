// src/app/api/user/wishlist/count/route.ts

import { NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ count: 0 })

    const wishlist = await prisma.wishlist.findUnique({
      where: { userId: session.user.id },
      select: { _count: { select: { items: true } } },
    })

    return NextResponse.json({ count: wishlist?._count.items ?? 0 })
  } catch {
    return NextResponse.json({ count: 0 })
  }
}