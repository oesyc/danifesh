// src/app/api/admin/categories/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

type Params = { params: Promise<{ id: string }> }  // ← Promise add kiya

// PATCH — category update karo
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params  // ← await karo, phir use karo

  try {
    const existing = await prisma.category.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Not Found Category" }, { status: 404 })

    const body = await req.json()

    if (body.slug && body.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({ where: { slug: body.slug } })
      if (slugExists) return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(body.name        !== undefined && { name:        body.name }),
        ...(body.slug        !== undefined && { slug:        body.slug }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.imageUrl    !== undefined && { imageUrl:    body.imageUrl }),
        ...(body.parentId    !== undefined && { parentId:    body.parentId || null }),
        ...(body.isActive    !== undefined && { isActive:    body.isActive }),
        ...(body.sortOrder   !== undefined && { sortOrder:   parseInt(body.sortOrder) }),
      },
    })

    await logAction(session!.user.id, "UPDATE_CATEGORY", "Category", id, {
      name:    existing.name,
      changes: Object.keys(body),
    })

    return NextResponse.json({ message: "Category updated!", category: updated })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE — category delete karo
export async function DELETE(_: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params  // ← await karo, phir use karo

  try {
    const existing = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    })
    if (!existing) return NextResponse.json({ error: "Not Found Category" }, { status: 404 })

    if (existing._count.products > 0) {
      return NextResponse.json(
        { error: `This Category has ${existing._count.products} products — please remove them first` },
        { status: 400 }
      )
    }

    await prisma.category.delete({ where: { id } })

    await logAction(session!.user.id, "DELETE_CATEGORY", "Category", id, {
      name: existing.name,
    })

    return NextResponse.json({ message: "Category deleted!" })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}