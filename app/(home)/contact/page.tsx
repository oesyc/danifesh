"use client";

import { useState } from "react";

// ══════════════════════════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════════════════════════

interface ContactInfo {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}

interface BusinessHour {
  day: string;
  hours: string;
}

interface FaqItem {
  q: string;
  a: string;
}

interface SocialLink {
  label: string;
  name: string;
}

// ══════════════════════════════════════════════════════════════════
//  STATIC DATA
// ══════════════════════════════════════════════════════════════════

const BUSINESS_HOURS: BusinessHour[] = [
  { day: "Monday – Friday", hours: "10:00 AM – 8:00 PM" },
  { day: "Saturday", hours: "10:00 AM – 6:00 PM" },
  { day: "Sunday", hours: "12:00 PM – 5:00 PM" },
];

const FAQS: FaqItem[] = [
  {
    q: "How long does delivery take?",
    a: "Standard delivery across Pakistan takes 3–5 business days. Express delivery (1–2 days) is available for major cities.",
  },
  {
    q: "What is your return policy?",
    a: "We offer a 7-day hassle-free return policy. Items must be unworn, unwashed, and in original packaging with tags attached.",
  },
  {
    q: "Can I track my order?",
    a: "Yes! Once your order is shipped, you'll receive an SMS and email with a tracking link.",
  },
  {
    q: "Do you offer custom stitching?",
    a: "We currently offer standard sizes. Custom stitching is coming soon — sign up for our newsletter to be the first to know.",
  },
];

const SOCIAL_LINKS: SocialLink[] = [
  { label: "I", name: "Instagram" },
  { label: "F", name: "Facebook" },
  { label: "T", name: "TikTok" },
  { label: "P", name: "Pinterest" },
];

// ══════════════════════════════════════════════════════════════════
//  SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

function PhoneIcon(): React.JSX.Element {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

function EmailIcon(): React.JSX.Element {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function LocationIcon(): React.JSX.Element {
  return (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function SendIcon(): React.JSX.Element {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
    </svg>
  );
}

function PlusIcon(): React.JSX.Element {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function WhatsAppIcon(): React.JSX.Element {
  return (
    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2C6.477 2 2 6.477 2 12.004c0 1.77.463 3.467 1.28 4.944L2.003 22l5.243-1.26A9.959 9.959 0 0012.004 22C17.532 22 22 17.523 22 12.004 22 6.477 17.532 2 12.004 2zm0 18.007a7.985 7.985 0 01-4.097-1.132l-.293-.175-3.115.748.784-2.98-.191-.306A8.007 8.007 0 014 12.004C4 7.584 7.585 4 12.004 4c4.42 0 8.004 3.585 8.004 8.004 0 4.418-3.585 8.003-8.004 8.003z" />
    </svg>
  );
}

// ── Contact Info Card ─────────────────────────────────────────────
function ContactCard({ card }: { card: ContactInfo }): React.JSX.Element {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#f0f5f3] flex flex-col items-center text-center gap-3 hover:shadow-xl transition-shadow duration-300">
      <div className="w-12 h-12 rounded-full bg-[#f0f5f3] text-[#3f554f] flex items-center justify-center">
        {card.icon}
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#8fa89f]">{card.label}</p>
      <p className="font-black text-gray-800 text-base">{card.value}</p>
      <p className="text-xs text-[#8fa89f]">{card.sub}</p>
    </div>
  );
}

// ── FAQ Item ──────────────────────────────────────────────────────
function FaqAccordionItem({
  faq,
  index,
  openIndex,
  onToggle,
}: {
  faq: FaqItem;
  index: number;
  openIndex: number | null;
  onToggle: (i: number) => void;
}): React.JSX.Element {
  const isOpen = openIndex === index;
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => onToggle(index)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-bold text-gray-800 text-sm">{faq.q}</span>
        <span
          className={`w-6 h-6 rounded-full bg-[#f0f5f3] text-[#3f554f] flex items-center justify-center shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          <PlusIcon />
        </span>
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-sm text-[#8fa89f] leading-relaxed border-t border-[#f0f5f3] pt-4">
          {faq.a}
        </div>
      )}
    </div>
  );
}

// ── Contact Form ──────────────────────────────────────────────────
function ContactForm(): React.JSX.Element {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ): void => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (): void => {
    if (form.name.trim() && form.email.trim() && form.message.trim()) {
      setSubmitted(true);
    }
  };

  const handleReset = (): void => {
    setSubmitted(false);
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const inputClass =
    "bg-white border border-[#dce9e4] rounded-xl px-4 py-3 text-sm text-gray-800 placeholder-gray-300 outline-none focus:border-[#3f554f] transition-colors w-full";

  if (submitted) {
    return (
      <div className="bg-[#3f554f] rounded-2xl py-12 px-8 text-center flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
          🎉
        </div>
        <h3
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
          className="text-3xl font-black text-white"
        >
          Message Sent!
        </h3>
        <p className="text-[#c8d9d3] text-sm max-w-xs">
          Thank you for reaching out. Our team will get back to you within 24 hours.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 text-white/70 text-sm underline hover:text-white transition-colors"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">
            Full Name <span className="text-rose-400">*</span>
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ayesha Malik"
            autoComplete="name"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">
            Email Address <span className="text-rose-400">*</span>
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@email.com"
            autoComplete="email"
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">
          Subject
        </label>
        <select
          name="subject"
          value={form.subject}
          onChange={handleChange}
          className={`${inputClass} appearance-none cursor-pointer`}
        >
          <option value="">Select a topic…</option>
          <option value="order">Order Inquiry</option>
          <option value="return">Return &amp; Exchange</option>
          <option value="product">Product Question</option>
          <option value="wholesale">Wholesale / Bulk Order</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-widest text-[#3f554f]">
          Message <span className="text-rose-400">*</span>
        </label>
        <textarea
          name="message"
          value={form.message}
          onChange={handleChange}
          placeholder="Tell us how we can help…"
          rows={5}
          className={`${inputClass} resize-none`}
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        className="self-start inline-flex items-center gap-2 bg-[#3f554f] text-white font-bold text-sm uppercase tracking-widest px-10 py-4 rounded-full hover:bg-[#2f403b] transition-all duration-300 active:scale-95"
      >
        Send Message
        <SendIcon />
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
//  PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════

const CONTACT_INFO: ContactInfo[] = [
  {
    icon: <PhoneIcon />,
    label: "Call Us",
    value: "+92 300 2931047",
    sub: "Mon – Sat, 10am – 7pm",
  },
  {
    icon: <EmailIcon />,
    label: "Email Us",
    value: "help@danifesh.com",
    sub: "Response within 24 hours",
  },
  {
    icon: <LocationIcon />,
    label: "Visit Us",
    value: "Kahror Pakka, Punjab, Pakistan",
    sub: "Open 7 days a week",
  },
];

export default function ContactPage(): React.JSX.Element {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleFaqToggle = (i: number): void => {
    setOpenFaq((prev) => (prev === i ? null : i));
  };

  return (
    <main className="bg-white min-h-screen" style={{ fontFamily: "'Lato', sans-serif" }}>

      {/* ══ HERO ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden flex items-center justify-center py-24 px-4"
        style={{
          background: "linear-gradient(135deg, #2f403b 0%, #3f554f 50%, #5a7a71 100%)",
        }}
      >
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -right-10 bottom-0 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute left-1/3 bottom-4 w-px h-24 bg-white/10 rotate-12" />

        <div className="relative z-10 text-center max-w-2xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="w-6 h-px bg-[#c8d9d3]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#c8d9d3]">
              Get in Touch
            </span>
            <span className="w-6 h-px bg-[#c8d9d3]" />
          </div>
          <h1
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-5xl lg:text-7xl font-black text-white leading-tight"
          >
            We&apos;d Love to
            <br />
            <span className="italic font-light">Hear From You</span>
          </h1>
          <p className="text-[#a8c4bc] mt-4 text-sm max-w-md mx-auto leading-relaxed">
            Questions, feedback, or just want to say hello? Our team is here for you — always.
          </p>
        </div>
      </section>

      {/* ══ CONTACT CARDS ═════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-10 mb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {CONTACT_INFO.map((card) => (
            <ContactCard key={card.label} card={card} />
          ))}
        </div>
      </section>

      {/* ══ FORM + ASIDE ══════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">

          {/* FORM */}
          <div className="lg:col-span-3 bg-[#f5f8f6] rounded-3xl p-8 lg:p-12">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-px bg-[#3f554f]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f554f]">
                Message Us
              </span>
            </div>
            <h2
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
              className="text-4xl font-black text-gray-900 mb-8"
            >
              Send a Message
            </h2>
            <ContactForm />
          </div>

          {/* ASIDE */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* WhatsApp CTA */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{ background: "linear-gradient(135deg, #25D366 0%, #128C7E 100%)" }}
            >
              <div className="p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <WhatsAppIcon />
                </div>
                <div>
                  <p className="text-white font-black text-base">Chat on WhatsApp</p>
                  <p className="text-white/80 text-xs mt-0.5">
                    Fastest response — usually within minutes
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <a
                  href="https://wa.me/923002931047"
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full text-center bg-white text-[#128C7E] font-bold text-sm uppercase tracking-widest py-3 rounded-full hover:bg-white/90 transition-all active:scale-95"
                >
                  Start Chat
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-[#f5f8f6] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#3f554f] mb-4">
                Business Hours
              </p>
              <div className="flex flex-col gap-3">
                {BUSINESS_HOURS.map((row) => (
                  <div
                    key={row.day}
                    className="flex items-center justify-between text-sm border-b border-[#dce9e4] pb-3 last:border-0 last:pb-0"
                  >
                    <span className="text-gray-500">{row.day}</span>
                    <span className="font-bold text-[#3f554f]">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-[#2f403b] rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-[#8fa89f] mb-4">
                Follow Us
              </p>
              <div className="flex gap-3">
                {SOCIAL_LINKS.map((s) => (
                  <a
                    key={s.name}
                    href="#"
                    title={s.name}
                    className="w-10 h-10 rounded-full bg-white/10 text-white text-xs font-black flex items-center justify-center hover:bg-[#3f554f] transition-colors"
                  >
                    {s.label}
                  </a>
                ))}
              </div>
              <p className="text-[#8fa89f] text-xs mt-4 leading-relaxed">
                Tag us{" "}
                <span className="text-[#c8d9d3] font-bold">@danifesh</span>{" "}
                to be featured on our style feed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════ */}
      <section className="bg-[#f5f8f6] py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-6 h-px bg-[#3f554f]" />
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f554f]">
              Quick Answers
            </span>
          </div>
          <h2
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
            className="text-4xl font-black text-gray-900 mb-10"
          >
            Frequently Asked Questions
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq, i) => (
              <FaqAccordionItem
                key={faq.q}
                faq={faq}
                index={i}
                openIndex={openFaq}
                onToggle={handleFaqToggle}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════ */}
      <footer className="bg-[#1e2e2a] text-white py-8 px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#3f554f] flex items-center justify-center text-white font-black text-sm">
            D
          </div>
          <span className="text-lg font-black tracking-tight uppercase">Danifesh</span>
        </div>
        <p className="text-white/40 text-xs">
          &copy; {new Date().getFullYear()} Danifesh. All rights reserved.
        </p>
      </footer>

    </main>
  );
}