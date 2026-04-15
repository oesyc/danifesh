// src/app/api/admin/reviews/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error
  const { id } = await params

  try {
    const { status } = await req.json()

    if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    const review = await prisma.review.findUnique({ where: { id: id } })
    if (!review) return NextResponse.json({ error: "Review nahi mili" }, { status: 404 })

    const updated = await prisma.review.update({
      where: { id: id },
      data:  { status },
    })

    await logAction(session!.user.id, `${status}_REVIEW`, "Review", id, {
      productId: review.productId,
      rating:    review.rating,
    })

    return NextResponse.json({ message: `Review ${status} !`, review: updated })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}