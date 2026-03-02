const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

function clean(value) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function toBoolean(value) {
  return String(value).toLowerCase() === "true";
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE !== undefined
      ? toBoolean(process.env.SMTP_SECURE)
      : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

function renderEmailHtml(data) {
  const safe = {
    name: escapeHtml(data.name),
    email: escapeHtml(data.email),
    company: escapeHtml(data.company),
    service: escapeHtml(data.service),
    message: escapeHtml(data.message),
  };

  const submittedAt = new Intl.DateTimeFormat("en-GB", {
    dateStyle: "full",
    timeStyle: "medium",
    timeZone: "Europe/London",
  }).format(new Date());

  return `
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#1b2a6b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:700px;background:#ffffff;border:1px solid #d7e0ef;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(135deg,#1b2a6b 0%,#0f1f57 100%);">
                <img src="https://blur-degree-61341666.figma.site/_assets/v11/a534ae5395a05e9265cd96257376030497e72896.png" alt="AURMAK Logo" style="width:220px;max-width:100%;height:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 8px;font-size:22px;line-height:1.2;color:#1b2a6b;">New Contact Enquiry</h1>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4a5568;">
                  A new enquiry has been submitted through the AURMAK website contact form.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;width:34%;">Full Name</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.name}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Work Email</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Company / Organisation</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.company}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Service Interest</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.service}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;vertical-align:top;">Project Brief</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;white-space:pre-line;">${safe.message}</td>
                  </tr>
                </table>
                <p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#7183a6;">
                  Submitted: ${submittedAt} (Europe/London)
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

function renderEmailText(data) {
  return [
    "New Contact Enquiry",
    "-------------------",
    `Full Name: ${data.name}`,
    `Work Email: ${data.email}`,
    `Company / Organisation: ${data.company}`,
    `Service Interest: ${data.service}`,
    "",
    "Project Brief:",
    data.message,
  ].join("\n");
}

app.post("/api/contact", async (req, res) => {
  const payload = {
    name: clean(req.body.name),
    email: clean(req.body.email),
    company: clean(req.body.company),
    service: clean(req.body.service),
    message: clean(req.body.message),
    website: clean(req.body.website),
  };

  // Honeypot for basic bot spam.
  if (payload.website) {
    return res.json({ ok: true, message: "Enquiry submitted." });
  }

  if (
    !payload.name ||
    !payload.email ||
    !payload.company ||
    !payload.service ||
    !payload.message
  ) {
    return res.status(400).json({ message: "Please complete all required fields." });
  }

  if (!isValidEmail(payload.email)) {
    return res.status(400).json({ message: "Please enter a valid email address." });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return res.status(500).json({
      message:
        "Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.",
    });
  }

  const toAddress = process.env.CONTACT_TO || "info@aurmak.com";
  const fromAddress = process.env.CONTACT_FROM || process.env.SMTP_USER;
  if (!fromAddress) {
    return res.status(500).json({
      message: "Sender address is not configured. Please set CONTACT_FROM.",
    });
  }

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: toAddress,
      replyTo: payload.email,
      subject: `AURMAK Enquiry | ${payload.name} | ${payload.company}`,
      html: renderEmailHtml(payload),
      text: renderEmailText(payload),
    });

    return res.json({
      ok: true,
      message:
        "Thank you. Your enquiry has been sent successfully. Our team will contact you shortly.",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return res.status(500).json({
      message: "Unable to send your enquiry at the moment. Please try again shortly.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`AURMAK website server running on http://localhost:${PORT}`);
});
