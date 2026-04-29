import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/src/lib/prisma"
import { transporter } from "@/src/lib/mailer"  // ← ye add karo

// Resend wali line HATAO:
// import { Resend } from "resend"
// const resend = new Resend(process.env.RESEND_API_KEY)

const OTP_EXPIRY_MINUTES = 10

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(req: NextRequest) {
  try {
    const { email, name } = await req.json()

    if (!email || !name) {
      return NextResponse.json({ error: "Email and Name required" }, { status: 400 })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 })
    }

    const otp = generateOtp()
    const expires = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

    await prisma.verificationToken.deleteMany({
      where: { identifier: `otp:${email}` }
    })

    await prisma.verificationToken.create({
      data: { identifier: `otp:${email}`, token: otp, expires }
    })

    // ── Nodemailer se email bhejo ──
    await transporter.sendMail({
      from: `"${process.env.STORE_NAME}" <${process.env.FROM_EMAIL}>`,
      to: email,
      subject: `${otp} — Your verification code`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
        </head>
        <body style="margin:0;padding:0;background:#0f0f14;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f14;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="520" cellpadding="0" cellspacing="0" style="background:#1a1a22;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);">
                  
                  <tr>
                    <td style="background:linear-gradient(135deg,#1e1a14,#2a2218);padding:32px 40px;border-bottom:1px solid rgba(201,169,110,0.15);">
                      <span style="font-size:22px;font-weight:700;color:#c9a96e;letter-spacing:-0.5px;">
                        🛍️ ${process.env.STORE_NAME ?? "YourStore"}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:40px 40px 32px;">
                      <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#f5f0e8;">
                        Verify Your Email
                      </h1>
                      <p style="margin:0 0 32px;color:#6b6870;font-size:15px;line-height:1.6;">
                        Assalam-o-Alaikum <strong style="color:#c9a96e;">${name}</strong>,<br>
                        Verification Code is below. This code will expire in <strong style="color:#f5f0e8;">${OTP_EXPIRY_MINUTES} minute</strong>.
                      </p>

                      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                        <tr>
                          <td align="center">
                            <div style="
                              display:inline-block;
                              background:linear-gradient(135deg,rgba(201,169,110,0.12),rgba(201,169,110,0.06));
                              border:1px solid rgba(201,169,110,0.3);
                              border-radius:14px;
                              padding:24px 48px;
                              text-align:center;
                            ">
                              <p style="margin:0 0 6px;font-size:11px;color:#6b6870;text-transform:uppercase;letter-spacing:2px;">
                                Your Code
                              </p>
                              <p style="margin:0;font-size:42px;font-weight:700;color:#c9a96e;letter-spacing:10px;font-family:monospace;">
                                ${otp}
                              </p>
                            </div>
                          </td>
                        </tr>
                      </table>

                      <p style="margin:0 0 12px;color:#4a4850;font-size:13px;">
                        ⏱ This Code will Expire in <strong style="color:#f5f0e8;">${OTP_EXPIRY_MINUTES} minute</strong>
                      </p>
                      <p style="margin:0;color:#4a4850;font-size:13px;">
                        🔒 If you didn't request this, please ignore this email.
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:20px 40px;border-top:1px solid rgba(255,255,255,0.05);">
                      <p style="margin:0;color:#3a383f;font-size:12px;text-align:center;">
                        © ${new Date().getFullYear()} ${process.env.STORE_NAME ?? "YourStore"} · This is an automated email
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, message: "OTP bhej diya gaya" })

  } catch (e) {
    console.error("[SEND_OTP]", e)
    return NextResponse.json({ error: "Email bhejne mein masla hua, dobara try karo" }, { status: 500 })
  }
}