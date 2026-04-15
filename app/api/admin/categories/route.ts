// src/app/api/admin/categories/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

// GET — categories list
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search") ?? ""

  try {
    const categories = await prisma.category.findMany({
      where: search
        ? { name: { contains: search, mode: "insensitive" } }
        : {},
      include: {
        parent:   { select: { id: true, name: true } },
        children: { select: { id: true, name: true } },
        _count:   { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ categories })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST — nai category banao
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const { name, slug, description, imageUrl, parentId, isActive, sortOrder } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Name and slug are required" }, { status: 400 })
    }

    // Slug duplicate check
    const exists = await prisma.category.findUnique({ where: { slug } })
    if (exists) {
      return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description ?? null,
        imageUrl:    imageUrl    ?? null,
        parentId:    parentId    ?? null,
        isActive:    isActive    ?? true,
        sortOrder:   sortOrder   ?? 0,
      },
    })

    await logAction(session!.user.id, "ADD_CATEGORY", "Category", category.id, {
      name: category.name,
    })

    return NextResponse.json({ message: "Category created!", category }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}