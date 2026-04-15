// app/api/admin/products/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

// GET — products list (same as before)
export async function GET(req: NextRequest) {
  const { error } = await requireAdmin()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const search     = searchParams.get("search") ?? ""
  const categoryId = searchParams.get("categoryId") ?? undefined
  const status     = searchParams.get("status") ?? ""
  const page       = parseInt(searchParams.get("page") ?? "1")
  const limit      = 15

  try {
    const where: any = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { sku:  { contains: search, mode: "insensitive" } },
          ],
        } : {},
        categoryId ? { categoryId } : {},
        status === "active"      ? { isActive: true,  stock: { gt: 0 } } : {},
        status === "inactive"    ? { isActive: false } : {},
        status === "outofstock"  ? { stock: 0, isActive: true } : {},
        status === "lowstock"    ? { stock: { gt: 0, lte: 5 }, isActive: true } : {},
      ],
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          images:   { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ])

    return NextResponse.json({ products, total, pages: Math.ceil(total / limit) })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// POST — naya product banao (images + variants + attributes + tags ke saath)
export async function POST(req: NextRequest) {
  const { error, session } = await requireAdmin()
  if (error) return error

  try {
    const body = await req.json()
    const {
      name, slug, description, shortDescription,
      basePrice, compareAtPrice, costPrice,
      sku, stock, categoryId,
      weight, metaTitle, metaDescription,
      isActive, isFeatured,
      // New fields
      images     = [],
      variants   = [],
      attributes = [],
      tags       = [],
    } = body

    if (!name || !slug || basePrice === undefined || !categoryId) {
      return NextResponse.json(
        { error: "name, slug, basePrice, categoryId required" },
        { status: 400 }
      )
    }

    const slugExists = await prisma.product.findUnique({ where: { slug } })
    if (slugExists) {
      return NextResponse.json({ error: "This slug already exists" }, { status: 400 })
    }

    if (sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku } })
      if (skuExists) {
        return NextResponse.json({ error: "This SKU already exists" }, { status: 400 })
      }
    }

    // Tags — find or create
    const tagRecords = await Promise.all(
      tags.filter(Boolean).map(async (tagName: string) => {
        const tagSlug = tagName.toLowerCase().replace(/\s+/g, "-")
        return prisma.tag.upsert({
          where:  { slug: tagSlug },
          update: {},
          create: { name: tagName, slug: tagSlug },
        })
      })
    )

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description:      description      ?? null,
        shortDescription: shortDescription ?? null,
        basePrice:        parseInt(basePrice),
        compareAtPrice:   compareAtPrice   ? parseInt(compareAtPrice) : null,
        costPrice:        costPrice        ? parseInt(costPrice)      : null,
        sku:              sku              ?? null,
        stock:            parseInt(stock   ?? 0),
        categoryId,
        weight:           weight           ? parseFloat(weight)       : null,
        metaTitle:        metaTitle        ?? null,
        metaDescription:  metaDescription  ?? null,
        isActive:         isActive         ?? true,
        isFeatured:       isFeatured       ?? false,
        publishedAt:      isActive         ? new Date()               : null,

        // Images
        images: images.length > 0 ? {
          create: images.map((img: any, i: number) => ({
            url:       img.url,
            altText:   img.altText  ?? null,
            isPrimary: img.isPrimary ?? i === 0,
            sortOrder: i,
          })),
        } : undefined,

        // Attributes
        attributes: attributes.length > 0 ? {
          create: attributes
            .filter((a: any) => a.name && a.value)
            .map((a: any) => ({ name: a.name, value: a.value })),
        } : undefined,

        // Tags
        tags: tagRecords.length > 0 ? {
          create: tagRecords.map(tag => ({ tagId: tag.id })),
        } : undefined,
      },
    })

    // Variants alag se create karo
    // Variants alag se create karo — VariantOption + VariantValue ke saath
if (variants.length > 0) {
  for (const v of variants) {
    // VariantValues collect karo (size + color)
    const variantValueIds: string[] = []

    if (v.size) {
      // Size option find or create
      const sizeOption = await prisma.variantOption.upsert({
        where: { name: "Size" },
        update: {},
        create: { name: "Size" },
      })
      // Size value find or create
      const sizeValue = await prisma.variantValue.upsert({
        where: { optionId_value: { optionId: sizeOption.id, value: v.size } },
        update: {},
        create: { optionId: sizeOption.id, value: v.size },
      })
      variantValueIds.push(sizeValue.id)
    }

    if (v.color) {
      // Color option find or create
      const colorOption = await prisma.variantOption.upsert({
        where: { name: "Color" },
        update: {},
        create: { name: "Color" },
      })
      // Color value find or create
      const colorValue = await prisma.variantValue.upsert({
        where: { optionId_value: { optionId: colorOption.id, value: v.color } },
        update: {},
        create: { optionId: colorOption.id, value: v.color },
      })
      variantValueIds.push(colorValue.id)
    }

    // ProductVariant banao with values connected
    await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku:       v.sku      ?? null,
        price:     v.price    ? parseInt(v.price)  : null,
        stock:     v.stock    ? parseInt(v.stock)  : 0,
        imageUrl:  v.imageUrl ?? null,
        isActive:  true,
        // VariantValues se connect karo
        values: variantValueIds.length > 0 ? {
          connect: variantValueIds.map(id => ({ id })),
        } : undefined,
      },
    })
  }
}
    await logAction(session!.user.id, "ADD_PRODUCT", "Product", product.id, {
      name:     product.name,
      price:    product.basePrice,
      images:   images.length,
      variants: variants.length,
    })

    return NextResponse.json({ message: "Product created!", product }, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}