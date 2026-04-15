"use client";

import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";

// ─── Icons ────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" />
    <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
  </svg>
);
const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path strokeLinecap="round" d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const ChevronDown = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);
const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────

type NavCategory = {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
};

type SearchProduct = {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  images: { url: string }[];
  category: { name: string };
};

// ─── Helper ───────────────────────────────────────────────────────────────────

const fmt = (cents: number) =>
  "Rs " + (cents / 100).toLocaleString("en-PK");

// ─── Header ───────────────────────────────────────────────────────────────────

export default function Header() {
  const { data: session } = useSession();
  const user = session?.user;
  const role = (user as any)?.role as string | undefined;

  // UI state
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  // Data state
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // ── Scroll ────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Resize → close mobile menu ────────────────────────────
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Search input focus ────────────────────────────────────
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // ── Click outside search box → hide results ───────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Fetch dynamic nav categories ─────────────────────────
  useEffect(() => {
    fetch("/api/nav/categories")
      .then((r) => r.json())
      .then((d) => setNavCategories(d.categories ?? []));
  }, []);

  // ── Fetch cart & wishlist counts  ────
  useEffect(() => {
    // ✅ Cart → always fetch (guest + user)
    fetch("/api/user/cart/count")
      .then((r) => r.json())
      .then((d) => setCartCount(d.count ?? 0))
      .catch(() => setCartCount(0));

    // ❗ Wishlist → sirf logged-in user
    if (user) {
      fetch("/api/user/wishlist/count")
        .then((r) => r.json())
        .then((d) => setWishlistCount(d.count ?? 0))
        .catch(() => setWishlistCount(0));
    } else {
      setWishlistCount(0);
    }
  }, [user]);

  // ── Debounced search ──────────────────────────────────────
  const handleSearchChange = useCallback((q: string) => {
    setSearchQuery(q);
    if (searchDebounce.current) clearTimeout(searchDebounce.current);

    if (q.trim().length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    searchDebounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setSearchResults(data.products ?? []);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
  }, []);

  const closeSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  // ── Dropdown hover helpers ────────────────────────────────
  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };
  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-[#3f554f] text-white text-center text-xs py-2 px-4 font-medium tracking-widest uppercase">
        🎉 Free Shipping on orders above Rs.&nbsp;10,000 &nbsp;|&nbsp; Code{" "}
        <span className="underline underline-offset-2 font-bold cursor-pointer hover:text-yellow-200 transition">
          DANIFESH10
        </span>{" "}
        for 10% off
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${scrolled ? "shadow-md" : "border-b border-gray-100"
          }`}
      >
        {/* ── Search Overlay ─────────────────────────────────── */}
        {searchOpen && (
          <div className="absolute inset-0 z-50 bg-white flex flex-col border-b border-gray-200">
            {/* Input row */}
            <div className="flex items-center px-6 gap-4 h-16">
              <span className="text-gray-400 shrink-0"><SearchIcon /></span>
              <div ref={searchBoxRef} className="flex-1 relative">
                <input
                  ref={searchRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search for products, brands or categories…"
                  className="w-full text-base outline-none text-gray-800 placeholder-gray-400"
                />

                {/* Results Dropdown */}
                {showResults && (
                  <div className="absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-50">
                    {searchLoading ? (
                      <div className="px-5 py-4 text-sm text-gray-400">Searching…</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-5 py-4 text-sm text-gray-400">
                        No products found for &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <>
                        <p className="px-5 pt-3 pb-1 text-[10px] uppercase tracking-widest font-bold text-[#3f554f]">
                          Products
                        </p>
                        {searchResults.map((p) => (
                          <a
                            key={p.id}
                            href={`/products/${p.slug}`}
                            onClick={closeSearch}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f5f3] transition group"
                          >
                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {p.images[0] ? (
                                <Image
                                  src={p.images[0].url}
                                  alt={p.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-200" />
                              )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-[#3f554f] transition">
                                {p.name}
                              </p>
                              <p className="text-xs text-gray-400">{p.category.name}</p>
                            </div>
                            {/* Price */}
                            <p className="text-sm font-bold text-[#3f554f] shrink-0">
                              {fmt(p.basePrice)}
                            </p>
                          </a>
                        ))}
                        {/* View all link */}
                        <div className="border-t border-gray-100">
                          <a
                            href={`/search?q=${encodeURIComponent(searchQuery)}`}
                            onClick={closeSearch}
                            className="flex items-center justify-center gap-1 py-3 text-xs font-semibold text-[#3f554f] hover:bg-[#f0f5f3] transition"
                          >
                            View all results for &quot;{searchQuery}&quot; →
                          </a>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <button onClick={closeSearch} className="text-gray-400 hover:text-gray-700 transition shrink-0">
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        {/* ── Top Bar ────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <Image src="/logo.png" height={100} width={100} alt="logo" />
            <span className="text-4xl font-bold tracking-tight text-[#3f554f] uppercase">
              Danifesh
            </span>
          </a>

          {/* ── Desktop Nav ──────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5">

            {/* Home */}
            <a
              href="/"
              className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:text-[#3f554f] hover:bg-[#f0f5f3] transition-colors duration-150"
            >
              Home
            </a>

            {/* Categories Mega Menu */}
            {navCategories.length > 0 && (
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter("__mega__")}
                onMouseLeave={handleMouseLeave}
              >
                <button
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-150 ${activeDropdown === "__mega__"
                    ? "text-[#3f554f] bg-[#f0f5f3]"
                    : "text-gray-700 hover:text-[#3f554f] hover:bg-[#f0f5f3]"
                    }`}
                >
                  Categories
                  <span className={`transition-transform duration-200 ${activeDropdown === "__mega__" ? "rotate-180" : ""}`}>
                    <ChevronDown />
                  </span>
                </button>

                {activeDropdown === "__mega__" && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
                    onMouseEnter={() => handleMouseEnter("__mega__")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xl"
                      style={{ minWidth: `${Math.min(navCategories.length, 5) * 200}px`, maxWidth: "900px" }}
                    >

                      {/* Top strip */}
                      <div className="bg-[#3f554f] px-6 py-3 flex items-center justify-between">
                        <span className="text-white text-[11px] font-bold tracking-widest uppercase">
                          All Categories
                        </span>

                        <a
                          href="/shop"
                          className="text-white/80 hover:text-white text-xs font-semibold transition"
                        >
                          View entire shop →
                        </a>
                      </div>

                      {/* Columns */}
                      <div
                        className="grid p-3 gap-0"
                        style={{
                          gridTemplateColumns: `repeat(4, 1fr)`,
                        }}
                      >
                        {navCategories.map((cat, i) => (
                          <div
                            key={cat.id}
                            className={`px-3 py-3 ${i < navCategories.length - 1 ? "border-r border-gray-100" : ""
                              }`}
                          >
                            {/* Parent */}
                            <a
                              href={`/category/${cat.slug}`}
                              className="flex items-center gap-1.5 text-[13px] font-bold text-[#3f554f] mb-3 px-2 py-1.5 rounded-lg hover:bg-[#f0f5f3] transition"
                            >
                              {cat.name}
                            </a>

                            {/* Children */}
                            {
                              cat.children.length > 0 ? (
                                <>
                                  <ul className="space-y-0.5">
                                    {cat.children.map((child) => (
                                      <li key={child.id}>
                                        <a
                                          href={`/category/${cat.slug}/${child.slug}`}
                                          className="block text-[12.5px] text-gray-500 px-2 py-1.5 rounded-lg hover:text-[#3f554f] hover:bg-[#f0f5f3] transition"
                                        >
                                          {child.name}
                                        </a>
                                      </li>
                                    ))}
                                  </ul>

                                  <a
                                    href={`/category/${cat.slug}`}
                                    className="block mt-2 px-2 text-[11px] font-semibold text-[#3f554f] hover:underline"
                                  >
                                    View all →
                                  </a>
                                </>
                              ) : (
                                <p className="px-2 text-[12px] text-gray-400 italic">
                                  
                                </p>
                              )}
                          </div>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="border-t border-gray-100 bg-gray-50 px-5 py-2.5 flex items-center gap-2">
                        <a href="/shop?filter=new" className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f0f5f3] text-[#3f554f] border border-[#d1e0da] hover:bg-[#3f554f] hover:text-white transition">
                          New Arrivals
                        </a>
                        <a href="/shop?filter=bestseller" className="px-3 py-1 rounded-full text-[11px] font-semibold bg-[#f0f5f3] text-[#3f554f] border border-[#d1e0da] hover:bg-[#3f554f] hover:text-white transition">
                          Best Sellers
                        </a>
                        <a href="/salesoff" className="px-3 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-500 hover:text-white transition">
                          Sale 50% Off
                        </a>
                      </div>

                    </div>
                  </div >
                )
                }
              </div >
            )}

            {/* Sale */}
            <a
              href="/shop"
              className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-rose-600 hover:bg-rose-50 transition-colors duration-150"
            >
              Sale
              <span className="ml-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                50% Off
              </span>
            </a>

            {/* Contact */}
            <a
              href="/contact"
              className="flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg text-gray-700 hover:text-[#3f554f] hover:bg-[#f0f5f3] transition-colors duration-150"
            >
              Contact
            </a>

          </nav >

          {/* ── Right Icons ─────────────────────────────────── */}
          < div className="flex items-center gap-1" >

            {/* Search Button */}
            < button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
            >
              <SearchIcon />
            </button >

            {/* Wishlist */}
            < a
              href="/wishlist"
              className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
            >
              <HeartIcon />
              {
                wishlistCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#3f554f] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {wishlistCount > 99 ? "99+" : wishlistCount}
                  </span>
                )
              }
            </a >

            {/* Account */}
            {
              user ? (
                <div
                  className="relative hidden md:flex items-center"
                  onMouseEnter={() => handleMouseEnter("user")}
                  onMouseLeave={handleMouseLeave}
                >
                  <button className="flex w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition">
                    <UserIcon />
                  </button>

                  {activeDropdown === "user" && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-100 rounded-2xl shadow-xl p-2 z-50">
                      <p className="px-3 py-2 text-xs text-gray-400 font-medium truncate">{user.name}</p>
                      <hr className="my-1 border-gray-100" />
                      {role === "USER" && (
                        <a href="/dashboard" className="block px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f5f3] hover:text-[#3f554f] rounded-xl transition">
                          Dashboard
                        </a>
                      )}
                      {role === "ADMIN" && (
                        <a href="/admin" className="block px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f5f3] hover:text-[#3f554f] rounded-xl transition">
                          Admin Panel
                        </a>
                      )}
                      {role === "SUPER_ADMIN" && (
                        <a href="/super-admin" className="block px-3 py-2 text-sm text-gray-700 hover:bg-[#f0f5f3] hover:text-[#3f554f] rounded-xl transition">
                          Super Admin
                        </a>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className="w-full text-left px-3 py-2 text-sm text-rose-500 hover:bg-rose-50 rounded-xl transition"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <a
                  href="/login"
                  className="hidden md:flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#3f554f] border border-[#3f554f] rounded-full hover:bg-[#f0f5f3] transition"
                >
                  <UserIcon /> Login
                </a>
              )
            }

            {/* Cart */}
            <a
              href="/cart"
              className="relative flex items-center gap-2 bg-[#3f554f] hover:bg-[#2f403b] active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all ml-1"
            >
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </a>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden ml-1 w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div >
        </div >

        {/* ── Mobile Drawer ──────────────────────────────────── */}
        {
          menuOpen && (
            <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-6 space-y-1 max-h-[80vh] overflow-y-auto">

              {/* Mobile Search */}
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 mt-4 mb-2">
                <span className="text-gray-400"><SearchIcon /></span>
                <input
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
                />
              </div>

              {/* Mobile search results */}
              {showResults && searchResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden mb-2">
                  {searchResults.map((p) => (
                    <a
                      key={p.id}
                      href={`/products/${p.slug}`}
                      onClick={() => { setMenuOpen(false); setShowResults(false); setSearchQuery(""); }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#f0f5f3] transition"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {p.images[0] ? (
                          <Image src={p.images[0].url} alt={p.name} width={40} height={40} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gray-200" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.category.name}</p>
                      </div>
                      <p className="text-sm font-bold text-[#3f554f] shrink-0">{fmt(p.basePrice)}</p>
                    </a>
                  ))}
                </div>
              )}

              {/* Home */}
              <a href="/" className="block w-full px-3 py-3 rounded-xl text-sm font-semibold text-gray-800 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition">
                Home
              </a>

              {/* Dynamic Categories */}
              {navCategories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() =>
                      cat.children.length > 0
                        ? setMobileExpanded(mobileExpanded === cat.slug ? null : cat.slug)
                        : (window.location.href = `/category/${cat.slug}`)
                    }
                    className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold text-gray-800 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
                  >
                    <span>{cat.name}</span>
                    {cat.children.length > 0 && (
                      <span className={`transition-transform duration-200 ${mobileExpanded === cat.slug ? "rotate-180" : ""}`}>
                        <ChevronDown />
                      </span>
                    )}
                  </button>

                  {cat.children.length > 0 && mobileExpanded === cat.slug && (
                    <div className="pl-3 pb-2 space-y-0.5">
                      {cat.children.map((child) => (
                        <a
                          key={child.id}
                          href={`/category/${cat.slug}/${child.slug}`}
                          className="block px-3 py-2 text-sm text-gray-600 hover:text-[#3f554f] rounded-xl hover:bg-[#f0f5f3] transition"
                        >
                          {child.name}
                        </a>
                      ))}
                      <a
                        href={`/category/${cat.slug}`}
                        className="block px-3 py-1.5 text-xs font-semibold text-[#3f554f] hover:underline"
                      >
                        View all →
                      </a>
                    </div>
                  )}
                </div>
              ))}

              {/* Static links */}
              <a href="/salesoff" className="flex items-center gap-2 px-3 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition">
                Sale
                <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">50% Off</span>
              </a>
              <a href="/contact" className="block px-3 py-3 rounded-xl text-sm font-semibold text-gray-800 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition">
                Contact
              </a>

              {/* Mobile Auth CTAs */}
              <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
                {user ? (
                  <>
                    {role === "USER" && (
                      <a href="/dashboard" className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                        <UserIcon /> Dashboard
                      </a>
                    )}
                    {role === "ADMIN" && (
                      <a href="/admin" className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                        <UserIcon /> Admin Panel
                      </a>
                    )}
                    {role === "SUPER_ADMIN" && (
                      <>
                        <a href="/admin" className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                          <UserIcon /> Admin Panel
                        </a>
                        <a href="/super-admin" className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                          <UserIcon /> Super Admin
                        </a>
                      </>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center justify-center gap-2 w-full border border-rose-400 text-rose-500 font-semibold py-2.5 rounded-xl hover:bg-rose-50 transition text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <a href="/login" className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                      <UserIcon /> Login
                    </a>
                    <a href="/register" className="flex items-center justify-center gap-2 w-full bg-[#3f554f] text-white font-semibold py-2.5 rounded-xl hover:bg-[#2f403b] transition text-sm">
                      Register
                    </a>
                  </>
                )}
              </div>
            </div>
          )
        }
      </header >
    </>
  );
}