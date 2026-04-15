// src/app/api/super-admin/admin-logs/route.ts

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/src/lib/auth"
import { prisma } from "@/src/lib/prisma"

export async function GET(req: NextRequest) {
  const session = await auth()

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Access denied" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const entityType = searchParams.get("entityType") ?? undefined
  const adminId = searchParams.get("adminId") ?? undefined
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = 25

  try {
    const where = {
      ...(entityType && { entityType }),
      ...(adminId && { adminId }),
    }

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.adminLog.count({ where }),
    ])

    // Admin names bhi fetch karo
    const adminIds = [...new Set(logs.map((l) => l.adminId))]
    const admins = await prisma.user.findMany({
      where: { id: { in: adminIds } },
      select: { id: true, name: true, email: true },
    })

    const adminMap = Object.fromEntries(admins.map((a) => [a.id, a]))

    const logsWithAdmin = logs.map((log) => ({
      ...log,
      admin: adminMap[log.adminId] ?? { name: "Unknown", email: "" },
    }))

    return NextResponse.json({
      logs: logsWithAdmin,
      total,
      pages: Math.ceil(total / limit),
    })
  } catch (error) {
    console.error("Logs error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}