"use client"
// src/app/dashboard/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"

// ─── Color tokens (matching Danifesh brand) ───────────────
const G  = "#3f554f"   // primary green
const GL = "#e8f0ec"   // light green bg
const GM = "#d4e6db"   // medium green

// ─── Types ────────────────────────────────────────────────
type Stats = {
  totalOrders: number; pendingOrders: number; deliveredOrders: number
  wishlistCount: number; unreadNotifications: number; totalSpent: number
}
type OrderItem = {
  id: string; productName: string; quantity: number
  unitPrice: number; totalPrice: number
  productImage: string | null; variantInfo: string | null
  product?: { slug: string }
}
type StatusHistory = { status: string; note: string | null; createdAt: string }
type Order = {
  id: string; orderNumber: string; status: string; paymentStatus: string
  paymentMethod: string | null; totalAmount: number; subtotal: number
  shippingCost: number; discountAmount: number; createdAt: string
  trackingNumber: string | null; trackingUrl: string | null
  shippedAt: string | null; deliveredAt: string | null
  customerNote: string | null; adminNote: string | null
  items: OrderItem[]
  address: { firstName: string; lastName: string; addressLine1: string; city: string; state: string; phone: string | null }
  statusHistory: StatusHistory[]
  shippingMethod: { name: string; carrier: string | null; estimatedDays: number | null } | null
  _count: { items: number }
}
type Notification = {
  id: string; title: string; message: string; type: string
  isRead: boolean; link: string | null; createdAt: string
}
type WishlistItem = {
  id: string; addedAt: string
  product: {
    id: string; name: string; slug: string
    basePrice: number; compareAtPrice: number | null; stock: number
    images: { url: string }[]
  }
}
type Address = {
  id: string; label: string | null; firstName: string; lastName: string
  addressLine1: string; addressLine2: string | null
  city: string; state: string; postalCode: string; country: string
  phone: string | null; isDefault: boolean
}
type Profile = {
  id: string; name: string | null; email: string
  phone: string | null; image: string | null; createdAt: string
  _count: { orders: number; reviews: number }
}

// ─── Helpers ──────────────────────────────────────────────
const fmt   = (c: number) => "Rs " + (c / 100).toLocaleString("en-PK")
const tdate = (d: string) => new Date(d).toLocaleDateString("en-PK", { day:"numeric", month:"short", year:"numeric" })

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:          { label: "Pending",          color: "#92400e", bg: "#fef3c7", icon: "⏳" },
  PAYMENT_PENDING:  { label: "Payment Pending",  color: "#92400e", bg: "#fef3c7", icon: "💳" },
  CONFIRMED:        { label: "Confirmed",        color: "#065f46", bg: "#d1fae5", icon: "✓"  },
  PROCESSING:       { label: "Processing",       color: "#1e40af", bg: "#dbeafe", icon: "⚙️"  },
  SHIPPED:          { label: "Shipped",          color: "#1e40af", bg: "#dbeafe", icon: "📦" },
  OUT_FOR_DELIVERY: { label: "Out for Delivery", color: "#5b21b6", bg: "#ede9fe", icon: "🚚" },
  DELIVERED:        { label: "Delivered",        color: "#065f46", bg: "#d1fae5", icon: "✅" },
  CANCELLED:        { label: "Cancelled",        color: "#991b1b", bg: "#fee2e2", icon: "✕"  },
  REFUND_REQUESTED: { label: "Refund Requested", color: "#991b1b", bg: "#fee2e2", icon: "↩" },
  REFUNDED:         { label: "Refunded",         color: "#991b1b", bg: "#fee2e2", icon: "💸" },
  FAILED:           { label: "Failed",           color: "#991b1b", bg: "#fee2e2", icon: "✕"  },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, color: "#374151", bg: "#f3f4f6", icon: "•" }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ color: m.color, background: m.bg }}>
      <span className="text-[11px]">{m.icon}</span>
      {m.label}
    </span>
  )
}

// Order timeline steps
const TIMELINE = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED"]

function OrderTimeline({ status }: { status: string }) {
  const cancelledSet = new Set(["CANCELLED","REFUND_REQUESTED","REFUNDED","FAILED"])
  if (cancelledSet.has(status)) {
    return (
      <div className="flex items-center gap-2 py-3 px-4 bg-red-50 rounded-xl border border-red-100">
        <span className="text-red-500 text-sm font-medium">✕ Order {STATUS_META[status]?.label ?? status}</span>
      </div>
    )
  }
  const currentIdx = TIMELINE.indexOf(status)
  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {TIMELINE.map((s, i) => {
        const done    = i <= currentIdx
        const active  = i === currentIdx
        const labels  = ["Placed","Confirmed","Processing","Shipped","Out for Delivery","Delivered"]
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                done ? "text-white" : "bg-gray-100 text-gray-400"
              }`} style={done ? { background: G } : {}}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[10px] text-center leading-tight max-w-[56px] ${active ? "font-bold" : "text-gray-400"}`}
                style={active ? { color: G } : {}}>
                {labels[i]}
              </span>
            </div>
            {i < TIMELINE.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${i < currentIdx ? "" : "bg-gray-200"}`}
                style={i < currentIdx ? { background: G } : {}} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Sidebar nav items ────────────────────────────────────
const NAV = [
  { key: "overview",      label: "Overview",       icon: "⊞"  },
  { key: "orders",        label: "My Orders",      icon: "📋" },
  { key: "wishlist",      label: "Wishlist",       icon: "♥"  },
  { key: "addresses",     label: "Addresses",      icon: "📍" },
  { key: "notifications", label: "Notifications",  icon: "🔔" },
  { key: "profile",       label: "Profile",        icon: "👤" },
]

// ═════════════════════════════════════════════════════════
//  MAIN DASHBOARD
// ═════════════════════════════════════════════════════════
export default function Dashboard() {
  const { data: session, status } = useSession()
  const router  = useRouter()
  const user    = session?.user
  const role    = (user as any)?.role as string | undefined

  const [tab,             setTab]             = useState("overview")
  const [stats,           setStats]           = useState<Stats | null>(null)
  const [recentOrders,    setRecentOrders]    = useState<Order[]>([])
  const [recentNotifs,    setRecentNotifs]    = useState<Notification[]>([])
  const [allOrders,       setAllOrders]       = useState<Order[]>([])
  const [ordersTotal,     setOrdersTotal]     = useState(0)
  const [ordersPage,      setOrdersPage]      = useState(1)
  const [ordersPages,     setOrdersPages]     = useState(1)
  const [orderFilter,     setOrderFilter]     = useState("")
  const [selectedOrder,   setSelectedOrder]   = useState<Order | null>(null)
  const [wishlist,        setWishlist]        = useState<WishlistItem[]>([])
  const [addresses,       setAddresses]       = useState<Address[]>([])
  const [notifications,   setNotifications]   = useState<Notification[]>([])
  const [selectedNotif,   setSelectedNotif]   = useState<Notification | null>(null)
  const [profile,         setProfile]         = useState<Profile | null>(null)
  const [loading,         setLoading]         = useState(false)
  const [mobileNavOpen,   setMobileNavOpen]   = useState(false)

  // Profile form
  const [profForm,   setProfForm]   = useState({ name: "", phone: "", currentPassword: "", newPassword: "" })
  const [profMsg,    setProfMsg]    = useState("")
  const [profSaving, setProfSaving] = useState(false)

  // ── Auth guard ──────────────────────────────────────────
  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/login"); return }
    if (role && role !== "USER") {
      // Admin/super-admin ko unka panel dikhao
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        // Allow them to see dashboard too, just show it
      }
    }
  }, [session, status, role, router])

  // ── Fetch overview data ─────────────────────────────────
  const fetchOverview = useCallback(async () => {
    const res  = await fetch("/api/user/dashboard")
    const data = await res.json()
    setStats(data.stats)
    setRecentOrders(data.recentOrders ?? [])
    setRecentNotifs(data.recentNotifications ?? [])
  }, [])

  // ── Fetch all orders ────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    const p   = new URLSearchParams({ page: String(ordersPage) })
    if (orderFilter) p.set("status", orderFilter)
    const res  = await fetch(`/api/user/orders?${p}`)
    const data = await res.json()
    setAllOrders(data.orders ?? [])
    setOrdersTotal(data.total ?? 0)
    setOrdersPages(data.pages ?? 1)
    setLoading(false)
  }, [ordersPage, orderFilter])

  // ── Fetch wishlist ──────────────────────────────────────
  const fetchWishlist = useCallback(async () => {
    setLoading(true)
    const res  = await fetch("/api/user/wishlist")
    const data = await res.json()
    setWishlist(data.items ?? [])
    setLoading(false)
  }, [])

  // ── Fetch addresses ─────────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    setLoading(true)
    const res  = await fetch("/api/user/addresses")
    const data = await res.json()
    setAddresses(data.addresses ?? [])
    setLoading(false)
  }, [])

  // ── Fetch notifications ─────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    const res  = await fetch("/api/user/notifications")
    const data = await res.json()
    setNotifications(data.notifications ?? [])
    setLoading(false)
  }, [])

  // ── Fetch profile ───────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    const res  = await fetch("/api/user/profile")
    const data = await res.json()
    if (data.user) {
      setProfile(data.user)
      setProfForm(f => ({ ...f, name: data.user.name ?? "", phone: data.user.phone ?? "" }))
    }
  }, [])

  useEffect(() => { fetchOverview() }, [fetchOverview])

  useEffect(() => {
    if (tab === "orders")        fetchOrders()
    if (tab === "wishlist")      fetchWishlist()
    if (tab === "addresses")     fetchAddresses()
    if (tab === "notifications") fetchNotifications()
    if (tab === "profile")       fetchProfile()
  }, [tab])

  useEffect(() => {
    if (tab === "orders") fetchOrders()
  }, [ordersPage, orderFilter])

  // ── Remove from wishlist ────────────────────────────────
  async function removeWishlist(productId: string) {
    await fetch("/api/user/wishlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    })
    fetchWishlist()
    fetchOverview()
  }

  // ── Mark notifications read ─────────────────────────────
  async function markAllRead() {
    await fetch("/api/user/notifications", { method: "PATCH" })
    fetchNotifications()
    fetchOverview()
  }

  // ── Mark single notification read ────────────────────────
  async function markOneRead(notifId: string) {
    await fetch(`/api/user/notifications/${notifId}`, { method: "PATCH" })
    // Local state update — turant UI mein reflect ho
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n))
    setStats(prev => prev ? { ...prev, unreadNotifications: Math.max(0, prev.unreadNotifications - 1) } : prev)
  }

  // ── Open notification modal ───────────────────────────────
  async function openNotification(notif: Notification) {
    setSelectedNotif(notif)
    if (!notif.isRead) {
      await markOneRead(notif.id)
    }
  }

  // ── Save profile ────────────────────────────────────────
  async function saveProfile() {
    setProfSaving(true)
    setProfMsg("")
    const res  = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profForm),
    })
    const data = await res.json()
    setProfSaving(false)
    if (res.ok) {
      setProfMsg("success:Profile update ho gaya!")
      setProfForm(f => ({ ...f, currentPassword: "", newPassword: "" }))
      fetchProfile()
    } else {
      setProfMsg("error:" + (data.error ?? "Kuch ghalat hua"))
    }
    setTimeout(() => setProfMsg(""), 4000)
  }

  // ── Fetch single order detail ───────────────────────────
  async function openOrder(orderId: string) {
    const res  = await fetch(`/api/user/orders/${orderId}`)
    const data = await res.json()
    if (data.order) setSelectedOrder(data.order)
  }

  // ── Tab switch helper ───────────────────────────────────
  function switchTab(key: string) {
    setTab(key)
    setSelectedOrder(null)
    setMobileNavOpen(false)
  }

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafaf8" }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }} />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  const unread = stats?.unreadNotifications ?? 0

  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen" style={{ background: "#f5f6f2" }}>

      {/* ── Mobile top bar ─────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: G }}>
            {user?.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-800 leading-none">{user?.name ?? "User"}</p>
            <p className="text-[10px] text-gray-400">{NAV.find(n => n.key === tab)?.label}</p>
          </div>
        </div>
        <button onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-600 relative">
          ☰
          {unread > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500" />}
        </button>
      </div>

      {/* ── Mobile nav drawer ──────────────────────────── */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="w-64 bg-white h-full shadow-2xl flex flex-col">
            <div className="p-5 border-b border-gray-100" style={{ background: G }}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{user?.name ?? "User"}</p>
                  <p className="text-white/70 text-xs truncate max-w-[140px]">{user?.email}</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 py-3">
              {NAV.map(n => (
                <button key={n.key} onClick={() => switchTab(n.key)}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-colors ${tab === n.key ? "font-bold border-l-2" : "text-gray-600 hover:bg-gray-50"}`}
                  style={tab === n.key ? { color: G, borderColor: G, background: GL } : {}}>
                  <span>{n.icon}</span>{n.label}
                  {n.key === "notifications" && unread > 0 && (
                    <span className="ml-auto text-xs bg-rose-500 text-white px-1.5 py-0.5 rounded-full">{unread}</span>
                  )}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => signOut({ callbackUrl: "/" })} className="text-sm text-rose-500 hover:text-rose-700">
                Logout
              </button>
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileNavOpen(false)} />
        </div>
      )}

      <div className="max-w-7xl mx-auto flex min-h-screen">

        {/* ════ SIDEBAR ═════════════════════════════════════ */}
        <aside className="hidden md:flex w-64 flex-col min-h-screen bg-white border-r border-gray-100 sticky top-0 h-screen overflow-y-auto">

          {/* Profile card */}
          <div className="p-6" style={{ background: G }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-bold shrink-0 overflow-hidden">
                {user?.image ? (
                  <Image src={user.image} alt="avatar" width={56} height={56} className="w-full h-full object-cover" />
                ) : (
                  (user?.name?.[0]?.toUpperCase() ?? "U")
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-bold text-sm truncate">{user?.name ?? "User"}</p>
                <p className="text-white/60 text-xs truncate">{user?.email}</p>
              </div>
            </div>
            {stats && (
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <p className="text-white font-bold text-lg leading-none">{stats.totalOrders}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">Orders</p>
                </div>
                <div className="bg-white/10 rounded-xl p-2 text-center">
                  <p className="text-white font-bold text-lg leading-none">{stats.wishlistCount}</p>
                  <p className="text-white/60 text-[10px] mt-0.5">Wishlist</p>
                </div>
              </div>
            )}
          </div>

          {/* Nav links */}
          <nav className="flex-1 py-3">
            {NAV.map(n => (
              <button key={n.key} onClick={() => switchTab(n.key)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-all ${tab === n.key ? "font-bold border-l-2" : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"}`}
                style={tab === n.key ? { color: G, borderColor: G, background: GL } : {}}>
                <span className="text-base">{n.icon}</span>
                {n.label}
                {n.key === "notifications" && unread > 0 && (
                  <span className="ml-auto text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded-full font-bold">{unread}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-5 border-t border-gray-100 space-y-2">
            <Link href="/" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition">
              ← Back to store
            </Link>
            <button onClick={() => signOut({ callbackUrl: "/" })} className="text-xs text-rose-500 hover:text-rose-700 transition">
              Logout
            </button>
          </div>
        </aside>

        {/* ════ MAIN CONTENT ════════════════════════════════ */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto min-w-0">

          {/* ══ OVERVIEW ══════════════════════════════════ */}
          {tab === "overview" && (
            <div>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, <span style={{ color: G }}>{user?.name?.split(" ")[0] ?? "User"}</span> 👋
                </h1>
                <p className="text-sm text-gray-400 mt-1">Your Activity</p>
              </div>

              {/* Stats grid */}
              {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Total Orders",    value: stats.totalOrders,    icon: "📋", accent: G      },
                    { label: "Active Orders",   value: stats.pendingOrders,  icon: "🚚", accent: "#1e40af" },
                    { label: "Delivered",       value: stats.deliveredOrders,icon: "✅", accent: "#065f46" },
                    { label: "Wishlist",        value: stats.wishlistCount,  icon: "♥",  accent: "#be185d" },
                    { label: "Notifications",   value: stats.unreadNotifications, icon: "🔔", accent: "#d97706" },
                    { label: "Total Spent",     value: fmt(stats.totalSpent),icon: "💰", accent: G, isText: true },
                  ].map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-4 border border-gray-100 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-xl">{s.icon}</span>
                        <div className="w-2 h-2 rounded-full" style={{ background: s.accent }} />
                      </div>
                      <p className="text-2xl font-bold text-gray-900" style={(s as any).isText ? { fontSize: "1.1rem" } : {}}>{s.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recent orders */}
              {recentOrders.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-4">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h2 className="font-bold text-gray-800 text-sm">Recent Orders</h2>
                    <button onClick={() => switchTab("orders")} className="text-xs hover:underline" style={{ color: G }}>
                      View all →
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {recentOrders.map(o => (
                      <button key={o.id} onClick={() => { switchTab("orders"); openOrder(o.id) }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition text-left">
                        {/* Product thumb */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {o.items[0]?.productImage ? (
                            <Image src={o.items[0].productImage} alt="" width={40} height={40} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">📦</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 font-mono">{o.orderNumber}</p>
                          <p className="text-xs text-gray-400">{o._count.items} items · {tdate(o.createdAt)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StatusBadge status={o.status} />
                          <p className="text-xs font-bold" style={{ color: G }}>{fmt(o.totalAmount)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent notifications */}
              {recentNotifs.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h2 className="font-bold text-gray-800 text-sm">Recent Notifications</h2>
                    <button onClick={() => switchTab("notifications")} className="text-xs hover:underline" style={{ color: G }}>View all →</button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {recentNotifs.map(n => (
                      <div key={n.id} className={`flex items-start gap-3 px-5 py-3.5 ${!n.isRead ? "" : "opacity-60"}`}
                        style={!n.isRead ? { background: GL + "60" } : {}}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                          style={{ background: GL, color: G }}>
                          🔔
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${n.isRead ? "text-gray-600" : "font-semibold text-gray-800"}`}>{n.title}</p>
                          <p className="text-xs text-gray-400 truncate">{n.message}</p>
                          <p className="text-[10px] text-gray-300 mt-0.5">{tdate(n.createdAt)}</p>
                        </div>
                        {!n.isRead && <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{ background: G }} />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ ORDERS ════════════════════════════════════ */}
          {tab === "orders" && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-5">My Orders</h1>

              {/* Order detail modal */}
              {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
                  <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                      <div>
                        <p className="font-bold text-gray-900 font-mono">{selectedOrder.orderNumber}</p>
                        <p className="text-xs text-gray-400">{tdate(selectedOrder.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={selectedOrder.status} />
                        <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">✕</button>
                      </div>
                    </div>

                    <div className="p-6 space-y-5">
                      {/* Timeline */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Order Progress</p>
                        <OrderTimeline status={selectedOrder.status} />
                      </div>

                      {/* Tracking */}
                      {selectedOrder.trackingNumber && (
                        <div className="rounded-xl p-4 border" style={{ background: GL, borderColor: GM }}>
                          <p className="text-xs font-bold mb-1" style={{ color: G }}>📦 Tracking Number</p>
                          <p className="font-mono font-bold text-gray-800">{selectedOrder.trackingNumber}</p>
                          {selectedOrder.trackingUrl && (
                            <a href={selectedOrder.trackingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs underline mt-1 inline-block" style={{ color: G }}>
                              Track your order →
                            </a>
                          )}
                        </div>
                      )}

                      {/* Items */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Items ({selectedOrder.items.length})</p>
                        <div className="space-y-3">
                          {selectedOrder.items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                              <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-200 shrink-0">
                                {item.productImage ? (
                                  <Image src={item.productImage} alt={item.productName} width={48} height={48} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                                {item.variantInfo && <p className="text-xs text-gray-400">{item.variantInfo}</p>}
                                <p className="text-xs text-gray-400">Qty: {item.quantity} × {fmt(item.unitPrice)}</p>
                              </div>
                              <p className="text-sm font-bold shrink-0" style={{ color: G }}>{fmt(item.totalPrice)}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price breakdown */}
                      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Subtotal</span><span>{fmt(selectedOrder.subtotal)}</span>
                        </div>
                        {selectedOrder.shippingCost > 0 && (
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Shipping</span><span>{fmt(selectedOrder.shippingCost)}</span>
                          </div>
                        )}
                        {selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Discount</span><span>-{fmt(selectedOrder.discountAmount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-gray-900 border-t border-gray-200 pt-2">
                          <span>Total</span><span style={{ color: G }}>{fmt(selectedOrder.totalAmount)}</span>
                        </div>
                      </div>

                      {/* Delivery address */}
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Delivery Address</p>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                          <p className="font-semibold text-gray-800">{selectedOrder.address.firstName} {selectedOrder.address.lastName}</p>
                          <p>{selectedOrder.address.addressLine1}</p>
                          <p>{selectedOrder.address.city}, {selectedOrder.address.state}</p>
                          {selectedOrder.address.phone && <p style={{ color: G }}>📞 {selectedOrder.address.phone}</p>}
                        </div>
                      </div>

                      {/* Payment */}
                      <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                        <span className="text-xl">💵</span>
                        <div>
                          <p className="text-xs text-gray-500">Payment Method</p>
                          <p className="text-sm font-semibold text-gray-800">{selectedOrder.paymentMethod ?? "—"}</p>
                        </div>
                        <div className="ml-auto">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            selectedOrder.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}>
                            {selectedOrder.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Admin note */}
                      {selectedOrder.adminNote && (
                        <div className="rounded-xl p-4 border border-amber-200 bg-amber-50">
                          <p className="text-xs font-bold text-amber-700 mb-1">📝 Note from Danifesh</p>
                          <p className="text-sm text-amber-800">{selectedOrder.adminNote}</p>
                        </div>
                      )}

                      {/* Status history */}
                      {selectedOrder.statusHistory.length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Status History</p>
                          <div className="space-y-2">
                            {selectedOrder.statusHistory.map((h, i) => (
                              <div key={i} className="flex items-start gap-3 text-sm">
                                <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ background: G }} />
                                <div>
                                  <span className="font-semibold text-gray-700">{STATUS_META[h.status]?.label ?? h.status}</span>
                                  {h.note && <span className="text-gray-400 ml-2">— {h.note}</span>}
                                  <p className="text-[10px] text-gray-300">{tdate(h.createdAt)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Filter tabs */}
              <div className="flex gap-2 mb-4 flex-wrap">
                {[
                  { v: "",                label: "All" },
                  { v: "PENDING",         label: "Pending" },
                  { v: "SHIPPED",         label: "Shipped" },
                  { v: "OUT_FOR_DELIVERY",label: "Out for Delivery" },
                  { v: "DELIVERED",       label: "Delivered" },
                  { v: "CANCELLED",       label: "Cancelled" },
                ].map(f => (
                  <button key={f.v} onClick={() => { setOrderFilter(f.v); setOrdersPage(1) }}
                    className="text-xs px-3 py-1.5 rounded-xl border transition-all font-medium"
                    style={orderFilter === f.v
                      ? { background: G, color: "#fff", borderColor: G }
                      : { background: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Orders list */}
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }} />
                </div>
              ) : allOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">📋</span>
                  <p className="text-gray-500 mt-3 text-sm">Not Found Any Order</p>
                  <Link href="/" className="mt-4 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                    style={{ background: G }}>
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {allOrders.map(o => (
                    <div key={o.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
                      {/* Order header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                          <p className="font-bold text-sm font-mono text-gray-700">{o.orderNumber}</p>
                          <StatusBadge status={o.status} />
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="text-sm font-bold" style={{ color: G }}>{fmt(o.totalAmount)}</p>
                          <button onClick={() => openOrder(o.id)}
                            className="text-xs border rounded-lg px-3 py-1.5 transition font-medium"
                            style={{ borderColor: G, color: G }}>
                            Details
                          </button>
                        </div>
                      </div>

                      {/* Items preview */}
                      <div className="px-5 py-3 flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {o.items.slice(0, 3).map((item, i) => (
                            <div key={item.id} className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white bg-gray-100 shrink-0">
                              {item.productImage ? (
                                <Image src={item.productImage} alt={item.productName} width={40} height={40} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📦</div>
                              )}
                            </div>
                          ))}
                          {o._count.items > 3 && (
                            <div className="w-10 h-10 rounded-xl border-2 border-white bg-gray-100 flex items-center justify-center text-xs text-gray-500 font-medium">
                              +{o._count.items - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">
                            {o.items[0]?.productName}
                            {o._count.items > 1 ? ` + ${o._count.items - 1} more` : ""}
                          </p>
                          <p className="text-xs text-gray-400">{tdate(o.createdAt)} · {o.address.city}</p>
                        </div>
                      </div>

                      {/* Tracking strip */}
                      {o.trackingNumber && (
                        <div className="px-5 pb-3 flex items-center gap-2">
                          <span className="text-xs font-mono text-gray-500">📦 {o.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {ordersPages > 1 && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <p className="text-xs text-gray-400">Showing {ordersTotal} orders</p>
                  <div className="flex gap-2">
                    <button disabled={ordersPage === 1} onClick={() => setOrdersPage(p => p - 1)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                      ← Prev
                    </button>
                    <span className="text-xs px-3 py-1.5 text-gray-500">{ordersPage}/{ordersPages}</span>
                    <button disabled={ordersPage === ordersPages} onClick={() => setOrdersPage(p => p + 1)}
                      className="text-xs px-3 py-1.5 border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ WISHLIST ══════════════════════════════════ */}
          {tab === "wishlist" && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-5">My Wishlist</h1>
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }} />
                </div>
              ) : wishlist.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">♥</span>
                  <p className="text-gray-500 mt-3 text-sm">Wishlist is empty</p>
                  <Link href="/" className="mt-4 inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: G }}>
                    Start Shopping
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {wishlist.map(item => {
                    const p    = item.product
                    const disc = p.compareAtPrice && p.compareAtPrice > p.basePrice
                      ? Math.round(((p.compareAtPrice - p.basePrice) / p.compareAtPrice) * 100)
                      : null
                    return (
                      <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="relative aspect-square bg-gray-50 overflow-hidden">
                          {p.images[0] ? (
                            <Image src={p.images[0].url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="(max-width: 768px) 50vw, 25vw" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">👗</div>
                          )}
                          {disc && (
                            <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                              -{disc}%
                            </span>
                          )}
                          {p.stock === 0 && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-500 bg-white px-3 py-1 rounded-full border">Out of Stock</span>
                            </div>
                          )}
                          {/* Remove button */}
                          <button onClick={() => removeWishlist(p.id)}
                            className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full flex items-center justify-center text-rose-400 hover:text-rose-600 shadow-sm transition opacity-0 group-hover:opacity-100">
                            ✕
                          </button>
                        </div>
                        <div className="p-3">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-sm font-bold" style={{ color: G }}>{fmt(p.basePrice)}</span>
                            {p.compareAtPrice && p.compareAtPrice > p.basePrice && (
                              <span className="text-xs text-gray-400 line-through">{fmt(p.compareAtPrice)}</span>
                            )}
                          </div>
                          <Link href={`/products/${p.slug}`}
                            className="mt-2 block w-full text-center text-xs font-semibold py-2 rounded-xl transition text-white"
                            style={{ background: p.stock > 0 ? G : "#9ca3af" }}>
                            {p.stock > 0 ? "View Product" : "Out of Stock"}
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ ADDRESSES ═════════════════════════════════ */}
          {tab === "addresses" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900">My Addresses</h1>
                <Link href="/checkout" className="text-sm px-4 py-2 rounded-xl text-white font-semibold" style={{ background: G }}>
                  + Add via Checkout
                </Link>
              </div>
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }} />
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">📍</span>
                  <p className="text-gray-500 mt-3 text-sm">No Address Found</p>
                  <p className="text-gray-400 text-xs mt-1">Add Address While Checkout</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map(addr => (
                    <div key={addr.id} className="bg-white rounded-2xl border-2 p-5"
                      style={{ borderColor: addr.isDefault ? G : "#e5e7eb" }}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📍</span>
                          {addr.label && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: GL, color: G }}>
                              {addr.label}
                            </span>
                          )}
                          {addr.isDefault && (
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: G }}>
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="font-bold text-gray-800">{addr.firstName} {addr.lastName}</p>
                      <p className="text-sm text-gray-600 mt-1">{addr.addressLine1}</p>
                      {addr.addressLine2 && <p className="text-sm text-gray-600">{addr.addressLine2}</p>}
                      <p className="text-sm text-gray-600">{addr.city}, {addr.state} {addr.postalCode}</p>
                      <p className="text-sm text-gray-600">{addr.country}</p>
                      {addr.phone && <p className="text-sm mt-1 font-medium" style={{ color: G }}>📞 {addr.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ NOTIFICATIONS ═════════════════════════════ */}
          {tab === "notifications" && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-bold text-gray-900">Notifications</h1>
                {notifications.some(n => !n.isRead) && (
                  <button onClick={markAllRead} className="text-xs font-semibold px-3 py-1.5 rounded-xl border transition"
                    style={{ borderColor: G, color: G }}>
                    Mark all read
                  </button>
                )}
              </div>
              {loading ? (
                <div className="flex justify-center py-16">
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: `${G} transparent ${G} ${G}` }} />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <span className="text-5xl">🔔</span>
                  <p className="text-gray-500 mt-3 text-sm">No Notifications Found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map(n => (
                    <button key={n.id} onClick={() => openNotification(n)}
                      className={`w-full text-left flex items-start gap-4 p-4 rounded-2xl border transition-all hover:shadow-sm ${!n.isRead ? "border-transparent" : "border-gray-100 bg-white"}`}
                      style={!n.isRead ? { background: GL + "80", borderColor: GM } : {}}>
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ background: GL }}>
                        {n.type === "ORDER_UPDATE" ? "📦" : n.type === "PROMO" ? "🎁" : "🔔"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>
                          {n.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-gray-300 mt-1">{tdate(n.createdAt)}</p>
                      </div>
                      {!n.isRead && <div className="w-2 h-2 rounded-full shrink-0 mt-2" style={{ background: G }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE ═══════════════════════════════════ */}
          {tab === "profile" && (
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-5">My Profile</h1>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* Profile card */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
                    <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-white overflow-hidden"
                      style={{ background: G }}>
                      {user?.image ? (
                        <Image src={user.image} alt="avatar" width={80} height={80} className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0]?.toUpperCase() ?? "U"
                      )}
                    </div>
                    <p className="font-bold text-gray-900">{profile?.name ?? "—"}</p>
                    <p className="text-sm text-gray-400">{profile?.email}</p>
                    {profile?.phone && <p className="text-sm mt-1" style={{ color: G }}>📞 {profile.phone}</p>}
                    <p className="text-xs text-gray-300 mt-2">Member since {profile ? tdate(profile.createdAt) : "—"}</p>
                    {profile && (
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="rounded-xl p-2 text-center" style={{ background: GL }}>
                          <p className="font-bold" style={{ color: G }}>{profile._count.orders}</p>
                          <p className="text-[10px] text-gray-500">Orders</p>
                        </div>
                        <div className="rounded-xl p-2 text-center" style={{ background: GL }}>
                          <p className="font-bold" style={{ color: G }}>{profile._count.reviews}</p>
                          <p className="text-[10px] text-gray-500">Reviews</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit form */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Personal info */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-800 mb-4 text-sm">Personal Information</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                        <input value={profForm.name} onChange={e => setProfForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition focus:ring-2"
                          style={{ "--tw-ring-color": GM } as any}
                          onFocus={e => e.target.style.borderColor = G}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                          placeholder="Apna naam daro" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Email</label>
                        <input value={profile?.email ?? ""} disabled
                          className="w-full px-4 py-3 rounded-xl border border-gray-100 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                        <input value={profForm.phone} onChange={e => setProfForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition"
                          onFocus={e => e.target.style.borderColor = G}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                          placeholder="03XX-XXXXXXX" />
                      </div>
                    </div>
                  </div>

                  {/* Change password */}
                  <div className="bg-white rounded-2xl border border-gray-100 p-6">
                    <h2 className="font-bold text-gray-800 mb-4 text-sm">Change Password</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Current Password</label>
                        <input type="password" value={profForm.currentPassword}
                          onChange={e => setProfForm(f => ({ ...f, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition"
                          onFocus={e => e.target.style.borderColor = G}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                          placeholder="Current password" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">New Password</label>
                        <input type="password" value={profForm.newPassword}
                          onChange={e => setProfForm(f => ({ ...f, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none transition"
                          onFocus={e => e.target.style.borderColor = G}
                          onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                          placeholder="Naya password (min 8 chars)" />
                      </div>
                    </div>
                  </div>

                  {/* Feedback */}
                  {profMsg && (
                    <div className={`px-4 py-3 rounded-xl text-sm font-medium border ${
                      profMsg.startsWith("success")
                        ? "bg-green-50 border-green-200 text-green-700"
                        : "bg-red-50 border-red-200 text-red-600"
                    }`}>
                      {profMsg.split(":").slice(1).join(":")}
                    </div>
                  )}

                  <button onClick={saveProfile} disabled={profSaving}
                    className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.99] disabled:opacity-60"
                    style={{ background: G }}>
                    {profSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══ NOTIFICATION MODAL ════════════════════════════ */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedNotif(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                  style={{ background: GL }}>
                  {selectedNotif.type === "ORDER_UPDATE" ? "📦" : selectedNotif.type === "PROMO" ? "🎁" : "🔔"}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: G }}>
                    {selectedNotif.type.replace(/_/g, " ")}
                  </p>
                  <p className="text-[10px] text-gray-400">{tdate(selectedNotif.createdAt)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedNotif(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition">
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              <h2 className="font-bold text-gray-900 text-base mb-2">{selectedNotif.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed">{selectedNotif.message}</p>
            </div>

            {/* Actions */}
            <div className="px-5 pb-5 flex gap-2">
              {selectedNotif.link && selectedNotif.link.includes("/orders/") ? (
                // Order notification — Orders tab mein jaao
                <button
                  onClick={async () => {
                    setSelectedNotif(null)
                    // Order ID extract karo link se
                    const orderId = selectedNotif.link!.split("/orders/")[1]
                    switchTab("orders")
                    await openOrder(orderId)
                  }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition"
                  style={{ background: G }}>
                  Order Details Dekhein →
                </button>
              ) : selectedNotif.link ? (
                <Link href={selectedNotif.link}
                  onClick={() => setSelectedNotif(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white text-center transition"
                  style={{ background: G }}>
                  View →
                </Link>
              ) : null}
              <button onClick={() => setSelectedNotif(null)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}