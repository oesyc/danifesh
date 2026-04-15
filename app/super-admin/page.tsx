"use client"
// src/app/(super-admin)/super-admin/page.tsx

import { useEffect, useState } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"

type Stats = {
  totalUsers: number; totalOrders: number; totalProducts: number
  pendingOrders: number; refundOrders: number; totalAdmins: number
  newUsersThisMonth: number; outOfStock: number; totalRevenue: number
}
type User = {
  id: string; name: string | null; email: string; role: string
  isActive: boolean; createdAt: string; _count: { orders: number }
}
type Order = {
  id: string; orderNumber: string; status: string; paymentStatus: string
  totalAmount: number; createdAt: string
  user: { name: string | null; email: string }
  items: { id: string }[]
}
type Log = {
  id: string; action: string; entityType: string; entityId: string
  details: any; createdAt: string
  admin: { name: string | null; email: string }
}

function formatAmount(cents: number) {
  return "Rs " + (cents / 100).toLocaleString()
}

function RolePill({ role }: { role: string }) {
  const c: Record<string, string> = {
    USER: "bg-gray-100 text-gray-700",
    ADMIN: "bg-blue-100 text-blue-700",
    SUPER_ADMIN: "bg-purple-100 text-purple-700",
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[role] ?? c.USER}`}>{role}</span>
}

function StatusPill({ status }: { status: string }) {
  const c: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-800", SHIPPED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-yellow-100 text-yellow-800", PENDING: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-800", REFUND_REQUESTED: "bg-red-100 text-red-800",
    REFUNDED: "bg-red-100 text-red-800", CONFIRMED: "bg-green-100 text-green-800",
  }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c[status] ?? c.PENDING}`}>{status.replace(/_/g, " ")}</span>
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState("overview")
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [adminUsers, setAdminUsers] = useState<User[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

  // Role modal
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null })
  const [selectedRole, setSelectedRole] = useState("")
  const [roleLoading, setRoleLoading] = useState(false)

  // Add admin modal
  const [addAdminModal, setAddAdminModal] = useState(false)
  const [adminEmailInput, setAdminEmailInput] = useState("")
  const [adminRoleInput, setAdminRoleInput] = useState("ADMIN")
  const [foundUser, setFoundUser] = useState<User | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [addAdminLoading, setAddAdminLoading] = useState(false)

  // Order modal
  const [orderModal, setOrderModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null })
  const [newStatus, setNewStatus] = useState("")
  const [trackingNum, setTrackingNum] = useState("")
  const [adminNote, setAdminNote] = useState("")
  const [orderLoading, setOrderLoading] = useState(false)

  // Search/filter
  const [userSearch, setUserSearch] = useState("")
  const [orderSearch, setOrderSearch] = useState("")
  const [orderStatusFilter, setOrderStatusFilter] = useState("")

  function showToast(msg: string, type: "success" | "error" = "success") {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/login"); return }
    if (session.user.role !== "SUPER_ADMIN") { router.push("/dashboard"); return }
  }, [session, status])

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    if (tab === "users") fetchUsers()
    if (tab === "orders") fetchOrders()
    if (tab === "logs") fetchLogs()
    if (tab === "admins") fetchAdminUsers()
  }, [tab])

  useEffect(() => {
    const t = setTimeout(() => { if (tab === "users") fetchUsers() }, 400)
    return () => clearTimeout(t)
  }, [userSearch])

  useEffect(() => {
    const t = setTimeout(() => { if (tab === "orders") fetchOrders() }, 400)
    return () => clearTimeout(t)
  }, [orderSearch, orderStatusFilter])

  async function fetchStats() {
    const res = await fetch("/api/super-admin/stats")
    setStats(await res.json())
  }

  async function fetchUsers() {
    setLoading(true)
    const res = await fetch(`/api/super-admin/users?search=${userSearch}`)
    const data = await res.json()
    setUsers(data.users ?? [])
    setLoading(false)
  }

  async function fetchAdminUsers() {
    setLoading(true)
    const [r1, r2] = await Promise.all([
      fetch("/api/super-admin/users?role=ADMIN"),
      fetch("/api/super-admin/users?role=SUPER_ADMIN"),
    ])
    const [d1, d2] = await Promise.all([r1.json(), r2.json()])
    setAdminUsers([...(d2.users ?? []), ...(d1.users ?? [])])
    setLoading(false)
  }

  async function fetchOrders() {
    setLoading(true)
    const p = new URLSearchParams()
    if (orderSearch) p.set("search", orderSearch)
    if (orderStatusFilter) p.set("status", orderStatusFilter)
    const res = await fetch(`/api/super-admin/orders?${p}`)
    const data = await res.json()
    setOrders(data.orders ?? [])
    setLoading(false)
  }

  async function fetchLogs() {
    setLoading(true)
    const res = await fetch("/api/super-admin/admin-logs")
    const data = await res.json()
    setLogs(data.logs ?? [])
    setLoading(false)
  }

  // ── Role change ──────────────────────────────────────────
  function openRoleModal(user: User) {
    setRoleModal({ open: true, user })
    setSelectedRole(user.role)
  }

  async function saveRole() {
    if (!roleModal.user) return
    setRoleLoading(true)
    const res = await fetch(`/api/super-admin/users/${roleModal.user.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: selectedRole }),
    })
    setRoleLoading(false)
    if (res.ok) {
      setRoleModal({ open: false, user: null })
      showToast(`Role ${selectedRole} ho gayi!`)
      fetchUsers(); fetchAdminUsers(); fetchStats()
    } else {
      const e = await res.json()
      showToast(e.error, "error")
    }
  }

  // ── Add admin ────────────────────────────────────────────
  async function searchUserByEmail() {
    if (!adminEmailInput.trim()) return
    setSearchLoading(true)
    setFoundUser(null)
    const res = await fetch(`/api/super-admin/users?search=${adminEmailInput.trim()}`)
    const data = await res.json()
    const matched = (data.users ?? []).find(
      (u: User) => u.email.toLowerCase() === adminEmailInput.toLowerCase().trim()
    )
    if (matched) setFoundUser(matched)
    else showToast("Not Found Any User On This Email", "error")
    setSearchLoading(false)
  }

  async function confirmAddAdmin() {
    if (!foundUser) return
    setAddAdminLoading(true)
    const res = await fetch(`/api/super-admin/users/${foundUser.id}/role`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: adminRoleInput }),
    })
    setAddAdminLoading(false)
    if (res.ok) {
      setAddAdminModal(false)
      setAdminEmailInput(""); setFoundUser(null); setAdminRoleInput("ADMIN")
      showToast(`${foundUser.name ?? foundUser.email} ab ${adminRoleInput} hai!`)
      fetchAdminUsers(); fetchStats()
    } else {
      const e = await res.json()
      showToast(e.error, "error")
    }
  }

  function closeAddAdminModal() {
    setAddAdminModal(false)
    setAdminEmailInput(""); setFoundUser(null); setAdminRoleInput("ADMIN")
  }

  // ── Order update ─────────────────────────────────────────
  function openOrderModal(order: Order) {
    setOrderModal({ open: true, order })
    setNewStatus(order.status); setTrackingNum(""); setAdminNote("")
  }

  async function saveOrder() {
    if (!orderModal.order) return
    setOrderLoading(true)
    const res = await fetch(`/api/super-admin/orders/${orderModal.order.id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus, trackingNumber: trackingNum, adminNote }),
    })
    setOrderLoading(false)
    if (res.ok) {
      setOrderModal({ open: false, order: null })
      showToast("Order updated!")
      fetchOrders()
    } else {
      const e = await res.json()
      showToast(e.error, "error")
    }
  }

  if (status === "loading" || !session) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500 text-sm">Loading...</p></div>
  }

  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "orders",   label: "Orders" },
    { key: "users",    label: "Users" },
    { key: "admins",   label: "Admin mgmt" },
    { key: "logs",     label: "Admin logs" },
    { key: "revenue",  label: "Revenue" },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-4 py-3 rounded-lg text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col min-h-screen">
        <div className="p-4 border-b border-gray-100">
          <p className="font-medium text-sm">Super Admin</p>
          <p className="text-xs text-gray-500 mt-0.5 truncate">{session.user.email}</p>
        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => setTab(item.key)}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${tab === item.key ? "bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600" : "text-gray-600 hover:bg-gray-50"}`}>
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-xs text-red-500 hover:text-red-700">Logout</button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 overflow-auto">

        {/* ── OVERVIEW ── */}
        {tab === "overview" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-medium">Dashboard</h1>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">SUPER_ADMIN</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Total revenue",   value: stats ? formatAmount(stats.totalRevenue) : "—" },
                { label: "Total orders",    value: stats?.totalOrders.toLocaleString() ?? "—" },
                { label: "Total users",     value: stats?.totalUsers.toLocaleString()  ?? "—" },
                { label: "Products active", value: stats?.totalProducts.toLocaleString() ?? "—" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className="text-2xl font-medium">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Pending orders",      value: stats?.pendingOrders      ?? "—", warn: true },
                { label: "Refund requests",      value: stats?.refundOrders       ?? "—", warn: true },
                { label: "New users this month", value: stats?.newUsersThisMonth  ?? "—", warn: false },
                { label: "Total admins",         value: stats?.totalAdmins        ?? "—", warn: false },
                { label: "Out of stock",         value: stats?.outOfStock         ?? "—", warn: true },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                  <p className={`text-2xl font-medium ${s.warn && Number(s.value) > 0 ? "text-red-600" : ""}`}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── USERS ── */}
        {tab === "users" && (
          <div>
            <h1 className="text-xl font-medium mb-4">User management</h1>
            <input type="text" placeholder="Search by name or email..." value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="w-full max-w-sm border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 bg-white" />
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {["User","Email","Role","Orders","Status","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Not Found Any user</td></tr>
                  ) : users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm">{user.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{user.email}</td>
                      <td className="px-4 py-3"><RolePill role={user.role} /></td>
                      <td className="px-4 py-3 text-sm">{user._count.orders}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {user.isActive ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {user.id === session.user.id ? (
                          <span className="text-xs text-gray-400">You</span>
                        ) : (
                          <button onClick={() => openRoleModal(user)}
                            className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors font-medium">
                            Change role
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ADMINS ── */}
        {tab === "admins" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-medium">Admin management</h1>
              {/* ✅ FIX: setAddAdminModal(true) — modal khulta hai ab */}
              <button onClick={() => setAddAdminModal(true)}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                + Add admin
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {["Admin","Email","Role","Joined","Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                  ) : adminUsers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Not found any Admin</td></tr>
                  ) : adminUsers.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm">{admin.name ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{admin.email}</td>
                      <td className="px-4 py-3"><RolePill role={admin.role} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500">{new Date(admin.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {admin.id === session.user.id ? (
                          <span className="text-xs text-gray-400">You (owner)</span>
                        ) : (
                          <div className="flex gap-2">
                            {/* ✅ FIX: Change role button admins tab mein bhi */}
                            <button onClick={() => openRoleModal(admin)}
                              className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors">
                              Change role
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`${admin.name ?? admin.email} ko USER banao?`)) return
                                const res = await fetch(`/api/super-admin/users/${admin.id}/role`, {
                                  method: "PATCH", headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ role: "USER" }),
                                })
                                if (res.ok) { showToast(`Demoted to USER`); fetchAdminUsers(); fetchStats() }
                              }}
                              className="text-xs border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors">
                              Demote
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── ORDERS ── */}
        {tab === "orders" && (
          <div>
            <h1 className="text-xl font-medium mb-4">All orders</h1>
            <div className="flex gap-3 mb-4 flex-wrap">
              <input type="text" placeholder="Search order # ya customer..." value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px] bg-white" />
              <select value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="">All statuses</option>
                {["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REFUND_REQUESTED","REFUNDED"].map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {["Order #","Customer","Items","Amount","Status","Date","Action"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                  ) : orders.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-10 text-gray-400 text-sm">Not found any order</td></tr>
                  ) : orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.orderNumber}</td>
                      <td className="px-4 py-3 text-sm">{order.user.name ?? order.user.email}</td>
                      <td className="px-4 py-3 text-sm">{order.items.length}</td>
                      <td className="px-4 py-3 font-medium text-sm">{formatAmount(order.totalAmount)}</td>
                      <td className="px-4 py-3"><StatusPill status={order.status} /></td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openOrderModal(order)}
                          className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors font-medium">
                          Manage
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── LOGS ── */}
        {tab === "logs" && (
          <div>
            <h1 className="text-xl font-medium mb-4">Admin activity logs</h1>
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    {["Time","Admin","Action","Entity","Details"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Loading...</td></tr>
                  ) : logs.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Not found any log </td></tr>
                  ) : logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-xs text-gray-400 font-mono">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm">{log.admin.name ?? log.admin.email}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">{log.action}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{log.entityType}</td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                        {typeof log.details === "object" ? JSON.stringify(log.details) : String(log.details ?? "")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── REVENUE ── */}
        {tab === "revenue" && (
          <div>
            <h1 className="text-xl font-medium mb-4">Revenue analytics</h1>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total revenue",   value: formatAmount(stats.totalRevenue) },
                  { label: "Total orders",    value: stats.totalOrders.toLocaleString() },
                  { label: "Pending orders",  value: stats.pendingOrders.toString() },
                  { label: "Refund requests", value: stats.refundOrders.toString() },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-2xl font-medium">{s.value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ════════ MODALS ════════ */}

      {/* ✅ Change Role Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[340px] shadow-2xl">
            <h2 className="font-medium text-base mb-1">Change role</h2>
            <p className="text-xs text-gray-500 mb-4">{roleModal.user?.name ?? roleModal.user?.email}</p>
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-1">Current role</p>
              <RolePill role={roleModal.user?.role ?? ""} />
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 block mb-1">New role</label>
              <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option value="USER">USER — Normal customer</option>
                <option value="ADMIN">ADMIN — Manage Products/Orders</option>
                <option value="SUPER_ADMIN">SUPER_ADMIN — Full access</option>
              </select>
            </div>
            {selectedRole === "SUPER_ADMIN" && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-700">⚠️ SUPER_ADMIN will get full access!</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setRoleModal({ open: false, user: null })}
                className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveRole} disabled={roleLoading || selectedRole === roleModal.user?.role}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {roleLoading ? "Saving..." : "Save karo"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Add Admin Modal */}
      {addAdminModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[400px] shadow-2xl">
            <h2 className="font-medium text-base mb-1">Add new admin</h2>
            <p className="text-xs text-gray-500 mb-4">Find user with email then assign role to them</p>
            <div className="mb-3">
              <label className="text-xs text-gray-500 block mb-1">User email</label>
              <div className="flex gap-2">
                <input type="email" value={adminEmailInput}
                  onChange={(e) => { setAdminEmailInput(e.target.value); setFoundUser(null) }}
                  onKeyDown={(e) => e.key === "Enter" && searchUserByEmail()}
                  placeholder="user@example.com"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
                <button onClick={searchUserByEmail} disabled={searchLoading || !adminEmailInput.trim()}
                  className="text-sm bg-gray-700 text-white px-3 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition-colors">
                  {searchLoading ? "..." : "Search"}
                </button>
              </div>
            </div>
            {foundUser && (
              <>
                <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700 font-medium mb-1">✓ User Founded!</p>
                  <p className="text-sm font-medium">{foundUser.name ?? "—"}</p>
                  <p className="text-xs text-gray-500">{foundUser.email}</p>
                  <div className="mt-1"><RolePill role={foundUser.role} /></div>
                </div>
                <div className="mb-4">
                  <label className="text-xs text-gray-500 block mb-1">Assign role</label>
                  <select value={adminRoleInput} onChange={(e) => setAdminRoleInput(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                </div>
              </>
            )}
            <div className="flex gap-2 justify-end mt-2">
              <button onClick={closeAddAdminModal}
                className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={confirmAddAdmin} disabled={!foundUser || addAdminLoading}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {addAdminLoading ? "Adding..." : "Make Admin"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Order Modal */}
      {orderModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[420px] shadow-2xl">
            <h2 className="font-medium text-base mb-1">Manage Order</h2>
            <p className="text-xs text-gray-500 mb-4 font-mono">{orderModal.order?.orderNumber}</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Update Status</label>
                <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  {["PENDING","CONFIRMED","PROCESSING","SHIPPED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED","REFUND_REQUESTED","REFUNDED"].map(s => (
                    <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Tracking number (optional)</label>
                <input type="text" value={trackingNum} onChange={(e) => setTrackingNum(e.target.value)}
                  placeholder="e.g. TCS-123456789"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Admin note (optional)</label>
                <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)}
                  rows={2} placeholder="Koi note likhna hai?"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none bg-white" />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setOrderModal({ open: false, order: null })}
                className="text-sm border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={saveOrder} disabled={orderLoading}
                className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {orderLoading ? "Updating..." : "Update karo"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}