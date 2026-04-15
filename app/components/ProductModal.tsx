"use client"

import { useState, useRef } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────
type Category = { id: string; name: string }

type ProductImage = { url: string; altText: string; isPrimary: boolean }

type Variant = {
  sku: string; price: string; stock: string
  imageUrl: string; size: string; color: string
}

type Attribute = { name: string; value: string }

type ProductData = {
  id?: string
  name: string; slug: string; description: string; shortDescription: string
  categoryId: string; isActive: boolean; isFeatured: boolean
  basePrice: string; compareAtPrice: string; costPrice: string
  sku: string; stock: string; weight: string
  metaTitle: string; metaDescription: string
  images: ProductImage[]; variants: Variant[]
  attributes: Attribute[]; tags: string[]
}

type Props = {
  mode: "add" | "edit"
  data: ProductData
  categories: Category[]
  onSave: (data: ProductData) => Promise<void>
  onClose: () => void
  loading: boolean
}

const emptyVariant: Variant = { sku: "", price: "", stock: "", imageUrl: "", size: "", color: "" }
const emptyAttribute: Attribute = { name: "", value: "" }
const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
const lbl = "text-xs text-gray-500 font-medium block mb-1"
const toSlug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

export default function ProductModal({ mode, data, categories, onSave, onClose, loading }: Props) {
  const [form, setForm] = useState<ProductData>(data)
  const [activeTab, setActiveTab] = useState<"basic" | "images" | "variants" | "attributes" | "seo">("basic")
  const [uploading, setUploading] = useState(false)
  const [variantUploading, setVariantUploading] = useState<number | null>(null)
  const [tagInput, setTagInput] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const variantFileRefs = useRef<(HTMLInputElement | null)[]>([])

  const set = (field: keyof ProductData, value: any) =>
    setForm(f => ({ ...f, [field]: value }))

  // ─── Product Images Upload ────────────────────────────────
  async function uploadImages(files: FileList | File[]) {
    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach(f => formData.append("files", f))
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
    const data = await res.json()
    setUploading(false)
    if (res.ok) {
      const newImages: ProductImage[] = data.images.map((img: any, i: number) => ({
        url: img.url, altText: "", isPrimary: form.images.length === 0 && i === 0,
      }))
      set("images", [...form.images, ...newImages])
    }
  }

  // ─── Variant Image Upload ─────────────────────────────────
  async function uploadVariantImage(variantIndex: number, file: File) {
    setVariantUploading(variantIndex)
    const formData = new FormData()
    formData.append("files", file)
    const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
    const data = await res.json()
    setVariantUploading(null)
    if (res.ok && data.images?.[0]) {
      updateVariant(variantIndex, "imageUrl", data.images[0].url)
    }
  }

  function setPrimary(index: number) {
    set("images", form.images.map((img, i) => ({ ...img, isPrimary: i === index })))
  }

  function removeImage(index: number) {
    const updated = form.images.filter((_, i) => i !== index)
    if (form.images[index]?.isPrimary && updated.length > 0) updated[0].isPrimary = true
    set("images", updated)
  }

  function addVariant() {
    set("variants", [...form.variants, { ...emptyVariant }])
    variantFileRefs.current.push(null)
  }

  function updateVariant(index: number, field: keyof Variant, value: string) {
    set("variants", form.variants.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  function removeVariant(index: number) {
    set("variants", form.variants.filter((_, i) => i !== index))
    variantFileRefs.current = variantFileRefs.current.filter((_, i) => i !== index)
  }

  function addAttribute() { set("attributes", [...form.attributes, { ...emptyAttribute }]) }
  function updateAttribute(index: number, field: keyof Attribute, value: string) {
    set("attributes", form.attributes.map((a, i) => i === index ? { ...a, [field]: value } : a))
  }
  function removeAttribute(index: number) {
    set("attributes", form.attributes.filter((_, i) => i !== index))
  }

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !form.tags.includes(t)) set("tags", [...form.tags, t])
    setTagInput("")
  }
  function removeTag(tag: string) { set("tags", form.tags.filter(t => t !== tag)) }

  const tabs = [
    { key: "basic",      label: "Basic Info" },
    { key: "images",     label: `Images (${form.images.length})` },
    { key: "variants",   label: `Variants (${form.variants.length})` },
    { key: "attributes", label: `Attributes (${form.attributes.length})` },
    { key: "seo",        label: "SEO" },
  ] as const

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-auto py-6 px-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-base text-gray-800">
            {mode === "add" ? "Naya Product Add Karo" : "Product Edit Karo"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-light">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`text-xs font-medium py-3 px-4 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 max-h-[65vh] overflow-y-auto">

          {/* ── BASIC INFO ── */}
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className={lbl}>Product Name *</label>
                  <input value={form.name} onChange={e => {
                    const name = e.target.value
                    setForm(f => ({ ...f, name, slug: mode === "add" ? toSlug(name) : f.slug }))
                  }} className={inp} placeholder="e.g. Men's Blue Denim Jacket" />
                </div>
                <div>
                  <label className={lbl}>Slug *</label>
                  <input value={form.slug} onChange={e => set("slug", e.target.value)} className={inp} placeholder="mens-blue-denim-jacket" />
                </div>
                <div>
                  <label className={lbl}>SKU</label>
                  <input value={form.sku} onChange={e => set("sku", e.target.value)} className={inp} placeholder="DNF-001" />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Short Description</label>
                  <input value={form.shortDescription} onChange={e => set("shortDescription", e.target.value)} className={inp} placeholder="Ek line mein product describe karo..." />
                </div>
                <div className="col-span-2">
                  <label className={lbl}>Full Description</label>
                  <textarea rows={4} value={form.description} onChange={e => set("description", e.target.value)} className={`${inp} resize-none`} placeholder="Product ki detail description..." />
                </div>
                <div>
                  <label className={lbl}>Category *</label>
                  <select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className={sel}>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lbl}>Weight (kg)</label>
                  <input type="number" step="0.01" value={form.weight} onChange={e => set("weight", e.target.value)} className={inp} placeholder="0.5" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Pricing (Rupees mein)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={lbl}>Base Price * (Rs)</label>
                    <input type="number" value={form.basePrice} onChange={e => set("basePrice", e.target.value)} className={inp} placeholder="2999" />
                    <p className="text-[10px] text-gray-400 mt-0.5">{form.basePrice ? `Cents: ${parseInt(form.basePrice) * 100}` : ""}</p>
                  </div>
                  <div>
                    <label className={lbl}>Compare Price (Rs)</label>
                    <input type="number" value={form.compareAtPrice} onChange={e => set("compareAtPrice", e.target.value)} className={inp} placeholder="3999" />
                  </div>
                  <div>
                    <label className={lbl}>Cost Price (Rs)</label>
                    <input type="number" value={form.costPrice} onChange={e => set("costPrice", e.target.value)} className={inp} placeholder="1500" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">Inventory</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Stock Quantity *</label>
                    <input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} className={inp} placeholder="100" />
                  </div>
                  <div className="flex items-end gap-6 pb-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isActive} onChange={e => set("isActive", e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="font-medium text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.isFeatured} onChange={e => set("isFeatured", e.target.checked)} className="w-4 h-4 rounded" />
                      <span className="font-medium text-gray-700">Featured</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className={lbl}>Tags</label>
                <div className="flex gap-2">
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())}
                    className={inp} placeholder="Tag likho aur Enter dabao" />
                  <button onClick={addTag} type="button" className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition whitespace-nowrap">Add</button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full">
                        {tag}
                        <button onClick={() => removeTag(tag)} className="text-blue-400 hover:text-blue-700">✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── IMAGES ── */}
          {activeTab === "images" && (
            <div className="space-y-4">
              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); uploadImages(e.dataTransfer.files) }}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => e.target.files && uploadImages(e.target.files)} />
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-500">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">📸</div>
                    <p className="text-sm font-medium text-gray-700">Drop image or click here</p>
                    <p className="text-xs text-gray-400">JPG, PNG, WebP — You can select mulltiple</p>
                  </div>
                )}
              </div>

              {form.images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2 font-medium">
                    {form.images.length} image{form.images.length > 1 ? "s" : ""} — Select Primary
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {form.images.map((img, i) => (
                      <div key={i} className={`relative group rounded-xl overflow-hidden border-2 transition-colors ${img.isPrimary ? "border-blue-500" : "border-gray-100"}`}>
                        <img src={img.url} alt={img.altText || "Product"} className="w-full h-32 object-cover" />
                        {img.isPrimary && (
                          <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Primary</span>
                        )}
                        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!img.isPrimary && (
                            <button onClick={() => setPrimary(i)} className="w-6 h-6 bg-white rounded-full shadow text-xs flex items-center justify-center hover:bg-blue-50" title="Primary banao">⭐</button>
                          )}
                          <button onClick={() => removeImage(i)} className="w-6 h-6 bg-white rounded-full shadow text-xs flex items-center justify-center hover:bg-red-50 text-red-500">✕</button>
                        </div>
                        <input value={img.altText}
                          onChange={e => set("images", form.images.map((im, idx) => idx === i ? { ...im, altText: e.target.value } : im))}
                          placeholder="Alt text..." className="w-full px-2 py-1.5 text-xs border-t border-gray-100 outline-none bg-white" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── VARIANTS ── */}
          {activeTab === "variants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Product Variants</p>
                  <p className="text-xs text-gray-400 mt-0.5">add size and color for each varient</p>
                </div>
                <button onClick={addVariant} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 font-medium">+ Add Variant</button>
              </div>

              {form.variants.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-2xl mb-2">👕</p>
                  <p className="text-sm text-gray-500">No Variants added</p>
                  <p className="text-xs text-gray-400 mt-1">Skip Variants if product is single</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.variants.map((v, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-4 relative">
                      <button onClick={() => removeVariant(i)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 text-sm">✕</button>
                      <p className="text-xs font-medium text-gray-600 mb-3">Variant #{i + 1}</p>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className={lbl}>Size</label>
                          <select value={v.size} onChange={e => updateVariant(i, "size", e.target.value)} className={sel}>
                            <option value="">Select size</option>
                            {["XS", "S", "M", "L", "XL", "XXL", "XXXL", "Free Size"].map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className={lbl}>Color</label>
                          <input value={v.color} onChange={e => updateVariant(i, "color", e.target.value)} className={inp} placeholder="e.g. Red, Blue" />
                        </div>
                        <div>
                          <label className={lbl}>SKU</label>
                          <input value={v.sku} onChange={e => updateVariant(i, "sku", e.target.value)} className={inp} placeholder="DNF-001-M-RED" />
                        </div>
                        <div>
                          <label className={lbl}>Price (Rs) — khali = base price</label>
                          <input type="number" value={v.price} onChange={e => updateVariant(i, "price", e.target.value)} className={inp} placeholder="Optional" />
                        </div>
                        <div>
                          <label className={lbl}>Stock *</label>
                          <input type="number" value={v.stock} onChange={e => updateVariant(i, "stock", e.target.value)} className={inp} placeholder="50" />
                        </div>

                        {/* ── Variant Image Upload ── */}
                        <div>
                          <label className={lbl}>Variant Image</label>
                          {v.imageUrl ? (
                            <div className="relative">
                              <img src={v.imageUrl} alt="Variant" className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                              <button
                                onClick={() => updateVariant(i, "imageUrl", "")}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600"
                              >✕</button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => variantFileRefs.current[i]?.click()}
                                disabled={variantUploading === i}
                                className="w-full h-9 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-1"
                              >
                                {variantUploading === i ? (
                                  <div className="w-3 h-3 border border-blue-500 border-t-transparent rounded-full animate-spin" />
                                ) : "📁 Upload Image"}
                              </button>
                              <input
                                ref={el => { variantFileRefs.current[i] = el }}
                                type="file" accept="image/*" className="hidden"
                                onChange={e => e.target.files?.[0] && uploadVariantImage(i, e.target.files[0])}
                              />
                              <input
                                value={v.imageUrl}
                                onChange={e => updateVariant(i, "imageUrl", e.target.value)}
                                className={`${inp} mt-1`}
                                placeholder="Ya URL paste karo..."
                              />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ATTRIBUTES ── */}
          {activeTab === "attributes" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Product Attributes</p>
                  <p className="text-xs text-gray-400 mt-0.5">Like Material, Fit Etc</p>
                </div>
                <button onClick={addAttribute} className="text-xs bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 font-medium">+ Add Attribute</button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[["Material","Cotton"],["Material","Polyester"],["Fit","Slim Fit"],["Fit","Regular Fit"],["Occasion","Casual"],["Occasion","Formal"],["Fabric","Washable"],["Origin","Pakistan"]].map(([name, value]) => (
                  <button key={`${name}-${value}`} onClick={() => set("attributes", [...form.attributes, { name, value }])}
                    className="text-[10px] border border-gray-200 px-2 py-1 rounded-lg text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition">
                    + {name}: {value}
                  </button>
                ))}
              </div>
              {form.attributes.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl">
                  <p className="text-sm text-gray-400">Press + or use quick button</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {form.attributes.map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input value={a.name} onChange={e => updateAttribute(i, "name", e.target.value)} className={`${inp} flex-1`} placeholder="Attribute (e.g. Material)" />
                      <input value={a.value} onChange={e => updateAttribute(i, "value", e.target.value)} className={`${inp} flex-1`} placeholder="Value (e.g. Cotton)" />
                      <button onClick={() => removeAttribute(i)} className="text-gray-300 hover:text-red-500 text-sm px-1">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SEO ── */}
          {activeTab === "seo" && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400">SEO fields are optional</p>
              <div>
                <label className={lbl}>Meta Title</label>
                <input value={form.metaTitle} onChange={e => set("metaTitle", e.target.value)} className={inp} placeholder="Search engines ke liye title" maxLength={70} />
                <p className="text-[10px] text-gray-400 mt-0.5">{form.metaTitle.length}/70 characters</p>
              </div>
              <div>
                <label className={lbl}>Meta Description</label>
                <textarea rows={3} value={form.metaDescription} onChange={e => set("metaDescription", e.target.value)} className={`${inp} resize-none`} placeholder="Search results mein description" maxLength={160} />
                <p className="text-[10px] text-gray-400 mt-0.5">{form.metaDescription.length}/160 characters</p>
              </div>
              {(form.metaTitle || form.metaDescription) && (
                <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-2 font-medium">Google Preview</p>
                  <p className="text-blue-700 text-sm font-medium">{form.metaTitle || form.name || "Product Title"}</p>
                  <p className="text-xs text-green-700 mt-0.5">danifesh.com/products/{form.slug || "product-slug"}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{form.metaDescription || form.description || "Product description yahan show hogi..."}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span>📸 {form.images.length} images</span>
            <span>🎨 {form.variants.length} variants</span>
            <span>📋 {form.attributes.length} attributes</span>
            <span>🏷️ {form.tags.length} tags</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition">Cancel</button>
            <button onClick={() => onSave(form)} disabled={loading || uploading}
              className="text-sm bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition">
              {loading ? "Saving..." : mode === "add" ? "Product Add Karo" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}