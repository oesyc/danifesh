"use client";

import { useState, useEffect } from "react";

// ─── Stats Data ────────────────────────────────────────────────────────────────
const stats = [
  { value: "8+", label: "Experience" },
  { value: "4k+", label: "Best Clients" },
  { value: "4.9", label: "Review" },
];

// ─── Slide Data (replace src with real images) ────────────────────────────────
const slides = [
  {
    id: 1,
    tag: "New Season",
    headline1: "DANIFESH",
    headline2: "Fashion",
    sub: "Discover the art of refined dressing — curated for those who lead.",
    cta: "Shop Collection",
    // Replace with your actual image paths:
    image: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900&q=80",
    swatches: [
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=80&q=60",
      "https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=80&q=60",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=80&q=60",
    ],
  },
  {
    id: 2,
    tag: "Eid Edit",
    headline1: "DANIFESH",
    headline2: "Elegance",
    sub: "Timeless silhouettes crafted for every cherished occasion.",
    cta: "Explore Now",
    image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=900&q=80",
    swatches: [
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=80&q=60",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=80&q=60",
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=80&q=60",
    ],
  },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  };

  const prev = () => goTo((current - 1 + slides.length) % slides.length);
  const next = () => goTo((current + 1) % slides.length);

  // Auto-advance
  useEffect(() => {
    const timer = setInterval(next, 6000);
    return () => clearInterval(timer);
  }, [current]);

  const slide = slides[current];

  return (
    <section className="relative w-full min-h-[92vh] bg-[#f5f8f6] overflow-hidden flex flex-col">

      {/* ── Background ghost text (editorial) ──────────────────────────── */}
      <div
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
        aria-hidden
      >
        <span
          className="text-[22vw] font-black uppercase leading-none tracking-tighter"
          style={{
            color: "transparent",
            WebkitTextStroke: "1.5px #c8d9d3",
            opacity: 0.35,
            fontFamily: "'Cormorant Garamond', serif",
            transition: "opacity 0.5s",
          }}
        >
          {slide.headline1}
        </span>
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 items-center gap-0 py-10">

        {/* ── Left: Text Content ─────────────────────────────────────────── */}
        <div
          className="flex flex-col justify-center order-2 lg:order-1 pb-10 lg:pb-0"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(16px)" : "translateY(0)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {/* Season Tag */}
          <div className="flex items-center gap-2 mb-6">
            <span className="w-8 h-px bg-[#3f554f]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f554f]">
              {slide.tag}
            </span>
          </div>

          {/* Headline */}
          <h1
            className="leading-[0.88] mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            <span className="block text-[clamp(3rem,8vw,7rem)] font-black text-[#3f554f] uppercase tracking-tight">
              {slide.headline1}
            </span>
            <span
              className="block text-[clamp(3.5rem,9vw,8rem)] font-light italic text-[#2f403b]"
              style={{ marginTop: "-0.1em" }}
            >
              {slide.headline2}
            </span>
          </h1>

          {/* Sub text */}
          <p
            className="text-[#6b8278] text-base lg:text-lg max-w-sm leading-relaxed mb-10"
            style={{ fontFamily: "'Lato', sans-serif" }}
          >
            {slide.sub}
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-4 flex-wrap">
            <a href="/shop" className="group relative overflow-hidden bg-[#3f554f] text-white font-semibold text-sm uppercase tracking-widest px-8 py-4 rounded-full hover:bg-[#2f403b] transition-all duration-300 active:scale-95">
              {slide.cta}
              <span className="ml-2 group-hover:ml-4 transition-all duration-200 inline-block">→</span>
            </a>
            <button className="flex items-center gap-3 group cursor-pointer">
              {/* Play button */}
              <div className="w-12 h-12 rounded-full border-2 border-[#3f554f] flex items-center justify-center group-hover:bg-[#3f554f] group-hover:border-[#3f554f] transition-all duration-300">
                <svg className="w-4 h-4 text-[#3f554f] group-hover:text-white transition-colors duration-300 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">
                Play Video
              </span>
            </button>
          </div>

          {/* Swatches */}
          <div className="mt-10 flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-[#8fa89f] mr-1">
              Choose Your Style
            </span>
            {slide.swatches.map((src, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md hover:scale-110 transition-transform cursor-pointer ring-1 ring-[#c8d9d3]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Model Image ─────────────────────────────────────────── */}
        <div className="relative flex justify-center items-end order-1 lg:order-2 h-[55vw] lg:h-full max-h-180 min-h-80">

          {/* Soft circle behind model */}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] aspect-square rounded-full"
            style={{ background: "radial-gradient(circle, #ddeae4 0%, transparent 70%)" }}
          />

          {/* Model image */}
          <div
            className="relative z-10 h-full w-full max-w-115"
            style={{
              opacity: animating ? 0 : 1,
              transform: animating ? "scale(0.97)" : "scale(1)",
              transition: "opacity 0.5s ease, transform 0.5s ease",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt="Fashion model"
              className="w-full h-full object-cover object-top"
              style={{ borderRadius: "999px 999px 0 0" }}
            />
          </div>

          {/* Diamond spark decoration */}
          <div className="absolute top-12 right-4 lg:right-12 text-[#3f554f] opacity-60">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" />
            </svg>
          </div>
          <div className="absolute bottom-24 left-4 text-[#8fa89f] opacity-40">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 0l2.5 7.5L20 10l-7.5 2.5L10 20l-2.5-7.5L0 10l7.5-2.5z" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Stats + Navigation ──────────────────────────────── */}
      <div className="relative z-10 w-full border-t border-[#dce9e4] bg-white/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex items-center justify-between gap-6 flex-wrap">

          {/* Stats */}
          <div className="flex items-center gap-8">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-6">
                <div>
                  <p
                    className="text-2xl font-black text-[#3f554f] leading-none"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-[11px] uppercase tracking-widest text-[#8fa89f] font-semibold mt-0.5">
                    {s.label}
                  </p>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-8 bg-[#c8d9d3]" />
                )}
              </div>
            ))}
          </div>

          {/* Slide Navigation */}
          <div className="flex items-center gap-4">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-[#c8d9d3] flex items-center justify-center text-[#3f554f] hover:bg-[#3f554f] hover:text-white hover:border-[#3f554f] transition-all duration-200"
              aria-label="Previous"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <span
              className="text-sm font-bold tabular-nums text-[#3f554f]"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}
            >
              0{current + 1}
            </span>

            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-[#c8d9d3] flex items-center justify-center text-[#3f554f] hover:bg-[#3f554f] hover:text-white hover:border-[#3f554f] transition-all duration-200"
              aria-label="Next"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}