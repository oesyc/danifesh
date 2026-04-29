"use client"
// src/app/register/page.tsx

import { useState, useRef, useEffect } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

type Step = "form" | "otp"

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep]         = useState<Step>("form")
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "" })
  const [otp, setOtp]           = useState(["", "", "", "", "", ""])
  const [error, setError]       = useState("")
  const [success, setSuccess]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const [showPass, setShowPass]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  function validate() {
    if (!formData.name.trim())                               return "Full name is required"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return "Please enter a valid email address"
    if (formData.password.length < 6)                        return "Password must be at least 6 characters"
    if (formData.password !== formData.confirmPassword)      return "Passwords do not match"
    return ""
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true); setError("")

    const res  = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, name: formData.name }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error); return }

    setStep("otp")
    setResendTimer(60)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  function handleOtpChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]; next[index] = value.slice(-1); setOtp(next)
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus()
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus() }
  }

  async function handleVerifyAndRegister(e: React.FormEvent) {
    e.preventDefault()
    const otpCode = otp.join("")
    if (otpCode.length < 6) { setError("Please enter the complete 6-digit code"); return }
    setLoading(true); setError("")

    const res  = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, otp: otpCode }),
    })
    const data = await res.json()

    if (!res.ok) {
      setLoading(false); setError(data.error)
      if (data.error?.toLowerCase().includes("otp") || data.error?.toLowerCase().includes("code")) {
        setOtp(["", "", "", "", "", ""]); otpRefs.current[0]?.focus()
      }
      return
    }

    const login = await signIn("credentials", {
      email: formData.email, password: formData.password, redirect: false,
    })
    setLoading(false)
    if (login?.ok) { router.push("/"); router.refresh() } else { router.push("/login") }
  }

  async function handleResend() {
    if (resendTimer > 0) return
    setLoading(true); setError("")
    const res = await fetch("/api/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: formData.email, name: formData.name }),
    })
    setLoading(false)
    if (res.ok) {
      setResendTimer(60); setSuccess("A new code has been sent.")
      setTimeout(() => setSuccess(""), 4000)
    } else {
      const d = await res.json(); setError(d.error)
    }
  }

  const inputBase =
    "w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-white " +
    "text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 " +
    "focus:ring-amber-400/40 focus:border-amber-400 transition-all duration-150"

  const EyeOpen = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
  const EyeOff = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )

  return (
    <div className="min-h-screen flex">

      {/* ══════════ LEFT BRAND PANEL ══════════ */}
      <div className="hidden lg:flex lg:w-[52%] bg-white flex-col justify-between relative overflow-hidden">

       <Image src="/registration.png" alt="registration" className="w-full h-full object-cover" height={400} width={400} />
      </div>

      {/* ══════════ RIGHT FORM PANEL ══════════ */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="text-slate-900 font-bold">ShopName</span>
          </div>

          {/* Step indicators */}
          <div className="flex items-center mb-8">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step === "form" ? "bg-[#3f554f] text-white" : "bg-emerald-500 text-white"}`}>
                {step === "otp" ? (
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : "1"}
              </div>
              <span className={`text-xs font-semibold ${step === "form" ? "text-slate-800" : "text-slate-400"}`}>
                Your Details
              </span>
            </div>

            <div className="flex-1 h-px bg-slate-200 mx-3" />

            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${step === "otp" ? "bg-[#3f554f] text-white" : "bg-slate-200 text-slate-400"}`}>
                2
              </div>
              <span className={`text-xs font-semibold ${step === "otp" ? "text-slate-800" : "text-slate-400"}`}>
                Verify Email
              </span>
            </div>
          </div>

          {/* ══ STEP 1: Form ══ */}
          {step === "form" && (
            <>
              <div className="mb-7">
                <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Create your account</h2>
                <p className="text-slate-500 text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="text-[#3f554f] font-semibold hover:text-amber-700 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-3 text-sm mb-5">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} className="space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input type="text" placeholder="John Smith" value={formData.name} required
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className={inputBase} />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input type="email" placeholder="john@example.com" value={formData.email} required
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      className={inputBase} />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input type={showPass ? "text" : "password"} placeholder="Minimum 6 characters" value={formData.password} required
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className={`${inputBase} pr-10`} />
                    <button type="button" onClick={() => setShowPass(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showPass ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <input type={showConfirm ? "text" : "password"} placeholder="Re-enter your password" value={formData.confirmPassword} required
                      onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className={`${inputBase} pr-10`} />
                    <button type="button" onClick={() => setShowConfirm(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                      {showConfirm ? <EyeOff /> : <EyeOpen />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full mt-1 py-3 rounded-lg bg-[#3f554f] hover:bg-amber-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-sm font-bold tracking-wide transition-all duration-150 hover:shadow-md hover:shadow-amber-300/40 flex items-center justify-center gap-2 cursor-pointer">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending verification code...
                    </>
                  ) : (
                    <>
                      Continue
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-slate-400 leading-relaxed">
                  By creating an account you agree to our{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-slate-600 transition-colors">Terms of Service</a>
                  {" "}and{" "}
                  <a href="#" className="underline underline-offset-2 hover:text-slate-600 transition-colors">Privacy Policy</a>
                </p>
              </form>
            </>
          )}

          {/* ══ STEP 2: OTP ══ */}
          {step === "otp" && (
            <>
              <button onClick={() => { setStep("form"); setError(""); setOtp(["","","","","",""]) }}
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-sm mb-6 transition-colors group">
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to details
              </button>

              <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-900 mb-1.5">Verify your email</h2>
                <p className="text-slate-500 text-sm">We sent a 6-digit code to</p>
              </div>

              {/* Email pill */}
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6">
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5 text-[#3f554f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-amber-800 text-sm font-semibold truncate">{formData.email}</span>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-3 text-sm mb-5">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              {success && (
                <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-3.5 py-3 text-sm mb-5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {success}
                </div>
              )}

              <form onSubmit={handleVerifyAndRegister}>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Enter verification code</p>

                {/* OTP boxes */}
                <div className="flex gap-1 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={[
                        "flex-1 h-11 w-0.5 rounded-xl border-2 text-center text-base font-bold",
                        "focus:outline-none transition-all duration-150 caret-amber-400",
                        digit
                          ? "border-amber-400 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-800 focus:border-amber-400 focus:bg-amber-50/30",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <button type="submit" disabled={loading || otp.join("").length < 6}
                  className="w-full py-3 rounded-lg bg-[#3f554f] hover:bg-amber-500 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-sm font-bold tracking-wide transition-all duration-150 hover:shadow-md hover:shadow-amber-300/40 flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Verifying...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Verify & Create Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 text-center space-y-1.5">
                <p className="text-sm text-slate-500">
                  Didn't receive the code?{" "}
                  {resendTimer > 0 ? (
                    <span className="text-slate-400">Resend in {resendTimer}s</span>
                  ) : (
                    <button onClick={handleResend} disabled={loading}
                      className="text-amber-600 font-semibold hover:text-amber-700 transition-colors disabled:opacity-50">
                      Resend code
                    </button>
                  )}
                </p>
                <p className="text-xs text-slate-400">
                  Check your spam or junk folder if you don't see it.
                </p>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  )
}