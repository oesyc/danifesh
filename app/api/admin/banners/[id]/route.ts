// src/app/api/admin/banners/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

type Params = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const existing = await prisma.banner.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Not Found Banner" }, { status: 404 })

    const body = await req.json()
    const updated = await prisma.banner.update({
      where: { id: params.id },
      data: {
        ...(body.title     !== undefined && { title:     body.title }),
        ...(body.subtitle  !== undefined && { subtitle:  body.subtitle }),
        ...(body.imageUrl  !== undefined && { imageUrl:  body.imageUrl }),
        ...(body.link      !== undefined && { link:      body.link }),
        ...(body.position  !== undefined && { position:  body.position }),
        ...(body.isActive  !== undefined && { isActive:  body.isActive }),
        ...(body.sortOrder !== undefined && { sortOrder: parseInt(body.sortOrder) }),
        ...(body.startsAt  !== undefined && { startsAt:  body.startsAt ? new Date(body.startsAt) : null }),
        ...(body.endsAt    !== undefined && { endsAt:    body.endsAt   ? new Date(body.endsAt)   : null }),
      },
    })

    await logAction(session!.user.id, "UPDATE_BANNER", "Banner", params.id, { title: existing.title })
    return NextResponse.json({ message: "Banner updated!", banner: updated })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const existing = await prisma.banner.findUnique({ where: { id: params.id } })
    if (!existing) return NextResponse.json({ error: "Banner nahi mila" }, { status: 404 })

    await prisma.banner.delete({ where: { id: params.id } })
    await logAction(session!.user.id, "DELETE_BANNER", "Banner", params.id, { title: existing.title })
    return NextResponse.json({ message: "Banner deleted!" })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}