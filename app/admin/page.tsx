"use client"
// src/app/(admin)/admin/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import ProductModal from "../components/ProductModal"

// ─── Types ────────────────────────────────────────────────────────────────────
type Stats = {
  totalProducts: number; totalOrders: number; pendingOrders: number
  totalCategories: number; outOfStock: number; lowStock: number
  pendingReviews: number; revenueToday: number; revenueMonth: number
  activeCoupons: number; totalBanners: number
  recentOrders: Order[]
}
type Category = {
  id: string; name: string; slug: string; isActive: boolean
  sortOrder: number; image?: string, _count: { products: number }
  parent: { id: string; name: string } | null
}
type Product = {
  id: string; name: string; slug: string; sku: string | null
  basePrice: number; stock: number; isActive: boolean; isFeatured: boolean
  createdAt: string; category: { id: string; name: string }
  images: { url: string }[]
}
type Order = {
  id: string; orderNumber: string; status: string; paymentStatus: string
  totalAmount: number; createdAt: string
  user: { name: string | null; email: string }
  items: { productName: string; quantity: number; unitPrice: number }[]
}
type Review = {
  id: string; rating: number; title: string | null; body: string | null
  status: string; createdAt: string
  user: { name: string | null; email: string }
  product: { name: string; slug: string }
}
type Coupon = {
  id: string; code: string; discountType: string; discountValue: number
  isActive: boolean; usageCount: number; usageLimit: number | null
  expiresAt: string | null | undefined; _count: { orders: number }
}
type Banner = {
  id: string; title: string; subtitle: string | null; imageUrl: string
  position: string; isActive: boolean; sortOrder: number; link: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (c: number) => "Rs " + (c / 100).toLocaleString()
const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

function Badge({ label, color }: { label: string; color: string }) {
  const map: Record<string, string> = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    yellow: "bg-yellow-100 text-yellow-800",
    gray: "bg-gray-100 text-gray-700",
    purple: "bg-purple-100 text-purple-700",
    orange: "bg-orange-100 text-orange-700",
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[color] ?? map.gray}`}>{label}</span>
}

function statusColor(s: string): string {
  if (["DELIVERED", "CONFIRMED", "APPROVED"].includes(s)) return "green"
  if (["CANCELLED", "REFUNDED", "REJECTED", "FAILED"].includes(s)) return "red"
  if (["SHIPPED", "OUT_FOR_DELIVERY"].includes(s)) return "blue"
  if (["PROCESSING", "PENDING"].includes(s)) return "yellow"
  return "gray"
}

// ─── emptyProd (outside component — stable reference) ────────────────────────
const emptyProd = {
  name: "", slug: "", description: "", shortDescription: "",
  categoryId: "", isActive: true, isFeatured: false,
  basePrice: "", compareAtPrice: "", costPrice: "",
  sku: "", stock: "", weight: "", metaTitle: "", metaDescription: "",
  images: [] as any[], variants: [] as any[], attributes: [] as any[], tags: [] as string[],
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminPanel() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState("overview")
  const [stats, setStats] = useState<Stats | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [catImageUrl, setCatImageUrl] = useState("")
  // Data states
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)

  // Search / filter
  const [productSearch, setProductSearch] = useState("")
  const [productStatus, setProductStatus] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatus, setOrderStatus] = useState("")
  const [reviewStatus, setReviewStatus] = useState("PENDING")

  // ── Product modal ─────────────────────────────────────────
  type ProdModal = {
    open: boolean
    mode: "add" | "edit"
    data: typeof emptyProd & { id?: string }
  }
  const [prodModal, setProdModal] = useState<ProdModal>({ open: false, mode: "add", data: emptyProd })
  const [prodLoading, setProdLoading] = useState(false)

  // ── Category modal ────────────────────────────────────────
  type CatModal = { open: boolean; mode: "add" | "edit"; data: Partial<Category> & { description?: string; parentId?: string } }
  const emptyCat = { name: "", slug: "", description: "", parentId: "", isActive: true, sortOrder: 0, image: "", }
  const [catModal, setCatModal] = useState<CatModal>({ open: false, mode: "add", data: emptyCat })
  const [catLoading, setCatLoading] = useState(false)

  // ── Order modal ───────────────────────────────────────────
  const [orderModal, setOrderModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null })
  const [orderNewSt, setOrderNewSt] = useState("")
  const [orderTrack, setOrderTrack] = useState("")
  const [orderNote, setOrderNote] = useState("")
  const [orderLoading, setOrderLoading] = useState(false)

  // ── Coupon modal ──────────────────────────────────────────
  type CouponModal = { open: boolean; mode: "add" | "edit"; data: Partial<Coupon> & { description?: string; minimumOrder?: number; expiresAt?: string } }
  const emptyCoupon = { code: "", discountType: "PERCENTAGE", discountValue: 0, minimumOrder: 0, isActive: true, expiresAt: "" }
  const [couponModal, setCouponModal] = useState<CouponModal>({ open: false, mode: "add", data: emptyCoupon })
  const [couponLoading, setCouponLoading] = useState(false)

  // ── Banner modal ──────────────────────────────────────────
  type BannerModal = { open: boolean; mode: "add" | "edit"; data: Partial<Banner> }
  const emptyBanner = { title: "", subtitle: "", imageUrl: "", link: "", position: "HOME_HERO", isActive: true, sortOrder: 0 }
  const [bannerModal, setBannerModal] = useState<BannerModal>({ open: false, mode: "add", data: emptyBanner })
  const [bannerLoading, setBannerLoading] = useState(false)

  // ─── Auth check ───────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/login"); return }
    if ((session.user as any).role !== "ADMIN" && (session.user as any).role !== "SUPER_ADMIN") {
      router.push("/dashboard"); return
    }
  }, [session, status])

  // ─── Toast ────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ─── Fetch helpers ────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats")
    setStats(await r.json())
  }, [])

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ search: productSearch, status: productStatus, page: String(page) })
    const r = await fetch(`/api/admin/products?${p}`)
    const d = await r.json()
    setProducts(d.products ?? []); setTotalPages(d.pages ?? 1)
    setLoading(false)
  }, [productSearch, productStatus, page])

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/admin/categories")
    const d = await r.json()
    setCategories(d.categories ?? [])
    setLoading(false)
  }, [])

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const p = new URLSearchParams({ search: orderSearch, status: orderStatus, page: String(page) })
    const r = await fetch(`/api/admin/orders?${p}`)
    const d = await r.json()
    setOrders(d.orders ?? []); setTotalPages(d.pages ?? 1)
    setLoading(false)
  }, [orderSearch, orderStatus, page])

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    const r = await fetch(`/api/admin/reviews?status=${reviewStatus}&page=${page}`)
    const d = await r.json()
    setReviews(d.reviews ?? []); setTotalPages(d.pages ?? 1)
    setLoading(false)
  }, [reviewStatus, page])

  const fetchCoupons = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/admin/coupons")
    const d = await r.json()
    setCoupons(d.coupons ?? [])
    setLoading(false)
  }, [])

  const fetchBanners = useCallback(async () => {
    setLoading(true)
    const r = await fetch("/api/admin/banners")
    const d = await r.json()
    setBanners(d.banners ?? [])
    setLoading(false)
  }, [])

  // Initial load
  useEffect(() => { fetchStats() }, [])

  // Tab change
  useEffect(() => {
    setPage(1)
    if (tab === "products") fetchProducts()
    if (tab === "categories") fetchCategories()
    if (tab === "orders") fetchOrders()
    if (tab === "reviews") fetchReviews()
    if (tab === "coupons") fetchCoupons()
    if (tab === "banners") fetchBanners()
  }, [tab])

  // Search debounce
  useEffect(() => {
    const t = setTimeout(() => { if (tab === "products") fetchProducts() }, 400)
    return () => clearTimeout(t)
  }, [productSearch, productStatus])

  useEffect(() => {
    const t = setTimeout(() => { if (tab === "orders") fetchOrders() }, 400)
    return () => clearTimeout(t)
  }, [orderSearch, orderStatus])

  useEffect(() => {
    if (tab === "reviews") fetchReviews()
  }, [reviewStatus])

  useEffect(() => {
    if (tab === "products") fetchProducts()
    if (tab === "orders") fetchOrders()
    if (tab === "reviews") fetchReviews()
  }, [page])

  // ─── Product CRUD ─────────────────────────────────────────
  async function saveProduct(formData: any) {
    setProdLoading(true)
    const url = prodModal.mode === "add" ? "/api/admin/products" : `/api/admin/products/${formData.id}`
    const method = prodModal.mode === "add" ? "POST" : "PATCH"

    const body = {
      ...formData,
      basePrice: formData.basePrice ? parseInt(formData.basePrice) * 100 : 0,
      compareAtPrice: formData.compareAtPrice ? parseInt(formData.compareAtPrice) * 100 : null,
      costPrice: formData.costPrice ? parseInt(formData.costPrice) * 100 : null,
      variants: formData.variants.map((v: any) => ({
        ...v,
        price: v.price ? parseInt(v.price) * 100 : null,
        stock: parseInt(v.stock) || 0,
      })),
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    setProdLoading(false)

    if (res.ok) {
      setProdModal({ open: false, mode: "add", data: emptyProd })
      showToast(prodModal.mode === "add" ? "Product Added!" : "Product updated!")
      fetchProducts(); fetchStats()
    } else {
      const e = await res.json()
      showToast(e.error, "error")
    }
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`"${name}" delete karna chahte ho?`)) return
    const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" })
    if (res.ok) { showToast("Product deleted!"); fetchProducts(); fetchStats() }
    else { const e = await res.json(); showToast(e.error, "error") }
  }

  function openEditProduct(p: Product) {
    fetch(`/api/admin/products/${p.id}`)
      .then(r => r.json())
      .then(full => {
        setProdModal({
          open: true,
          mode: "edit",
          data: {
            ...emptyProd,
            id: full.id,
            name: full.name ?? "",
            slug: full.slug ?? "",
            description: full.description ?? "",
            shortDescription: full.shortDescription ?? "",
            categoryId: full.categoryId ?? "",
            isActive: full.isActive ?? true,
            isFeatured: full.isFeatured ?? false,
            basePrice: full.basePrice ? String(full.basePrice / 100) : "",
            compareAtPrice: full.compareAtPrice ? String(full.compareAtPrice / 100) : "",
            costPrice: full.costPrice ? String(full.costPrice / 100) : "",
            sku: full.sku ?? "",
            stock: String(full.stock ?? 0),
            weight: full.weight ? String(full.weight) : "",
            metaTitle: full.metaTitle ?? "",
            metaDescription: full.metaDescription ?? "",
            images: (full.images ?? []).map((img: any) => ({
              url: img.url, altText: img.altText ?? "", isPrimary: img.isPrimary,
            })),
            variants: (full.variants ?? []).map((v: any) => {
              // values array mein se Size aur Color dhundo
              const sizeVal = v.values?.find((vv: any) => vv.option?.name === "Size")?.value ?? ""
              const colorVal = v.values?.find((vv: any) => vv.option?.name === "Color")?.value ?? ""
              return {
                sku: v.sku ?? "",
                price: v.price ? String(v.price / 100) : "",
                stock: String(v.stock ?? 0),
                imageUrl: v.imageUrl ?? "",
                size: sizeVal,   // ← ab populate hoga
                color: colorVal,  // ← ab populate hoga
              }
            }),
            attributes: (full.attributes ?? []).map((a: any) => ({ name: a.name, value: a.value })),
            tags: (full.tags ?? []).map((t: any) => t.tag?.name ?? ""),
          },
        })
      })
  }

  // ─── Category CRUD ────────────────────────────────────────
  async function saveCategory() {
    setCatLoading(true)
    const d = catModal.data
    const url = catModal.mode === "add" ? "/api/admin/categories" : `/api/admin/categories/${d.id}`
    const method = catModal.mode === "add" ? "POST" : "PATCH"
    console.log("Saving:", { imageUrl: d.image || null })
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...d,
        parentId: d.parentId || null,
        imageUrl: catImageUrl || d.image || null, // ✅ ADD
      }),
    })
    setCatLoading(false)
    if (res.ok) {
      setCatModal({ open: false, mode: "add", data: emptyCat })
      showToast(catModal.mode === "add" ? "Category Added!" : "Category updated!")
      fetchCategories(); fetchStats()
    } else {
      const e = await res.json(); showToast(e.error, "error")
    }
  }

  async function deleteCategory(id: string, name: string) {
    if (!confirm(`"${name}" delete karna chahte ho?`)) return
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
    if (res.ok) { showToast("Category deleted!"); fetchCategories(); fetchStats() }
    else { const e = await res.json(); showToast(e.error, "error") }
  }

  // ─── Order Update ─────────────────────────────────────────
  function openOrderModal(o: Order) {
    setOrderModal({ open: true, order: o })
    setOrderNewSt(o.status); setOrderTrack(""); setOrderNote("")
  }

  async function saveOrder() {
    if (!orderModal.order) return
    setOrderLoading(true)
    const res = await fetch(`/api/admin/orders/${orderModal.order.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: orderNewSt, trackingNumber: orderTrack, adminNote: orderNote }),
    })
    setOrderLoading(false)
    if (res.ok) {
      setOrderModal({ open: false, order: null })
      showToast("Order updated!")
      fetchOrders(); fetchStats()
    } else {
      const e = await res.json(); showToast(e.error, "error")
    }
  }

  // ─── Review actions ───────────────────────────────────────
  async function updateReview(id: string, status: string) {
    const res = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    if (res.ok) { showToast(`Review ${status}!`); fetchReviews(); fetchStats() }
    else { const e = await res.json(); showToast(e.error, "error") }
  }

  // ─── Coupon CRUD ──────────────────────────────────────────
  async function saveCoupon() {
    setCouponLoading(true)
    const d = couponModal.data
    const url = couponModal.mode === "add" ? "/api/admin/coupons" : `/api/admin/coupons/${d.id}`
    const method = couponModal.mode === "add" ? "POST" : "PATCH"
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    })
    setCouponLoading(false)
    if (res.ok) {
      setCouponModal({ open: false, mode: "add", data: emptyCoupon })
      showToast(couponModal.mode === "add" ? "Coupon Added!" : "Coupon updated!")
      fetchCoupons()
    } else {
      const e = await res.json(); showToast(e.error, "error")
    }
  }

  async function deleteCoupon(id: string, code: string) {
    if (!confirm(`"${code}" delete karna chahte ho?`)) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" })
    if (res.ok) { showToast("Coupon deleted!"); fetchCoupons() }
    else { const e = await res.json(); showToast(e.error, "error") }
  }

  // ─── Banner CRUD ──────────────────────────────────────────
  async function saveBanner() {
    setBannerLoading(true)
    const d = bannerModal.data
    const url = bannerModal.mode === "add" ? "/api/admin/banners" : `/api/admin/banners/${d.id}`
    const method = bannerModal.mode === "add" ? "POST" : "PATCH"
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(d),
    })
    setBannerLoading(false)
    if (res.ok) {
      setBannerModal({ open: false, mode: "add", data: emptyBanner })
      showToast(bannerModal.mode === "add" ? "Banner Added!" : "Banner updated!")
      fetchBanners(); fetchStats()
    } else {
      const e = await res.json(); showToast(e.error, "error")
    }
  }

  async function deleteBanner(id: string, title: string) {
    if (!confirm(`"${title}" delete karna chahte ho?`)) return
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" })
    if (res.ok) { showToast("Banner deleted!"); fetchBanners(); fetchStats() }
    else { const e = await res.json(); showToast(e.error, "error") }
  }

  // ─── Guard ────────────────────────────────────────────────
  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm">Loading...</p></div>
  }

  const navItems = [
    { key: "overview", label: "Overview", badge: null },
    { key: "products", label: "Products", badge: stats?.outOfStock ? stats.outOfStock : null },
    { key: "categories", label: "Categories", badge: null },
    { key: "orders", label: "Orders", badge: stats?.pendingOrders ?? null },
    { key: "reviews", label: "Reviews", badge: stats?.pendingReviews ?? null },
    { key: "coupons", label: "Coupons", badge: null },
    { key: "banners", label: "Banners", badge: null },
  ]

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"
  const sel = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-blue-400"

  const Th = ({ children }: { children: React.ReactNode }) => (
    <th className="text-left px-4 py-3 text-xs text-gray-500 font-medium border-b border-gray-100 bg-gray-50">{children}</th>
  )
  const Td = ({ children, cls }: { children: React.ReactNode; cls?: string }) => (
    <td className={`px-4 py-3 text-sm border-b border-gray-50 ${cls ?? ""}`}>{children}</td>
  )
  const ActionBtn = ({ onClick, children, danger }: { onClick: () => void; children: React.ReactNode; danger?: boolean }) => (
    <button onClick={onClick}
      className={`text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${danger ? "border-red-200 text-red-600 hover:bg-red-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
      {children}
    </button>
  )

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col min-h-screen flex-shrink-0">
        <div className="p-4 border-b border-gray-100">
          <p className="font-medium text-sm">Admin Panel</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{session.user.email}</p>
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded mt-1 inline-block">{(session.user as any).role}</span>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${tab === item.key ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"}`}>
              <span>{item.label}</span>
              {item.badge ? (
                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">{item.badge}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-red-500 hover:text-red-700">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto min-w-0">

        {/* ════════════ OVERVIEW ════════════ */}
        {tab === "overview" && (
          <div>
            <h1 className="text-xl font-medium mb-5">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {[
                { label: "Revenue today", value: stats ? fmt(stats.revenueToday) : "—", color: "text-green-600" },
                { label: "Revenue month", value: stats ? fmt(stats.revenueMonth) : "—", color: "text-green-600" },
                { label: "Total orders", value: stats?.totalOrders?.toLocaleString() ?? "—", color: "" },
                { label: "Total products", value: stats?.totalProducts?.toLocaleString() ?? "—", color: "" },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-medium ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Pending orders", value: stats?.pendingOrders ?? "—", warn: true },
                { label: "Out of stock", value: stats?.outOfStock ?? "—", warn: true },
                { label: "Low stock", value: stats?.lowStock ?? "—", warn: true },
                { label: "Pending reviews", value: stats?.pendingReviews ?? "—", warn: true },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-medium ${s.warn && Number(s.value) > 0 ? "text-red-600" : ""}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="font-medium text-sm">Recent orders</p>
                <button onClick={() => setTab("orders")} className="text-xs text-blue-600 hover:underline">View all</button>
              </div>
              <table className="w-full text-sm">
                <thead><tr><Th>Order #</Th><Th>Customer</Th><Th>Amount</Th><Th>Status</Th><Th>Date</Th></tr></thead>
                <tbody>
                  {stats?.recentOrders?.map(o => (
                    <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                      <Td cls="font-mono text-xs">{o.orderNumber}</Td>
                      <Td>{o.user.name ?? o.user.email}</Td>
                      <Td>{fmt(o.totalAmount)}</Td>
                      <Td><Badge label={o.status.replace(/_/g, " ")} color={statusColor(o.status)} /></Td>
                      <Td cls="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ PRODUCTS ════════════ */}
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium">Products</h1>
              <button onClick={() => setProdModal({ open: true, mode: "add", data: emptyProd })}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                + Add product
              </button>
            </div>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input type="text" placeholder="Search name or SKU..." value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px] bg-white" />
              <select value={productStatus} onChange={e => setProductStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All products</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="outofstock">Out of stock</option>
                <option value="lowstock">Low stock</option>
              </select>
              <select onChange={e => { setProductSearch(""); setProductStatus("") }}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Product</Th><Th>Category</Th><Th>Price</Th><Th>Stock</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : products.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Koi product nahi mila</td></tr>
                      : products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <Td>
                            <div className="font-medium">{p.name}</div>
                            {p.sku && <div className="text-xs text-gray-400 font-mono">{p.sku}</div>}
                            {p.isFeatured && <Badge label="Featured" color="purple" />}
                          </Td>
                          <Td cls="text-gray-500">{p.category.name}</Td>
                          <Td>{fmt(p.basePrice)}</Td>
                          <Td>
                            <span className={`font-medium ${p.stock === 0 ? "text-red-600" : p.stock <= 5 ? "text-orange-600" : "text-gray-800"}`}>
                              {p.stock}
                            </span>
                          </Td>
                          <Td><Badge label={p.isActive ? "Active" : "Inactive"} color={p.isActive ? "green" : "gray"} /></Td>
                          <Td>
                            <div className="flex gap-1.5">
                              <ActionBtn onClick={() => openEditProduct(p)}>Edit</ActionBtn>
                              <ActionBtn onClick={() => deleteProduct(p.id, p.name)} danger>Delete</ActionBtn>
                            </div>
                          </Td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ CATEGORIES ════════════ */}
        {tab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium">Categories</h1>
              <button onClick={() => setCatModal({ open: true, mode: "add", data: emptyCat })}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                + Add category
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Name</Th><Th>Slug</Th><Th>Parent</Th><Th>Products</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : categories.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Koi category nahi</td></tr>
                      : categories.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <Td cls="font-medium">{c.name}</Td>
                          <Td cls="font-mono text-xs text-gray-400">{c.slug}</Td>
                          <Td cls="text-gray-500">{c.parent?.name ?? "—"}</Td>
                          <Td>{c._count.products}</Td>
                          <Td><Badge label={c.isActive ? "Active" : "Inactive"} color={c.isActive ? "green" : "gray"} /></Td>
                          <Td>
                            <div className="flex gap-1.5">
                              <ActionBtn onClick={() =>  setCatModal({ open: true, mode: "edit", data: { ...c, parentId: c.parent?.id ?? "" } })}>Edit</ActionBtn>
                              <ActionBtn onClick={() => deleteCategory(c.id, c.name)} danger>Delete</ActionBtn>
                            </div>
                          </Td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ ORDERS ════════════ */}
        {tab === "orders" && (
          <div>
            <h1 className="text-xl font-medium mb-4">Orders</h1>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input type="text" placeholder="Search order # ya customer..." value={orderSearch}
                onChange={e => setOrderSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] bg-white" />
              <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All statuses</option>
                {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUND_REQUESTED", "REFUNDED"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Order #</Th><Th>Customer</Th><Th>Items</Th><Th>Amount</Th><Th>Payment</Th><Th>Status</Th><Th>Date</Th><Th>Action</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : orders.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">Koi order nahi</td></tr>
                      : orders.map(o => (
                        <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                          <Td cls="font-mono text-xs">{o.orderNumber}</Td>
                          <Td>{o.user.name ?? o.user.email}</Td>
                          <Td>{o.items.length}</Td>
                          <Td cls="font-medium">{fmt(o.totalAmount)}</Td>
                          <Td><Badge label={o.paymentStatus} color={o.paymentStatus === "PAID" ? "green" : "yellow"} /></Td>
                          <Td><Badge label={o.status.replace(/_/g, " ")} color={statusColor(o.status)} /></Td>
                          <Td cls="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString()}</Td>
                          <Td><ActionBtn onClick={() => openOrderModal(o)}>Manage</ActionBtn></Td>
                        </tr>
                      ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Prev</button>
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40">Next</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════ REVIEWS ════════════ */}
        {tab === "reviews" && (
          <div>
            <h1 className="text-xl font-medium mb-4">Reviews</h1>
            <div className="flex gap-2 mb-4">
              {["PENDING", "APPROVED", "REJECTED", "ALL"].map(s => (
                <button key={s} onClick={() => { setReviewStatus(s); setPage(1) }}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${reviewStatus === s ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Product</Th><Th>Customer</Th><Th>Rating</Th><Th>Review</Th><Th>Status</Th><Th>Date</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : reviews.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-gray-400">Koi review nahi</td></tr>
                      : reviews.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                          <Td cls="font-medium max-w-[120px] truncate">{r.product.name}</Td>
                          <Td cls="text-gray-500 text-xs">{r.user.name ?? r.user.email}</Td>
                          <Td>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</Td>
                          <Td cls="max-w-[160px]">
                            {r.title && <p className="font-medium text-xs">{r.title}</p>}
                            {r.body && <p className="text-gray-500 text-xs truncate">{r.body}</p>}
                          </Td>
                          <Td><Badge label={r.status} color={r.status === "APPROVED" ? "green" : r.status === "REJECTED" ? "red" : "yellow"} /></Td>
                          <Td cls="text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString()}</Td>
                          <Td>
                            <div className="flex gap-1.5">
                              {r.status !== "APPROVED" && <ActionBtn onClick={() => updateReview(r.id, "APPROVED")}>Approve</ActionBtn>}
                              {r.status !== "REJECTED" && <ActionBtn onClick={() => updateReview(r.id, "REJECTED")} danger>Reject</ActionBtn>}
                            </div>
                          </Td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ COUPONS ════════════ */}
        {tab === "coupons" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium">Coupons</h1>
              <button onClick={() => setCouponModal({ open: true, mode: "add", data: emptyCoupon })}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                + Add coupon
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Code</Th><Th>Type</Th><Th>Value</Th><Th>Used</Th><Th>Limit</Th><Th>Expires</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : coupons.length === 0 ? <tr><td colSpan={8} className="text-center py-10 text-gray-400">Koi coupon nahi</td></tr>
                      : coupons.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                          <Td cls="font-mono font-medium">{c.code}</Td>
                          <Td cls="text-gray-500 text-xs">{c.discountType.replace(/_/g, " ")}</Td>
                          <Td cls="font-medium">{c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : fmt(c.discountValue)}</Td>
                          <Td>{c.usageCount}</Td>
                          <Td cls="text-gray-500">{c.usageLimit ?? "∞"}</Td>
                          <Td cls="text-gray-400 text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "—"}</Td>
                          <Td><Badge label={c.isActive ? "Active" : "Inactive"} color={c.isActive ? "green" : "gray"} /></Td>
                          <Td>
                            <div className="flex gap-1.5">
                              <ActionBtn onClick={() => setCouponModal({ open: true, mode: "edit", data: { ...c, expiresAt: c.expiresAt ?? undefined } })}>Edit</ActionBtn>
                              <ActionBtn onClick={() => deleteCoupon(c.id, c.code)} danger>Delete</ActionBtn>
                            </div>
                          </Td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════ BANNERS ════════════ */}
        {tab === "banners" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium">Banners</h1>
              <button onClick={() => setBannerModal({ open: true, mode: "add", data: emptyBanner })}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium">
                + Add banner
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr><Th>Title</Th><Th>Position</Th><Th>Link</Th><Th>Order</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Loading...</td></tr>
                    : banners.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400">Koi banner nahi</td></tr>
                      : banners.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <Td cls="font-medium">{b.title}{b.subtitle && <div className="text-xs text-gray-400">{b.subtitle}</div>}</Td>
                          <Td cls="text-xs text-gray-500">{b.position.replace(/_/g, " ")}</Td>
                          <Td cls="text-xs text-blue-500 truncate max-w-[120px]">{b.link ?? "—"}</Td>
                          <Td>{b.sortOrder}</Td>
                          <Td><Badge label={b.isActive ? "Active" : "Inactive"} color={b.isActive ? "green" : "gray"} /></Td>
                          <Td>
                            <div className="flex gap-1.5">
                              <ActionBtn onClick={() => setBannerModal({ open: true, mode: "edit", data: b })}>Edit</ActionBtn>
                              <ActionBtn onClick={() => deleteBanner(b.id, b.title)} danger>Delete</ActionBtn>
                            </div>
                          </Td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ════════════ MODALS ════════════ */}

      {/* Product Modal */}
      {prodModal.open && (
        <ProductModal
          mode={prodModal.mode}
          data={prodModal.data as any}
          categories={categories}
          onSave={saveProduct}
          onClose={() => setProdModal({ open: false, mode: "add", data: emptyProd })}
          loading={prodLoading}
        />
      )}

      {/* Category Modal */}
      {catModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-medium text-base mb-4">{catModal.mode === "add" ? "Nai category banao" : "Category edit karo"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Name *</label>
                <input value={catModal.data.name ?? ""} onChange={e => {
                  const name = e.target.value
                  setCatModal(m => ({ ...m, data: { ...m.data, name, slug: catModal.mode === "add" ? slug(name) : m.data.slug } }))
                }} className={inp} placeholder="e.g. Clothing" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Slug *</label>
                <input value={catModal.data.slug ?? ""} onChange={e => setCatModal(m => ({ ...m, data: { ...m.data, slug: e.target.value } }))} className={inp} placeholder="clothing" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Description</label>
                <input value={(catModal.data as any).description ?? ""} onChange={e => setCatModal(m => ({ ...m, data: { ...m.data, description: e.target.value } as any }))} className={inp} placeholder="Optional..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Category Image</label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return

                    const fd = new FormData()
                    fd.append("files", file)

                    const res = await fetch("/api/admin/upload", {
                      method: "POST",
                      body: fd,
                    })

                    const data = await res.json()

                    if (res.ok) {
                      const url = data.images?.[0]?.url
                      setCatImageUrl(url)
                      console.log(catImageUrl)
                      setCatModal(m => ({
                        ...m,
                        data: { ...m.data, image: url }
                      }))
                      
                      showToast("Image uploaded!")
                    } else {
                      showToast(data.error || "Upload fail", "error")
                    }
                  }}
                  className="text-xs"
                />

                {/* Preview */}
                {catModal.data.image && (
                  <img
                    src={catModal.data.image}
                    alt="preview"
                    className="mt-2 h-16 w-16 object-cover rounded border"
                  />
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Parent category (optional)</label>
                <select value={(catModal.data as any).parentId ?? ""} onChange={e => setCatModal(m => ({ ...m, data: { ...m.data, parentId: e.target.value } as any }))} className={sel}>
                  <option value="">No parent (top-level)</option>
                  {categories.filter(c => c.id !== catModal.data.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={catModal.data.isActive ?? true} onChange={e => setCatModal(m => ({ ...m, data: { ...m.data, isActive: e.target.checked } }))} />
                  Active
                </label>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">Sort order</label>
                  <input type="number" value={catModal.data.sortOrder ?? 0} onChange={e => setCatModal(m => ({ ...m, data: { ...m.data, sortOrder: Number(e.target.value) } }))} className="w-16 border border-gray-200 rounded px-2 py-1 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setCatModal({ open: false, mode: "add", data: emptyCat })} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveCategory} disabled={catLoading} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {catLoading ? "Saving..." : catModal.mode === "add" ? "Add category" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {orderModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-50 overflow-auto py-8 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="font-medium text-base mb-1">Order manage karo</h2>
            <p className="text-xs text-gray-400 font-mono mb-4">{orderModal.order?.orderNumber}</p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Items in this order</p>
              {orderModal.order?.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs text-gray-600 py-0.5">
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{fmt(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Status update karo</label>
                <select value={orderNewSt} onChange={e => setOrderNewSt(e.target.value)} className={sel}>
                  {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUND_REQUESTED", "REFUNDED"].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tracking number (optional)</label>
                <input type="text" value={orderTrack} onChange={e => setOrderTrack(e.target.value)} placeholder="e.g. TCS-123456" className={inp} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Admin note (optional)</label>
                <textarea rows={2} value={orderNote} onChange={e => setOrderNote(e.target.value)} className={`${inp} resize-none`} placeholder="Koi note..." />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setOrderModal({ open: false, order: null })} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveOrder} disabled={orderLoading} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {orderLoading ? "Updating..." : "Update order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-medium text-base mb-4">{couponModal.mode === "add" ? "Naya coupon banao" : "Coupon edit karo"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Coupon code *</label>
                <input value={couponModal.data.code ?? ""} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, code: e.target.value.toUpperCase() } }))} className={inp} placeholder="SAVE20" disabled={couponModal.mode === "edit"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Discount type *</label>
                  <select value={couponModal.data.discountType ?? "PERCENTAGE"} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, discountType: e.target.value } }))} className={sel} disabled={couponModal.mode === "edit"}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED_AMOUNT">Fixed amount</option>
                    <option value="FREE_SHIPPING">Free shipping</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Value *</label>
                  <input type="number" value={couponModal.data.discountValue ?? ""} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, discountValue: Number(e.target.value) } }))} className={inp} placeholder="20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Min order (cents)</label>
                  <input type="number" value={(couponModal.data as any).minimumOrder ?? ""} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, minimumOrder: Number(e.target.value) } as any }))} className={inp} placeholder="100000" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Usage limit</label>
                  <input type="number" value={(couponModal.data as any).usageLimit ?? ""} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, usageLimit: Number(e.target.value) || null } as any }))} className={inp} placeholder="∞ unlimited" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Expires at</label>
                <input type="date" value={(couponModal.data as any).expiresAt?.slice(0, 10) ?? ""} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, expiresAt: e.target.value } as any }))} className={inp} />
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={couponModal.data.isActive ?? true} onChange={e => setCouponModal(m => ({ ...m, data: { ...m.data, isActive: e.target.checked } }))} />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setCouponModal({ open: false, mode: "add", data: emptyCoupon })} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveCoupon} disabled={couponLoading} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {couponLoading ? "Saving..." : couponModal.mode === "add" ? "Add coupon" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner Modal */}
      {bannerModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="font-medium text-base mb-4">{bannerModal.mode === "add" ? "Naya banner banao" : "Banner edit karo"}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Title *</label>
                <input value={bannerModal.data.title ?? ""} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, title: e.target.value } }))} className={inp} placeholder="Summer Sale 2024" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Subtitle</label>
                <input value={bannerModal.data.subtitle ?? ""} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, subtitle: e.target.value } }))} className={inp} placeholder="Up to 50% off" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Image URL *</label>
                <input value={bannerModal.data.imageUrl ?? ""} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, imageUrl: e.target.value } }))} className={inp} placeholder="https://..." />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Link URL</label>
                <input value={bannerModal.data.link ?? ""} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, link: e.target.value } }))} className={inp} placeholder="/products/sale" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Position</label>
                  <select value={bannerModal.data.position ?? "HOME_HERO"} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, position: e.target.value } }))} className={sel}>
                    <option value="HOME_HERO">Home hero</option>
                    <option value="SIDEBAR">Sidebar</option>
                    <option value="CATEGORY_TOP">Category top</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Sort order</label>
                  <input type="number" value={bannerModal.data.sortOrder ?? 0} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, sortOrder: Number(e.target.value) } }))} className={inp} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={bannerModal.data.isActive ?? true} onChange={e => setBannerModal(m => ({ ...m, data: { ...m.data, isActive: e.target.checked } }))} />
                Active
              </label>
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <button onClick={() => setBannerModal({ open: false, mode: "add", data: emptyBanner })} className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={saveBanner} disabled={bannerLoading} className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {bannerLoading ? "Saving..." : bannerModal.mode === "add" ? "Add banner" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}