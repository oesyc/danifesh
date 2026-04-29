import SubCategoryClient from "./SubCategoryClient"

// app/category/[slug]/[childSlug]/page.tsx
export default async function SubCategoryPage({ 
  params 
}: { 
  params: Promise<{ childSlug: string }> 
}) {
  const { childSlug } = await params
  return <SubCategoryClient childSlug={childSlug} />
}