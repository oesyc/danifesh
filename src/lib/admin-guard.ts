// src/lib/admin-guard.ts
// Reusable admin check + activity logger

import { auth } from "@/src/lib/auth"
import { prisma } from "@//src/lib/prisma"
import { NextResponse } from "next/server"

export async function requireAdmin() {
  const session = await auth()
  if (!session) {
    return {
      error: NextResponse.json({ error: "Login karo pehle" }, { status: 401 }),
      session: null,
    }
  }
  const role = session.user.role
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return {
      error: NextResponse.json({ error: "Admin access required" }, { status: 403 }),
      session: null,
    }
  }
  return { error: null, session }
}

export async function logAction(
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: object
) {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        action,
        entityType,
        entityId,
        details: details ?? {},
      },
    })
  } catch (e) {
    console.error("AdminLog error:", e)
  }
}