// src/app/api/super-admin/users/[id]/role/route.ts
// PATCH — kisi bhi user ki role change karo
// Sirf SUPER_ADMIN kar sakta hai

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ← Promise type
) {
  const { id } = await params  // ← await karo
  const session = await auth()

  if (!session || (session.user as any).role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Only SUPER_ADMIN can update user roles" }, { status: 403 })
  }

  if (id === session.user.id) {  // ← params.id ki jagah id
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    )
  }

  try {
    const { role } = await req.json()

    const validRoles = ["USER", "ADMIN", "SUPER_ADMIN"]
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },  // ← id directly
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updatedUser = await prisma.user.update({
      where: { id },  // ← id directly
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    })

    await prisma.adminLog.create({
      data: {
        adminId: session.user.id!,
        action: role === "ADMIN" ? "ADD_ADMIN" : "CHANGE_ROLE",
        entityType: "User",
        entityId: id,
        details: {
          previousRole: user.role,
          newRole: role,
          targetUser: user.email,
        },
      },
    })

    return NextResponse.json({
      message: `${updatedUser.name} is now a ${role}!`,
      user: updatedUser,
    })
  } catch (error) {
    console.error("Role update error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}