export default function Footer () {
    return (
        <div>
           <footer className="bg-[#1e2e2a] text-white pt-16 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-full bg-[#3f554f] flex items-center justify-center text-white font-black text-sm">D</div>
                <span className="text-xl font-black tracking-tight uppercase">Danifesh</span>
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">
                Crafting refined fashion for modern Pakistan. Quality, style, and confidence — delivered to your door.
              </p>
              <div className="flex gap-3 mt-6">
                {["instagram", "facebook", "twitter", "tiktok"].map((s) => (
                  <a key={s} href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-[#3f554f] transition-colors text-xs font-bold uppercase">
                    {s[0].toUpperCase()}
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {[
              {
                title: "Shop",
                links: ["New Arrivals", "Women", "Men", "Accessories", "Sale"],
              },
              {
                title: "Help",
                links: ["My Account", "Track Order", "Returns & Exchanges", "Size Guide", "FAQs"],
              },
              {
                title: "Company",
                links: ["About Danifesh", "Sustainability", "Careers", "Press", "Contact Us"],
              },
            ].map((col) => (
              <div key={col.title}>
                <p className="text-xs uppercase tracking-widest font-bold text-[#8fa89f] mb-4">{col.title}</p>
                <ul className="space-y-3">
                  {col.links.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-white/60 hover:text-white transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Danifesh. All rights reserved.</p>
            <div className="flex gap-4">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((l) => (
                <a key={l} href="#" className="hover:text-white/70 transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
        </div>
    );
};