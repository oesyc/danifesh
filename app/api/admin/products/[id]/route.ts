// app/api/admin/products/[id]/route.ts

import { NextRequest, NextResponse } from "next/server"
import { requireAdmin, logAction } from "@/src/lib/admin-guard"
import { prisma } from "@/src/lib/prisma"

// Next.js 16 mein params Promise hai
type Params = { params: Promise<{ id: string }> }

// GET — single product (images + variants + attributes ke saath)
export async function GET(_: NextRequest, { params }: Params) {
  const { error } = await requireAdmin()
  if (error) return error

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { sortOrder: "asc" } },
      variants: {
        include: {
          values: {
            include: { option: true }
          }
        }
      },
      attributes: true,
      tags: { include: { tag: true } },
    },
  })

  if (!product) return NextResponse.json({ error: "Product Not Found" }, { status: 404 })
  return NextResponse.json(product)
}

// PATCH — product update karo (images + variants + attributes bhi)
export async function PATCH(req: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Product nahi mila" }, { status: 404 })

    const body = await req.json()
    const { images, attributes, variants, tags, ...basicData } = body

    // Slug duplicate check
    if (basicData.slug && basicData.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({ where: { slug: basicData.slug } })
      if (slugExists) return NextResponse.json({ error: "Slug already exists" }, { status: 400 })
    }

    // Basic fields update (same as before)
    const updated = await prisma.product.update({
      where: { id },
      data: {
        ...(basicData.name !== undefined && { name: basicData.name }),
        ...(basicData.slug !== undefined && { slug: basicData.slug }),
        ...(basicData.description !== undefined && { description: basicData.description }),
        ...(basicData.shortDescription !== undefined && { shortDescription: basicData.shortDescription }),
        ...(basicData.basePrice !== undefined && { basePrice: parseInt(basicData.basePrice) }),
        ...(basicData.compareAtPrice !== undefined && { compareAtPrice: basicData.compareAtPrice ? parseInt(basicData.compareAtPrice) : null }),
        ...(basicData.costPrice !== undefined && { costPrice: basicData.costPrice ? parseInt(basicData.costPrice) : null }),
        ...(basicData.sku !== undefined && { sku: basicData.sku }),
        ...(basicData.stock !== undefined && { stock: parseInt(basicData.stock) }),
        ...(basicData.categoryId !== undefined && { categoryId: basicData.categoryId }),
        ...(basicData.weight !== undefined && { weight: basicData.weight ? parseFloat(basicData.weight) : null }),
        ...(basicData.isActive !== undefined && { isActive: basicData.isActive }),
        ...(basicData.isFeatured !== undefined && { isFeatured: basicData.isFeatured }),
        ...(basicData.metaTitle !== undefined && { metaTitle: basicData.metaTitle }),
        ...(basicData.metaDescription !== undefined && { metaDescription: basicData.metaDescription }),
      },
    })

    // Images update — purani delete, nayi add
    if (images !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } })
      if (images.length > 0) {
        await prisma.productImage.createMany({
          data: images.map((img: any, i: number) => ({
            productId: id,
            url: img.url,
            altText: img.altText ?? null,
            isPrimary: img.isPrimary ?? i === 0,
            sortOrder: i,
          })),
        })
      }
    }

    // Attributes update — purane delete, naye add
    if (attributes !== undefined) {
      await prisma.productAttribute.deleteMany({ where: { productId: id } })
      if (attributes.length > 0) {
        await prisma.productAttribute.createMany({
          data: attributes
            .filter((a: any) => a.name && a.value)
            .map((a: any) => ({ productId: id, name: a.name, value: a.value })),
        })
      }
    }

    // Tags update
    if (tags !== undefined) {
      await prisma.productTag.deleteMany({ where: { productId: id } })
      const tagRecords = await Promise.all(
        tags.filter(Boolean).map(async (tagName: string) => {
          const tagSlug = tagName.toLowerCase().replace(/\s+/g, "-")
          return prisma.tag.upsert({
            where: { slug: tagSlug },
            update: {},
            create: { name: tagName, slug: tagSlug },
          })
        })
      )
      if (tagRecords.length > 0) {
        await prisma.productTag.createMany({
          data: tagRecords.map(tag => ({ productId: id, tagId: tag.id })),
        })
      }
    }

    // Variants update
    // Variants update
    if (variants !== undefined) {
      await prisma.productVariant.deleteMany({ where: { productId: id } })
      if (variants.length > 0) {
        for (const v of variants) {
          const variantValueIds: string[] = []

          if (v.size) {
            const sizeOption = await prisma.variantOption.upsert({
              where: { name: "Size" },
              update: {},
              create: { name: "Size" },
            })
            const sizeValue = await prisma.variantValue.upsert({
              where: { optionId_value: { optionId: sizeOption.id, value: v.size } },
              update: {},
              create: { optionId: sizeOption.id, value: v.size },
            })
            variantValueIds.push(sizeValue.id)
          }

          if (v.color) {
            const colorOption = await prisma.variantOption.upsert({
              where: { name: "Color" },
              update: {},
              create: { name: "Color" },
            })
            const colorValue = await prisma.variantValue.upsert({
              where: { optionId_value: { optionId: colorOption.id, value: v.color } },
              update: {},
              create: { optionId: colorOption.id, value: v.color },
            })
            variantValueIds.push(colorValue.id)
          }

          await prisma.productVariant.create({
            data: {
              productId: id,
              sku: v.sku ?? null,
              price: v.price ? parseInt(v.price) : null,
              stock: v.stock ? parseInt(v.stock) : 0,
              imageUrl: v.imageUrl ?? null,
              isActive: true,
              values: variantValueIds.length > 0 ? {
                connect: variantValueIds.map(vid => ({ id: vid })),
              } : undefined,
            },
          })
        }
      }
    }

    await logAction(session!.user.id, "UPDATE_PRODUCT", "Product", id, {
      name: existing.name,
      changes: Object.keys(body),
    })

    return NextResponse.json({ message: "Product updated!", product: updated })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

// DELETE — soft delete (same as before)
export async function DELETE(_: NextRequest, { params }: Params) {
  const { error, session } = await requireAdmin()
  if (error) return error

  const { id } = await params

  try {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: "Product Not Found" }, { status: 404 })

    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    })

    await logAction(session!.user.id, "DELETE_PRODUCT", "Product", id, {
      name: existing.name,
    })

    return NextResponse.json({ message: "Product deleted!" })
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}