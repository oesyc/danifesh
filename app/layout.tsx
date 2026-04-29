import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import "./globals.css";
import Header from "./components/header";
import Footer from "./components/fotter";
import { SessionProvider } from "next-auth/react"
import { auth } from "@/src/lib/auth"  // ← yeh auth.ts se aata hai, auth-edge.ts se nahi

const geistSans = Bebas_Neue({
  weight: "400",
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.danifesh.store"),
  title: {
    default: "Danifesh — Online Store",
    template: "%s | Danifesh",
  },
  description: "Shop the latest products at Danifesh. Fast delivery, easy returns.",
  keywords: ["danifesh", "online shopping", "pakistan", "store"],
  authors: [{ name: "Danifesh" }],
  creator: "Asad",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.danifesh.store",
    siteName: "Danifesh",
    title: "Danifesh — Online Store",
    description: "Shop the latest products at Danifesh.",
    images: [
      {
        url: "/og-image.jpg", // 1200x630 image banao public folder mein
        width: 1200,
        height: 630,
        alt: "Danifesh Store",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Danifesh — Online Store",
    description: "Shop the latest products at Danifesh.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let session = null
  try {
    session = await auth()
  } catch (e) {
    console.error("Session fetch failed:", e)
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <SessionProvider session={session}>
          <Header />
          {children}
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}