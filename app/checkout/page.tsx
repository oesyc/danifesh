"use client"

// src/app/checkout/page.tsx

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import Link from "next/link"

// ─── Types ────────────────────────────────────────────────────────────────────

type CartItem = {
  id: string
  quantity: number
  product: {
    id: string; name: string; slug: string
    basePrice: number; stock: number
    images: { url: string }[]
  }
  variant: {
    id: string; price: number | null; stock: number; imageUrl: string | null
    values: { value: string; option: { name: string } }[]
  } | null
}

type SavedAddress = {
  id: string; label: string | null
  firstName: string; lastName: string
  addressLine1: string; addressLine2: string | null
  city: string; state: string; postalCode: string; country: string
  phone: string | null
}

type FormData = {
  firstName: string; lastName: string; phone: string
  addressLine1: string; addressLine2: string
  city: string; state: string; postalCode: string; country: string
  saveAddress: boolean; customerNote: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (cents: number) => "Rs " + (cents / 100).toLocaleString("en-PK")

const PAKISTAN_CITIES = [
  "Karachi","Lahore","Faisalabad","Rawalpindi","Gujranwala","Peshawar",
  "Multan","Hyderabad","Islamabad","Quetta","Bahawalpur","Sargodha",
  "Sialkot","Sukkur","Larkana","Sheikhupura","Rahim Yar Khan","Jhang",
  "Dera Ghazi Khan","Gujrat","Sahiwal","Wah Cantonment","Mardan","Kasur",
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ n, label, active, done }: { n: number; label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
        done   ? "bg-[#3f554f] text-white" :
        active ? "bg-[#3f554f] text-white ring-4 ring-[#3f554f]/20" :
                 "bg-gray-100 text-gray-400"
      }`}>
        {done ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        ) : n}
      </div>
      <span className={`text-xs font-medium hidden sm:block ${active || done ? "text-[#3f554f]" : "text-gray-400"}`}>
        {label}
      </span>
    </div>
  )
}

// ─── Input component ──────────────────────────────────────────────────────────

function Field({
  label, name, value, onChange, required, placeholder, type = "text", half, error
}: {
  label: string; name: string; value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
  required?: boolean; placeholder?: string; type?: string; half?: boolean; error?: string
}) {
  return (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full px-4 py-3 rounded-xl border text-sm bg-white transition-all outline-none
          focus:border-[#3f554f] focus:ring-2 focus:ring-[#3f554f]/10
          ${error ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-gray-300"}`}
      />
      {error && <p className="text-xs text-rose-500 mt-1">{error}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const router   = useRouter()
  const { data: session, status } = useSession()
  const user     = session?.user

  const [step,          setStep]          = useState<1 | 2 | 3>(1) // 1=address, 2=review, 3=success
  const [cartItems,     setCartItems]     = useState<CartItem[]>([])
  const [cartLoading,   setCartLoading]   = useState(true)
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(null)
  const [placing,       setPlacing]       = useState(false)
  const [orderResult,   setOrderResult]   = useState<{ orderId: string; orderNumber: string } | null>(null)
  const [globalError,   setGlobalError]   = useState("")

  const [form, setForm] = useState<FormData>({
    firstName: "", lastName: "", phone: "",
    addressLine1: "", addressLine2: "",
    city: "", state: "", postalCode: "", country: "Pakistan",
    saveAddress: true, customerNote: "",
  })
  const [errors, setErrors] = useState<Partial<FormData>>({})

  // ── Auth redirect ────────────────────────────────────────
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/checkout")
    }
  }, [status, router])

  // ── Pre-fill from session ────────────────────────────────
  useEffect(() => {
    if (user?.name) {
      const parts = user.name.split(" ")
      setForm(f => ({
        ...f,
        firstName: parts[0] ?? "",
        lastName:  parts.slice(1).join(" ") ?? "",
      }))
    }
  }, [user])

  // ── Fetch cart ───────────────────────────────────────────
  const fetchCart = useCallback(async () => {
    setCartLoading(true)
    const res  = await fetch("/api/user/cart")
    const data = await res.json()
    setCartItems(data.items ?? [])
    setCartLoading(false)
  }, [])

  // ── Fetch saved addresses ────────────────────────────────
  const fetchAddresses = useCallback(async () => {
    if (!user) return
    const res  = await fetch("/api/user/addresses")
    const data = await res.json()
    if (data.addresses?.length > 0) {
      setSavedAddresses(data.addresses)
      const def = data.addresses.find((a: SavedAddress & { isDefault: boolean }) => a.isDefault)
      if (def) {
        setSelectedAddrId(def.id)
        fillFormFromAddress(def)
      }
    }
  }, [user])

  useEffect(() => { fetchCart() },     [fetchCart])
  useEffect(() => { fetchAddresses() }, [fetchAddresses])

  function fillFormFromAddress(addr: SavedAddress) {
    setForm(f => ({
      ...f,
      firstName:    addr.firstName,
      lastName:     addr.lastName,
      phone:        addr.phone ?? "",
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city:         addr.city,
      state:        addr.state,
      postalCode:   addr.postalCode,
      country:      addr.country,
    }))
  }

  // ── Form change ──────────────────────────────────────────
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }))
    if (errors[name as keyof FormData]) {
      setErrors(er => ({ ...er, [name]: "" }))
    }
  }

  // ── Validate step 1 ──────────────────────────────────────
  function validateAddress(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (!form.firstName.trim())    e.firstName    = "First name required"
    if (!form.lastName.trim())     e.lastName     = "Last name required"
    if (!form.phone.trim())        e.phone        = "Phone number required"
    if (!form.addressLine1.trim()) e.addressLine1 = "Address required"
    if (!form.city.trim())         e.city         = "City required"
    if (!form.state.trim())        e.state        = "Province required"
    if (!form.postalCode.trim())   e.postalCode   = "Postal code required"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Totals ───────────────────────────────────────────────
  const subtotal = cartItems.reduce((sum, item) => {
    const price = item.variant?.price ?? item.product.basePrice
    return sum + price * item.quantity
  }, 0)
  const shippingCost = subtotal >= 299900 ? 0 : 25000
  const totalAmount  = subtotal + shippingCost

  // ── Place order ──────────────────────────────────────────
  async function placeOrder() {
    setPlacing(true)
    setGlobalError("")
    try {
      const payload = {
        ...form,
        ...(selectedAddrId ? { addressId: selectedAddrId } : {}),
      }
      const res  = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.requiresLogin) { router.push("/login?redirect=/checkout"); return }
        setGlobalError(data.error ?? "Order place nahi hua")
        setPlacing(false)
        return
      }

      setOrderResult({ orderId: data.orderId, orderNumber: data.orderNumber })
      setStep(3)
      // Cart count update karo header mein
      window.dispatchEvent(new Event("cart-updated"))
    } catch {
      setGlobalError("Network error — dobara try karo")
      setPlacing(false)
    }
  }

  // ── Loading / auth guards ────────────────────────────────
  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#3f554f] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!cartLoading && cartItems.length === 0 && step !== 3) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#fafaf8]">
        <div className="w-20 h-20 rounded-full bg-[#e8f0ec] flex items-center justify-center text-4xl">🛒</div>
        <p className="text-xl font-bold text-gray-700">Cart is Empty</p>
        <p className="text-sm text-gray-400">Add some products and then proceed to checkout</p>
        <Link href="/" className="mt-2 px-6 py-2.5 bg-[#3f554f] text-white rounded-xl text-sm font-semibold hover:bg-[#2f403b] transition">
          Start Shopping
        </Link>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  //  STEP 3 — SUCCESS
  // ════════════════════════════════════════════════════════
  if (step === 3 && orderResult) {
    return (
      <div className="min-h-screen bg-[#fafaf8] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 max-w-md w-full text-center">
          {/* Animated checkmark */}
          <div className="w-20 h-20 rounded-full bg-[#e8f0ec] flex items-center justify-center mx-auto mb-5 animate-bounce-once">
            <svg className="w-10 h-10 text-[#3f554f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed successfully! 🎉</h1>
          <p className="text-gray-500 text-sm mb-6">
            Your order has been placed successfully. We will contact you shortly.
          </p>

          <div className="bg-[#f0f5f3] rounded-2xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order number</span>
              <span className="font-bold text-[#3f554f] font-mono">{orderResult.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment method</span>
              <span className="font-semibold text-gray-700">Cash on Delivery</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-gray-900">{fmt(totalAmount)}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-[#3f554f] hover:bg-[#2f403b] text-white rounded-xl font-semibold text-sm transition"
            >
              your order →
            </button>
            <Link
              href="/"
              className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ════════════════════════════════════════════════════════
  //  MAIN CHECKOUT LAYOUT
  // ════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#fafaf8]">

      {/* ── Top bar ──────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-[#3f554f] tracking-tight uppercase">
            Danifesh
          </Link>
          {/* Steps */}
          <div className="flex items-center gap-3 sm:gap-6">
            <StepDot n={1} label="Delivery"  active={step === 1} done={step > 1} />
            <div className="w-8 sm:w-12 h-px bg-gray-200" />
            <StepDot n={2} label="Review"    active={step === 2} done={step > 2} />
            <div className="w-8 sm:w-12 h-px bg-gray-200" />
            <StepDot n={3} label="Confirmed" active={step === 3} done={false}    />
          </div>
          <Link href="/cart" className="text-xs text-gray-400 hover:text-[#3f554f] transition hidden sm:block">
            ← Cart
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 xl:gap-6 items-start min-w-0">

          {/* ════ LEFT — Form / Review ═══════════════════════ */}
          <div>

            {/* ── STEP 1: Delivery Address ─────────────────── */}
            {step === 1 && (
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50">
                  <h2 className="font-bold text-gray-900 text-lg">Delivery Address</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Please provide your delivery address</p>
                </div>

                {/* Saved addresses */}
                {savedAddresses.length > 0 && (
                  <div className="px-6 pt-5">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Saved Addresses</p>
                    <div className="space-y-2 mb-5">
                      {savedAddresses.map((addr) => (
                        <button
                          key={addr.id}
                          onClick={() => { setSelectedAddrId(addr.id); fillFormFromAddress(addr) }}
                          className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                            selectedAddrId === addr.id
                              ? "border-[#3f554f] bg-[#f0f5f3]"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-800">
                              {addr.firstName} {addr.lastName}
                            </span>
                            {addr.label && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                                {addr.label}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-xs mt-0.5">
                            {addr.addressLine1}, {addr.city}, {addr.state}
                          </p>
                        </button>
                      ))}
                      <button
                        onClick={() => { setSelectedAddrId(null); setForm(f => ({ ...f, addressLine1: "", city: "", state: "", postalCode: "" })) }}
                        className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                          selectedAddrId === null
                            ? "border-[#3f554f] bg-[#f0f5f3]"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span className="font-semibold text-[#3f554f]">+ New Address</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Address form */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="First Name"  name="firstName"    value={form.firstName}    onChange={handleChange} required half error={errors.firstName} placeholder="Ali" />
                    <Field label="Last Name"   name="lastName"     value={form.lastName}     onChange={handleChange} required half error={errors.lastName}  placeholder="Hassan" />
                    <Field label="Phone"       name="phone"        value={form.phone}        onChange={handleChange} required       error={errors.phone}     placeholder="03XX-XXXXXXX" type="tel" />
                    <Field label="Address"     name="addressLine1" value={form.addressLine1} onChange={handleChange} required       error={errors.addressLine1} placeholder="Ghar / mohalla / gali number" />
                    <Field label="Address 2 (optional)" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Flat, floor, landmark..." />

                    {/* City dropdown */}
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        City<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="city" value={form.city} onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none transition-all
                          focus:border-[#3f554f] focus:ring-2 focus:ring-[#3f554f]/10
                          ${errors.city ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <option value="">Select City</option>
                        {PAKISTAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="other">Other</option>
                      </select>
                      {form.city === "other" && (
                        <input
                          name="city" value={form.city === "other" ? "" : form.city}
                          onChange={handleChange} placeholder="Apna city likho"
                          className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#3f554f]"
                        />
                      )}
                      {errors.city && <p className="text-xs text-rose-500 mt-1">{errors.city}</p>}
                    </div>

                    {/* Province */}
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Province<span className="text-rose-500 ml-0.5">*</span>
                      </label>
                      <select
                        name="state" value={form.state} onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl border text-sm bg-white outline-none transition-all
                          focus:border-[#3f554f] focus:ring-2 focus:ring-[#3f554f]/10
                          ${errors.state ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-gray-300"}`}
                      >
                        <option value="">Select Province</option>
                        {["Punjab","Sindh","KPK","Balochistan","Gilgit-Baltistan","AJK","Islamabad (ICT)"].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                      {errors.state && <p className="text-xs text-rose-500 mt-1">{errors.state}</p>}
                    </div>

                    <Field label="Postal Code" name="postalCode" value={form.postalCode} onChange={handleChange} required half error={errors.postalCode} placeholder="54000" />

                    {/* Country — fixed Pakistan */}
                    <div className="col-span-1">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Country</label>
                      <div className="px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 flex items-center gap-2">
                        🇵🇰 Pakistan
                      </div>
                    </div>

                    {/* Note */}
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Order Note (optional)
                      </label>
                      <textarea
                        name="customerNote" value={form.customerNote} onChange={handleChange}
                        rows={2} placeholder="Koi khaas instructions..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm outline-none focus:border-[#3f554f] focus:ring-2 focus:ring-[#3f554f]/10 resize-none"
                      />
                    </div>

                    {/* Save address checkbox */}
                    {!selectedAddrId && (
                      <div className="col-span-2 flex items-center gap-2.5">
                        <input
                          id="saveAddress" type="checkbox" name="saveAddress"
                          checked={form.saveAddress} onChange={handleChange}
                          className="w-4 h-4 accent-[#3f554f] rounded"
                        />
                        <label htmlFor="saveAddress" className="text-sm text-gray-600 cursor-pointer">
                          Save this address for future use
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <button
                    onClick={() => { if (validateAddress()) setStep(2) }}
                    className="w-full py-3.5 bg-[#3f554f] hover:bg-[#2f403b] active:scale-[0.99] text-white font-bold rounded-xl text-sm transition-all"
                  >
                    Continue to Review →
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Review & Place ────────────────────── */}
            {step === 2 && (
              <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                {/* Delivery summary */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-bold text-gray-900">Delivery Address</h2>
                    <button onClick={() => setStep(1)} className="text-xs text-[#3f554f] hover:underline font-semibold">
                      Edit
                    </button>
                  </div>
                  <div className="text-sm text-gray-600 leading-relaxed">
                    <p className="font-semibold text-gray-800">{form.firstName} {form.lastName}</p>
                    <p>{form.addressLine1}{form.addressLine2 ? `, ${form.addressLine2}` : ""}</p>
                    <p>{form.city}, {form.state} {form.postalCode}</p>
                    <p>Pakistan</p>
                    <p className="text-[#3f554f] font-medium mt-1">📞 {form.phone}</p>
                  </div>
                </div>

                {/* Payment method */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-3">Payment Method</h2>
                  <div className="flex items-center gap-3 px-4 py-3 bg-[#f0f5f3] border-2 border-[#3f554f] rounded-xl">
                    <span className="text-2xl">💵</span>
                    <div>
                      <p className="text-sm font-bold text-[#3f554f]">Cash on Delivery (COD)</p>
                      <p className="text-xs text-gray-500">Pay when you receive the order</p>
                    </div>
                    <div className="ml-auto w-5 h-5 rounded-full bg-[#3f554f] flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Items review */}
                <div className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h2 className="font-bold text-gray-900 mb-4">Order Items ({cartItems.length})</h2>
                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const price = item.variant?.price ?? item.product.basePrice
                      const img   = item.variant?.imageUrl ?? item.product.images[0]?.url
                      const vInfo = item.variant?.values.map(v => v.value).join(" / ")
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0 relative">
                            {img ? (
                              <Image src={img} alt={item.product.name} fill className="object-cover" sizes="56px" />
                            ) : (
                              <div className="w-full h-full bg-gray-200" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{item.product.name}</p>
                            {vInfo && <p className="text-xs text-gray-400">{vInfo}</p>}
                            <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-bold text-[#3f554f] shrink-0">{fmt(price * item.quantity)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {globalError && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium">
                    ✕ {globalError}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={placing}
                  className="w-full py-4 bg-[#3f554f] hover:bg-[#2f403b] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-all flex items-center justify-center gap-2"
                >
                  {placing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing order ...
                    </>
                  ) : (
                    <>🛒 Place Order — {fmt(totalAmount)}</>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400">
                  By placing your order, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-[#3f554f]">Terms & Conditions</Link>{" "}
                  
                </p>
              </div>
            )}
          </div>

          {/* ════ RIGHT — Order Summary ═══════════════════════ */}
          <div className="lg:sticky lg:top-20 self-start">
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h3 className="font-bold text-gray-900">Order Summary</h3>
              </div>

              {/* Items */}
              <div className="px-5 py-3 space-y-3 max-h-64 overflow-y-auto">
                {cartLoading ? (
                  <p className="text-sm text-gray-400 py-2">Loading...</p>
                ) : cartItems.map((item) => {
                  const price = item.variant?.price ?? item.product.basePrice
                  const img   = item.variant?.imageUrl ?? item.product.images[0]?.url
                  const vInfo = item.variant?.values.map(v => v.value).join(" / ")
                  return (
                    <div key={item.id} className="flex items-center gap-2.5">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {img ? (
                          <Image src={img} alt={item.product.name} fill className="object-cover" sizes="48px" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                        {/* Qty badge */}
                        <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#3f554f] text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-700 truncate">{item.product.name}</p>
                        {vInfo && <p className="text-[10px] text-gray-400">{vInfo}</p>}
                      </div>
                      <p className="text-xs font-bold text-gray-800 shrink-0">{fmt(price * item.quantity)}</p>
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="px-5 py-4 border-t border-gray-50 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-medium text-gray-800">{fmt(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-600 font-semibold">Free! 🎉</span>
                  ) : (
                    <span className="font-medium text-gray-800">{fmt(shippingCost)}</span>
                  )}
                </div>
                {shippingCost > 0 && (
                  <p className="text-[10px] text-gray-400 bg-[#f0f5f3] px-3 py-1.5 rounded-lg">
                    💡 Shipping will be free above Rs 10,0000!
                  </p>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-bold text-[#3f554f] text-lg">{fmt(totalAmount)}</span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="px-5 pb-5 space-y-2">
                {[
                  { icon: "🔒", text: "Secure checkout" },
                  { icon: "🚚", text: "2-5 din mein delivery" },
                  { icon: "↩️", text: "7-din return policy" },
                ].map(b => (
                  <div key={b.text} className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{b.icon}</span>
                    <span>{b.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}