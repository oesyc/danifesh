// src/lib/auth-edge.ts
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export async function auth(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })
  return token
}