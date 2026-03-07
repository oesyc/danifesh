"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";

// ─── Icons (inline SVG — no extra dependencies needed) ────────────────────────
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
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

// ─── Nav Data ─────────────────────────────────────────────────────────────────
type MegaMenu = {
  sections: { title: string; items: string[] }[];
  featured: { label: string; tag: string };
};

type NavLink = {
  label: string;
  href: string;
  badge?: string;
  mega?: MegaMenu;
};

const navLinks: NavLink[] = [
  { label: "Home", href: "#" },
  {
    label: "Men",
    href: "#",
    mega: {
      sections: [
        { title: "Clothing", items: ["T-Shirts", "Shirts", "Trousers", "Jackets", "Suits"] },
        { title: "Footwear", items: ["Sneakers", "Loafers", "Boots", "Sandals"] },
        { title: "Accessories", items: ["Watches", "Belts", "Wallets", "Sunglasses"] },
      ],
      featured: { label: "New Arrivals", tag: "Just In" },
    },
  },
  {
    label: "Women",
    href: "#",
    mega: {
      sections: [
        { title: "Clothing", items: ["Dresses", "Tops", "Trousers", "Abayas", "Kurtis"] },
        { title: "Footwear", items: ["Heels", "Flats", "Sneakers", "Mules"] },
        { title: "Accessories", items: ["Bags", "Jewelry", "Scarves", "Sunglasses"] },
      ],
      featured: { label: "Summer Edit", tag: "Trending" },
    },
  },
  {
    label: "Collections",
    href: "#",
    mega: {
      sections: [
        { title: "Season", items: ["Spring / Summer", "Fall / Winter", "Resort"] },
        { title: "Occasion", items: ["Casual", "Formal", "Wedding", "Activewear"] },
        { title: "Brand Story", items: ["About Danifesh", "Sustainability", "Lookbook"] },
      ],
      featured: { label: "Eid Collection", tag: "Limited" },
    },
  },
  { label: "Sale", href: "#", badge: "50% Off" },
  { label: "Contact", href: "#" },
];

// ─── Main Component ────────────────────────────────────────────────────────────
export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Example state — replace with real cart/wishlist context
  const cartCount = 3;
  const wishlistCount = 5;

  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sticky shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Auto-focus search input
  useEffect(() => {
    if (searchOpen) searchRef.current?.focus();
  }, [searchOpen]);

  // Close mobile menu on viewport resize
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMenuOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleMouseEnter = (label: string) => {
    if (dropdownTimeout.current) clearTimeout(dropdownTimeout.current);
    setActiveDropdown(label);
  };
  const handleMouseLeave = () => {
    dropdownTimeout.current = setTimeout(() => setActiveDropdown(null), 150);
  };

  return (
    <>
      {/* ── 1. Announcement Bar ───────────────────────────────────────────── */}
      <div className="bg-[#3f554f] text-white text-center text-xs py-2 px-4 font-medium tracking-widest uppercase">
        🎉 Free Shipping on orders above Rs.&nbsp;2,999 &nbsp;|&nbsp; Code{" "}
        <span className="underline underline-offset-2 font-bold cursor-pointer hover:text-yellow-200 transition">
          DANIFESH10
        </span>{" "}
        for 10% off
      </div>

      {/* ── 2. Main Header ────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : "border-b border-gray-100"
        }`}
      >
        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute inset-0 z-50 bg-white flex items-center px-6 gap-4 h-full border-b border-gray-200">
            <span className="text-gray-400"><SearchIcon /></span>
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for products, brands or categories…"
              className="flex-1 text-base outline-none text-gray-800 placeholder-gray-400"
            />
            <button
              onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
              className="text-gray-400 hover:text-gray-700 transition"
              aria-label="Close search"
            >
              <CloseIcon />
            </button>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-16 gap-4">

          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <a href="#" className="flex items-center gap-2 shrink-0 group">
            {/*
              Replace the placeholder div below with your actual image:
              <Image src="/logo.png" width={36} height={36} alt="Danifesh logo" />
            */}
            <Image src={'/logo.png'} height={100} width={100} alt="logo">
              
            </Image>
            <span className="text-4xl font-bold tracking-tight text-[#3f554f] uppercase ml-[-10]">
              Danifesh
            </span>
          </a>

          {/* ── Desktop Navigation ───────────────────────────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <div
                key={link.label}
                className="relative"
                onMouseEnter={() => link.mega && handleMouseEnter(link.label)}
                onMouseLeave={handleMouseLeave}
              >
                <a
                  href={link.href}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-150
                    ${link.label === "Sale"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-gray-700 hover:text-[#3f554f] hover:bg-[#f0f5f3]"
                    }`}
                >
                  {link.label}
                  {link.badge && (
                    <span className="ml-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                      {link.badge}
                    </span>
                  )}
                  {link.mega && (
                    <span className={`transition-transform duration-200 ${activeDropdown === link.label ? "rotate-180" : ""}`}>
                      <ChevronDown />
                    </span>
                  )}
                </a>

                {/* Mega Menu Dropdown */}
                {link.mega && activeDropdown === link.label && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-160 bg-white border border-gray-100 rounded-2xl shadow-2xl p-6 grid grid-cols-4 gap-4"
                    onMouseEnter={() => handleMouseEnter(link.label)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {link.mega.sections.map((sec) => (
                      <div key={sec.title}>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#3f554f] mb-3">
                          {sec.title}
                        </p>
                        <ul className="space-y-2">
                          {sec.items.map((item) => (
                            <li key={item}>
                              <a
                                href="#"
                                className="text-sm text-gray-600 hover:text-[#3f554f] hover:translate-x-0.5 inline-block transition-all duration-150"
                              >
                                {item}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Featured Promo Card */}
                    <div className="bg-[#f0f5f3] rounded-xl p-4 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#3f554f] bg-[#d4e4de] px-2 py-0.5 rounded-full">
                          {link.mega.featured.tag}
                        </span>
                        <p className="mt-2 font-bold text-[#3f554f] text-sm leading-tight">
                          {link.mega.featured.label}
                        </p>
                      </div>
                      <a href="#" className="mt-4 text-xs font-semibold text-[#3f554f] underline underline-offset-2 hover:text-[#2f403b] transition">
                        Shop Now →
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* ── Right Action Icons ───────────────────────────────────────── */}
          <div className="flex items-center gap-1">

            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
              aria-label="Open search"
            >
              <SearchIcon />
            </button>

            {/* Wishlist */}
            <button
              className="hidden md:flex relative w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
              aria-label="Wishlist"
            >
              <HeartIcon />
              {wishlistCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[#3f554f] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Account */}
            <button
              className="hidden md:flex w-9 h-9 items-center justify-center rounded-full text-gray-600 hover:bg-[#f0f5f3] hover:text-[#3f554f] transition"
              aria-label="My Account"
            >
              <UserIcon />
            </button>

            {/* Cart CTA */}
            <button className="relative flex items-center gap-2 bg-[#3f554f] hover:bg-[#2f403b] active:scale-95 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all ml-1">
              <CartIcon />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden ml-1 w-9 h-9 flex items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition"
              aria-label="Toggle menu"
            >
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>

        {/* ── 3. Mobile Drawer ─────────────────────────────────────────────── */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-6 space-y-1 max-h-[80vh] overflow-y-auto">

            {/* Mobile Search Bar */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 mt-4 mb-2">
              <span className="text-gray-400"><SearchIcon /></span>
              <input
                placeholder="Search products…"
                className="flex-1 bg-transparent text-sm outline-none placeholder-gray-400"
              />
            </div>

            {navLinks.map((link) => (
              <div key={link.label}>
                <button
                  onClick={() =>
                    link.mega
                      ? setMobileExpanded(mobileExpanded === link.label ? null : link.label)
                      : undefined
                  }
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-xl text-sm font-semibold transition
                    ${link.label === "Sale" ? "text-rose-600" : "text-gray-800 hover:bg-[#f0f5f3] hover:text-[#3f554f]"}`}
                >
                  <span className="flex items-center gap-2">
                    {link.label}
                    {link.badge && (
                      <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {link.badge}
                      </span>
                    )}
                  </span>
                  {link.mega && (
                    <span className={`transition-transform duration-200 ${mobileExpanded === link.label ? "rotate-180" : ""}`}>
                      <ChevronDown />
                    </span>
                  )}
                </button>

                {/* Expanded Mobile Sub-menu */}
                {link.mega && mobileExpanded === link.label && (
                  <div className="pl-3 pb-2 space-y-3 animate-fadeIn">
                    {link.mega.sections.map((sec) => (
                      <div key={sec.title}>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#3f554f] px-3 mb-1">
                          {sec.title}
                        </p>
                        {sec.items.map((item) => (
                          <a
                            key={item}
                            href="#"
                            className="block px-3 py-1.5 text-sm text-gray-600 hover:text-[#3f554f] rounded-lg hover:bg-[#f0f5f3] transition"
                          >
                            {item}
                          </a>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Bottom CTAs */}
            <div className="pt-3 flex flex-col gap-2 border-t border-gray-100 mt-2">
              <button className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                <UserIcon /> My Account
              </button>
              <button className="flex items-center justify-center gap-2 w-full border border-[#3f554f] text-[#3f554f] font-semibold py-2.5 rounded-xl hover:bg-[#f0f5f3] transition text-sm">
                <HeartIcon /> Wishlist ({wishlistCount})
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}