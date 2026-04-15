// src/app/api/user/addresses/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

// ─── GET — saved addresses fetch karo ────────────────────
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ addresses: [] })
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    })

    return NextResponse.json({ addresses })
  } catch {
    return NextResponse.json({ addresses: [] })
  }
}

// ─── POST — naya address save karo ───────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please login" }, { status: 401 })
    }

    const body = await req.json()
    const { firstName, lastName, phone, addressLine1, addressLine2, city, state, postalCode, country, label, isDefault } = body

    if (isDefault) {
      // Pehle sab default false karo
      await prisma.address.updateMany({
        where: { userId: session.user.id },
        data:  { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        userId: session.user.id,
        firstName, lastName, phone,
        addressLine1,
        addressLine2: addressLine2 || null,
        city, state, postalCode,
        country: country || "Pakistan",
        label:   label || null,
        isDefault: isDefault ?? false,
      },
    })

    return NextResponse.json({ message: "Address saved successfully!", address })
  } catch {
    return NextResponse.json({ error: "Server error occurred" }, { status: 500 })
  }
}