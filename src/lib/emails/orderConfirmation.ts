export function orderConfirmationEmail({
  orderNumber,
  customerName,
  items,
  subtotal,
  shippingCost,
  totalAmount,
  address,
}: {
  orderNumber: string
  customerName: string
  items: {
    name: string
    variant?: string
    quantity: number
    price: number
  }[]
  subtotal: number
  shippingCost: number
  totalAmount: number
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    postalCode: string
    phone: string
  }
}) {
  const fmt = (cents: number) => "Rs " + (cents / 100).toLocaleString("en-PK")

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1a1a1a;">${item.name}</p>
          ${item.variant ? `<p style="margin:2px 0 0;font-size:12px;color:#888;">${item.variant}</p>` : ""}
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:center;">
          <span style="font-size:13px;color:#555;">×${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;">
          <span style="font-size:14px;font-weight:600;color:#3f554f;">${fmt(item.price * item.quantity)}</span>
        </td>
      </tr>
    `
    )
    .join("")

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Order Confirmation</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f4;font-family:'Segoe UI',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07);max-width:600px;width:100%;">

          <!-- ═══ HEADER ═══ -->
          <tr>
            <td style="background:linear-gradient(135deg,#3f554f,#2f403b);padding:36px 40px;text-align:center;">
              <!-- Logo placeholder — swap src with your actual logo URL -->
              <div style="margin-bottom:16px;">
                <span style="font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  🛍️ ${process.env.STORE_NAME ?? "Danifesh"}
                </span>
              </div>
              <div style="background:rgba(255,255,255,0.12);border-radius:50px;display:inline-block;padding:8px 20px;margin-top:4px;">
                <span style="color:#d4e8d4;font-size:13px;font-weight:500;letter-spacing:0.5px;">
                  ORDER CONFIRMED
                </span>
              </div>
            </td>
          </tr>

          <!-- ═══ HERO MESSAGE ═══ -->
          <tr>
            <td style="padding:36px 40px 0;text-align:center;">
              <div style="width:64px;height:64px;background:#e8f0ec;border-radius:50%;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:30px;">✅</span>
              </div>
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
                Thank you, ${customerName.split(" ")[0]}!
              </h1>
              <p style="margin:0;font-size:15px;color:#666;line-height:1.6;">
                Your order has been placed successfully.<br/>
                We'll get it packed and shipped as soon as possible.
              </p>
            </td>
          </tr>

          <!-- ═══ ORDER NUMBER BADGE ═══ -->
          <tr>
            <td style="padding:24px 40px;">
              <div style="background:#f0f5f3;border:1.5px dashed #3f554f;border-radius:14px;padding:18px 24px;text-align:center;">
                <p style="margin:0 0 4px;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:1.5px;">
                  Order Number
                </p>
                <p style="margin:0;font-size:22px;font-weight:800;color:#3f554f;font-family:monospace;letter-spacing:2px;">
                  ${orderNumber}
                </p>
              </div>
            </td>
          </tr>

          <!-- ═══ DIVIDER ═══ -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#f0f0f0;"></div>
            </td>
          </tr>

          <!-- ═══ ORDER ITEMS ═══ -->
          <tr>
            <td style="padding:28px 40px 0;">
              <h2 style="margin:0 0 16px;font-size:16px;font-weight:700;color:#1a1a1a;">
                Order Items
              </h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr>
                    <th style="text-align:left;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:600;">
                      Product
                    </th>
                    <th style="text-align:center;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:600;">
                      Qty
                    </th>
                    <th style="text-align:right;font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:1px;padding-bottom:8px;font-weight:600;">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRows}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- ═══ TOTALS ═══ -->
          <tr>
            <td style="padding:20px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#666;">Subtotal</td>
                  <td style="padding:5px 0;font-size:14px;color:#1a1a1a;font-weight:500;text-align:right;">${fmt(subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding:5px 0;font-size:14px;color:#666;">Shipping</td>
                  <td style="padding:5px 0;font-size:14px;text-align:right;font-weight:500;color:${shippingCost === 0 ? "#3f554f" : "#1a1a1a"};">
                    ${shippingCost === 0 ? "Free 🎉" : fmt(shippingCost)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:12px;">
                    <div style="height:1.5px;background:#f0f0f0;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top:12px;font-size:16px;font-weight:700;color:#1a1a1a;">Total</td>
                  <td style="padding-top:12px;font-size:18px;font-weight:800;color:#3f554f;text-align:right;">${fmt(totalAmount)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ DIVIDER ═══ -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#f0f0f0;"></div>
            </td>
          </tr>

          <!-- ═══ TWO COLUMNS: Address + Payment ═══ -->
          <tr>
            <td style="padding:28px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Delivery Address -->
                  <td width="50%" style="vertical-align:top;padding-right:16px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;">
                      Delivery Address
                    </p>
                    <p style="margin:0;font-size:13px;color:#444;line-height:1.7;">
                      ${address.line1}${address.line2 ? `, ${address.line2}` : ""}<br/>
                      ${address.city}, ${address.state} ${address.postalCode}<br/>
                      Pakistan<br/>
                      <span style="color:#3f554f;font-weight:600;">📞 ${address.phone}</span>
                    </p>
                  </td>
                  <!-- Payment -->
                  <td width="50%" style="vertical-align:top;padding-left:16px;">
                    <p style="margin:0 0 10px;font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;">
                      Payment Method
                    </p>
                    <div style="background:#f0f5f3;border-radius:10px;padding:12px 14px;display:inline-block;">
                      <p style="margin:0;font-size:13px;font-weight:700;color:#3f554f;">💵 Cash on Delivery</p>
                      <p style="margin:4px 0 0;font-size:11px;color:#888;">Pay when you receive</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ TRUST STRIP ═══ -->
          <tr>
            <td style="padding:0 40px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f9fbf9;border-radius:12px;padding:16px 20px;">
                <tr>
                  <td style="text-align:center;width:33%;">
                    <p style="margin:0;font-size:18px;">🚚</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#666;font-weight:500;">2–5 Day Delivery</p>
                  </td>
                  <td style="text-align:center;width:33%;">
                    <p style="margin:0;font-size:18px;">🔒</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#666;font-weight:500;">Secure Order</p>
                  </td>
                  <td style="text-align:center;width:33%;">
                    <p style="margin:0;font-size:18px;">↩️</p>
                    <p style="margin:4px 0 0;font-size:11px;color:#666;font-weight:500;">7-Day Returns</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ═══ FOOTER ═══ -->
          <tr>
            <td style="background:#3f554f;padding:24px 40px;text-align:center;">
              <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#d4e8d4;">
                ${process.env.STORE_NAME ?? "Danifesh"}
              </p>
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.4);">
                © ${new Date().getFullYear()} ${process.env.STORE_NAME ?? "Danifesh"} · This is an automated email, please do not reply
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `
}