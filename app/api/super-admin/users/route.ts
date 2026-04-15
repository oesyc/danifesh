// src/app/api/super-admin/users/route.ts
// GET — sab users ki list
// SUPER_ADMIN hi access kar sakta hai

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""
  const role = searchParams.get("role") ?? undefined
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 20

  try {
    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { email: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        role ? { role: role as any } : {},
      ],
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          image: true,
          _count: {
            select: { orders: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      users,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    })
  } catch (error) {
    console.error("Users error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}