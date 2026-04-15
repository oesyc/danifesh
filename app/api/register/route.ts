// src/app/api/register/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = body

    // ── Validation ──────────────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Please fill all required fields" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password should be at least 6 characters long" },
        { status: 400 }
      )
    }

    // ── Email pehle se exist karta hai? ─────────────────────
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 400 }
      )
    }

    // ── Password hash karo ──────────────────────────────────
    // 12 = kitna strong hash — zyada = slow but secure
    const passwordHash = await bcrypt.hash(password, 12)

    // ── User banao database mein ────────────────────────────
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER", // hamesha USER se shuru
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // passwordHash nahi bhejte kabhi!
      },
    })

    return NextResponse.json(
      { message: "Account created successfully!", user },
      { status: 201 }
    )
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json(
      { error: "Server error occurred" },
      { status: 500 }
    )
  }
}