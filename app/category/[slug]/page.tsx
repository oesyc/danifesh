// app/category/[slug]/page.tsx
import { Metadata } from "next"
import { prisma } from "@/src/lib/prisma"
import CategoryClient from "./CategoryClient"

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const category = await prisma.category.findUnique({
    where: { slug: slug },
  })

  if (!category) return { title: "Category Not Found" }

  return {
    title: category.name,
    description: `Shop ${category.name} products at Danifesh`,
    openGraph: {
      title: `${category.name} | Danifesh`,
      description: `Shop ${category.name} products at Danifesh`,
      url: `https://www.danifesh.store/category/${slug}`,
    },
  }
}

export default async function CategoryPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params
  return <CategoryClient slug={slug} />
}