// src/app/api/admin/reviews/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status") ?? "PENDING"
  const page   = parseInt(searchParams.get("page") ?? "1")
  const limit  = 15

  try {
    const where = status === "ALL" ? {} : { status: status as any }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          user:    { select: { name: true, email: true } },
          product: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.review.count({ where }),
    ])

    return NextResponse.json({ reviews, total, pages: Math.ceil(total / limit) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}