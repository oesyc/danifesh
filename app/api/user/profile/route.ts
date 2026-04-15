// src/app/api/user/profile/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"
import bcrypt from "bcryptjs"

// GET — profile fetch
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Please Login" }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, name: true, email: true, phone: true,
        image: true, createdAt: true,
        _count: { select: { orders: true, reviews: true } },
      },
    })

    return NextResponse.json({ user })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// PATCH — profile update
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Please Login" }, { status: 401 })

    const { name, phone, currentPassword, newPassword } = await req.json()

    const updateData: any = {}
    if (name?.trim())  updateData.name  = name.trim()
    if (phone?.trim()) updateData.phone = phone.trim()

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Please enter your current password" }, { status: 400 })
      }
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { passwordHash: true },
      })
      if (!user?.passwordHash) {
        return NextResponse.json({ error: "You dont have password based login" }, { status: 400 })
      }
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: "New password must be at least 8 characters long" }, { status: 400 })
      }
      updateData.passwordHash = await bcrypt.hash(newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data:  updateData,
      select: { id: true, name: true, email: true, phone: true },
    })

    return NextResponse.json({ message: "Profile updated successfully!", user: updated })
  } catch {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 })
  }
}