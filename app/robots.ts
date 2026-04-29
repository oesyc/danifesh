// app/robots.ts
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/s", "/products/", "/category/", "/contact"],
        disallow: [
          "/dashboard/",
          "/admin/",
          "/super-admin/",
          "/api/",
          "/checkout/",
          "/cart/",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: "https://www.danifesh.store/sitemap.xml",
  }
}