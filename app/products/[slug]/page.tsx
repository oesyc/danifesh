// app/products/[slug]/page.tsx
import { Metadata } from "next"
import { prisma } from "@/src/lib/prisma"
import ProductClient from "./ProductClient"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }  // ← Promise add karo
): Promise<Metadata> {
  const { slug } = await params  // ← await karo

  const product = await prisma.product.findUnique({
    where: { slug },  // ← ab slug sahi aayega
    include: { images: { where: { isPrimary: true }, take: 1 } },
  })

  if (!product) return { title: "Product Not Found" }

  const description = product.description
    ? product.description.replace(/<[^>]*>/g, "").slice(0, 160)
    : "Shop at Danifesh"
  const image = product.images[0]?.url ?? "/og-image.jpg"

  return {
    title: product.name,
    description,
    openGraph: {
      title: `${product.name} | Danifesh`,
      description,
      url: `https://www.danifesh.store/products/${product.slug}`,
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
    },
  }
}

export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }>  // ← yahan bhi
}) {
  const { slug } = await params  // ← await karo
  return <ProductClient slug={slug} />
}