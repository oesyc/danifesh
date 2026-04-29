// src/app/api/register/route.ts
// NOTE: Ye tumhara existing register route hai — sirf OTP verify karne ka code add karo

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, otp } = await req.json()

    // ── Basic Validation ──────────────────────────────────
    if (!name || !email || !password || !otp) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 })
    }

    // ── OTP Verify karo ───────────────────────────────────
    const tokenRecord = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: `otp:${email}`, token: otp } }
    })

    if (!tokenRecord) {
      return NextResponse.json({ error: "Invalid OTP - Try again" }, { status: 400 })
    }

    if (tokenRecord.expires < new Date()) {
      // Expired token delete karo
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier: `otp:${email}`, token: otp } }
      })
      return NextResponse.json({ error: "OTP expired - ask for new otp" }, { status: 400 })
    }

    // ── Check: email already registered? ─────────────────
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    // ── Password Hash karo ────────────────────────────────
    const passwordHash = await bcrypt.hash(password, 12)

    // ── User banao ────────────────────────────────────────
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
    })

    // ── Used OTP delete karo ──────────────────────────────
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: `otp:${email}`, token: otp } }
    })

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email }
    })

  } catch (e) {
    console.error("[REGISTER]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}