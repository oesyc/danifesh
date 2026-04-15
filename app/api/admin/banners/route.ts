// src/app/api/admin/banners/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const banners = await prisma.banner.findMany({ orderBy: { sortOrder: "asc" } })
  return NextResponse.json({ banners })
}

export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { title, subtitle, imageUrl, link, position, isActive, sortOrder, startsAt, endsAt } = body

    if (!title || !imageUrl) {
      return NextResponse.json({ error: "title aur imageUrl zaroori hain" }, { status: 400 })
    }

    const banner = await prisma.banner.create({
      data: {
        title,
        subtitle:  subtitle  ?? null,
        imageUrl,
        link:      link      ?? null,
        position:  position  ?? "HOME_HERO",
        isActive:  isActive  ?? true,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
        startsAt:  startsAt  ? new Date(startsAt)  : null,
        endsAt:    endsAt    ? new Date(endsAt)     : null,
      },
    })

    await logAction(session!.user.id, "ADD_BANNER", "Banner", banner.id, { title })
    return NextResponse.json({ message: "Banner added!", banner }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}