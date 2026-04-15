import { PrismaClient } from "../../generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof makePrismaClient> | undefined
}

function makePrismaClient() {
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaPg({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
  })
  return new PrismaClient({ adapter })
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}