// src/app/api/nav/categories/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,          // ← ADD: component ko chahiye tha
        _count: {                // ← ADD: line 70 crash yahan se tha
          select: { products: true },
        },
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          select: { id: true, name: true, slug: true },
        },
      },
    })
    return NextResponse.json({ categories })
  } catch {
    return NextResponse.json({ categories: [] })
  }
}