const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = "support@learnzo.online";
const SENDER_NAME = "Learnzo";

export interface SendVerificationArgs {
  to: string;
  name: string;
  token: string;
  source: string;
}

export async function sendVerificationEmail({
  to,
  name,
  token,
  source
}: SendVerificationArgs): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://learnzo.online";
  const link = base + "/verify?token=" + token;

  const sourceLabel =
    source === "paint"
      ? "Coloring tool"
      : source === "games"
      ? "Free games"
      : source === "coloring-book"
      ? "Coloring Book"
      : source === "tracing-workbook"
      ? "Tracing Workbook"
      : source === "numbers-workbook"
      ? "Numbers Workbook"
      : source === "alphabet-workbook"
      ? "Alphabet Workbook"
      : "Learnzo";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#0f172a">
      <h1 style="color:#1a4bdd;margin:0 0 8px">Learnzo</h1>
      <p style="color:#64748b;margin:0 0 24px;font-size:14px">Learn. Understand. Grow.</p>

      <h2 style="font-size:20px;margin:0 0 12px">Hi ${escapeHtml(name)},</h2>

      <p style="font-size:15px;line-height:1.6">
        Thanks for choosing ${escapeHtml(sourceLabel)} from Learnzo.
      </p>

      <p style="font-size:15px;line-height:1.6">
        Please confirm your email address by clicking the button below.
        This helps us make sure we send future activities to the right person.
      </p>

      <p style="text-align:center;margin:32px 0">
        <a href="${link}"
           style="display:inline-block;background:#1a4bdd;color:#ffffff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:bold">
          Confirm my email
        </a>
      </p>

      <p style="font-size:13px;color:#64748b;line-height:1.6">
        If the button does not work, copy this link into your browser:<br>
        <a href="${link}" style="color:#1a4bdd;word-break:break-all">${link}</a>
      </p>

      <p style="font-size:13px;color:#64748b;line-height:1.6;margin-top:32px">
        This link expires in 24 hours. If you did not request this, you can ignore the email.
      </p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:32px 0">

      <p style="font-size:12px;color:#94a3b8;text-align:center">
        Learnzo &middot; learnzo.online<br>
        Questions? Reply to this email or write to support@learnzo.online
      </p>
    </div>
  `;

  const body = {
    sender: { email: SENDER_EMAIL, name: SENDER_NAME },
    to: [{ email: to, name }],
    subject: "Confirm your email - Learnzo",
    htmlContent: html
  };

  const res = await fetch(BREVO_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": apiKey
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("[brevo] status", res.status, "body", text);
    throw new Error("Could not send verification email");
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function makeToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}