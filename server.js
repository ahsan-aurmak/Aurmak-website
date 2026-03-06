const path = require("path");
const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname));

const maxCvSizeBytes = 5 * 1024 * 1024;
const allowedCvMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const uploadCv = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxCvSizeBytes,
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const hasValidExt = ext === ".pdf" || ext === ".doc" || ext === ".docx";
    const hasValidMime = allowedCvMimeTypes.has(file.mimetype);
    if (!hasValidMime && !hasValidExt) {
      return cb(new Error("Please upload a PDF or Word document (.pdf, .doc, .docx)."));
    }
    return cb(null, true);
  },
});

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

function wantsHtmlResponse(req) {
  const accept = String(req.headers.accept || "");
  return accept.includes("text/html");
}

function normaliseReturnPath(value, fallback) {
  const input = clean(value);
  if (!input) return fallback;
  if (input.startsWith("http://") || input.startsWith("https://")) {
    return fallback;
  }
  if (input.startsWith("//")) {
    return fallback;
  }
  if (input.startsWith("/")) {
    return input;
  }
  if (/^[a-z0-9\-./_]+(?:\?[a-z0-9\-._~=&%+]*)?$/i.test(input)) {
    return `/${input.replace(/^\/+/, "")}`;
  }
  return fallback;
}

function renderFormResponsePage({ title, message, isSuccess, backHref, backLabel }) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeBackHref = escapeHtml(backHref);
  const safeBackLabel = escapeHtml(backLabel);
  const borderColor = isSuccess ? "#7ad6a1" : "#f2a2a2";
  const badgeBg = isSuccess ? "rgba(50, 168, 106, 0.16)" : "rgba(193, 52, 52, 0.14)";
  const badgeColor = isSuccess ? "#1e824f" : "#a23030";
  const badgeText = isSuccess ? "Submitted" : "Submission Issue";

  return `<!doctype html>
<html lang="en-GB">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${safeTitle} | AURMAK</title>
    <style>
      body {
        margin: 0;
        padding: 32px 14px;
        font-family: Inter, "Segoe UI", Arial, sans-serif;
        color: #1b2a6b;
        background: linear-gradient(180deg, #edf3fb 0%, #f7faff 100%);
      }
      .wrap {
        max-width: 680px;
        margin: 0 auto;
        border: 1px solid rgba(27, 42, 107, 0.14);
        border-radius: 16px;
        background: #ffffff;
        box-shadow: 0 20px 38px rgba(15, 31, 87, 0.08);
        overflow: hidden;
      }
      .head {
        padding: 18px 22px;
        background: linear-gradient(130deg, #1b2a6b 0%, #0f1f57 100%);
      }
      .head img {
        width: 200px;
        max-width: 100%;
        height: auto;
        display: block;
      }
      .content {
        padding: 22px;
      }
      .badge {
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        background: ${badgeBg};
        color: ${badgeColor};
        border: 1px solid ${borderColor};
        margin-bottom: 12px;
      }
      h1 {
        margin: 0 0 10px;
        font-size: 30px;
        line-height: 1.12;
      }
      p {
        margin: 0 0 16px;
        color: #4a5568;
        line-height: 1.6;
      }
      a {
        display: inline-block;
        margin-top: 4px;
        padding: 10px 14px;
        border-radius: 8px;
        border: 1px solid #1b2a6b;
        color: #1b2a6b;
        text-decoration: none;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-size: 12px;
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <header class="head">
        <img src="https://aurmak.com/assets/aurmak-logo-primary.png" alt="AURMAK Logo" />
      </header>
      <section class="content">
        <span class="badge">${badgeText}</span>
        <h1>${safeTitle}</h1>
        <p>${safeMessage}</p>
        <a href="${safeBackHref}">${safeBackLabel}</a>
      </section>
    </main>
  </body>
</html>`;
}

function sendClientResponse(req, res, options) {
  const {
    ok = false,
    status = 200,
    title = ok ? "Submission Complete" : "Unable to Submit",
    message,
    backHref = "/",
    backLabel = "Back",
  } = options;

  if (wantsHtmlResponse(req)) {
    return res.status(status).send(
      renderFormResponsePage({
        title,
        message,
        isSuccess: ok,
        backHref,
        backLabel,
      })
    );
  }

  return res.status(status).json({ ok, message });
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
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Service Requirement</td>
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
    `Service Requirement: ${data.service}`,
    "",
    "Project Brief:",
    data.message,
  ].join("\n");
}

function renderApplicationEmailHtml(data, cvMeta) {
  const safe = {
    fullName: escapeHtml(data.fullName),
    email: escapeHtml(data.email),
    phone: escapeHtml(data.phone),
    location: escapeHtml(data.location || "Not provided"),
    portfolio: escapeHtml(data.portfolio || "Not provided"),
    jobTitle: escapeHtml(data.jobTitle),
    jobCode: escapeHtml(data.jobCode || "Not provided"),
    coverLetter: escapeHtml(data.coverLetter || "Not provided"),
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
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:720px;background:#ffffff;border:1px solid #d7e0ef;border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:linear-gradient(135deg,#1b2a6b 0%,#0f1f57 100%);">
                <img src="https://blur-degree-61341666.figma.site/_assets/v11/a534ae5395a05e9265cd96257376030497e72896.png" alt="AURMAK Logo" style="width:220px;max-width:100%;height:auto;display:block;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <h1 style="margin:0 0 8px;font-size:22px;line-height:1.2;color:#1b2a6b;">New Job Application</h1>
                <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#4a5568;">
                  A candidate submitted an application through the AURMAK careers form.
                </p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;width:34%;">Job Title</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.jobTitle}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Job Code</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.jobCode}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Full Name</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.fullName}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Email</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.email}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Phone</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.phone}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Location</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.location}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">Portfolio / LinkedIn</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${safe.portfolio}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;">CV Attachment</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;">${escapeHtml(cvMeta)}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;background:#f8fbff;font-weight:700;vertical-align:top;">Application Note</td>
                    <td style="padding:10px 12px;border:1px solid #d7e0ef;white-space:pre-line;">${safe.coverLetter}</td>
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

function renderApplicationEmailText(data, cvMeta) {
  return [
    "New Job Application",
    "-------------------",
    `Job Title: ${data.jobTitle}`,
    `Job Code: ${data.jobCode || "Not provided"}`,
    `Full Name: ${data.fullName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Location: ${data.location || "Not provided"}`,
    `Portfolio / LinkedIn: ${data.portfolio || "Not provided"}`,
    `CV Attachment: ${cvMeta}`,
    "",
    "Application Note:",
    data.coverLetter || "Not provided",
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
    returnUrl: clean(req.body.returnUrl),
  };
  const backHref = normaliseReturnPath(payload.returnUrl, "/contact.html");

  // Honeypot for basic bot spam.
  if (payload.website) {
    return sendClientResponse(req, res, {
      ok: true,
      status: 200,
      title: "Enquiry Received",
      message: "Enquiry submitted.",
      backHref,
      backLabel: "Back to Contact",
    });
  }

  if (
    !payload.name ||
    !payload.email ||
    !payload.company ||
    !payload.service ||
    !payload.message
  ) {
    return sendClientResponse(req, res, {
      ok: false,
      status: 400,
      title: "Enquiry Incomplete",
      message: "Please complete all required fields.",
      backHref,
      backLabel: "Back to Contact",
    });
  }

  if (!isValidEmail(payload.email)) {
    return sendClientResponse(req, res, {
      ok: false,
      status: 400,
      title: "Invalid Email Address",
      message: "Please enter a valid email address.",
      backHref,
      backLabel: "Back to Contact",
    });
  }

  const transporter = getTransporter();
  if (!transporter) {
    return sendClientResponse(req, res, {
      ok: false,
      status: 500,
      title: "Service Configuration Required",
      message: "Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.",
      backHref,
      backLabel: "Back to Contact",
    });
  }

  const toAddress = process.env.CONTACT_TO || "info@aurmak.com";
  const fromAddress = process.env.CONTACT_FROM || process.env.SMTP_USER;
  if (!fromAddress) {
    return sendClientResponse(req, res, {
      ok: false,
      status: 500,
      title: "Service Configuration Required",
      message: "Sender address is not configured. Please set CONTACT_FROM.",
      backHref,
      backLabel: "Back to Contact",
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

    return sendClientResponse(req, res, {
      ok: true,
      status: 200,
      title: "Enquiry Submitted",
      message: "Enquiry submitted successfully. Our team will contact you shortly.",
      backHref,
      backLabel: "Back to Contact",
    });
  } catch (error) {
    console.error("Email send error:", error);
    return sendClientResponse(req, res, {
      ok: false,
      status: 500,
      title: "Unable to Submit Enquiry",
      message: "Unable to submit enquiry at the moment. Please try again shortly.",
      backHref,
      backLabel: "Back to Contact",
    });
  }
});

app.post("/api/apply", (req, res) => {
  uploadCv.single("cv")(req, res, async (uploadError) => {
    const backHref = normaliseReturnPath((req.body && req.body.returnUrl) || "", "/career.html");

    if (uploadError) {
      if (uploadError instanceof multer.MulterError && uploadError.code === "LIMIT_FILE_SIZE") {
        return sendClientResponse(req, res, {
          ok: false,
          status: 400,
          title: "CV File Too Large",
          message: "CV file size must be 5MB or less.",
          backHref,
          backLabel: "Back to Careers",
        });
      }
      return sendClientResponse(req, res, {
        ok: false,
        status: 400,
        title: "CV Upload Issue",
        message: uploadError.message || "Unable to process uploaded CV file.",
        backHref,
        backLabel: "Back to Careers",
      });
    }

    const payload = {
      fullName: clean(req.body.fullName),
      email: clean(req.body.email),
      phone: clean(req.body.phone),
      location: clean(req.body.location),
      portfolio: clean(req.body.portfolio),
      coverLetter: clean(req.body.coverLetter),
      jobCode: clean(req.body.jobCode),
      jobTitle: clean(req.body.jobTitle),
      website: clean(req.body.website),
      returnUrl: clean(req.body.returnUrl),
    };
    const responseBackHref = normaliseReturnPath(payload.returnUrl, backHref);

    if (payload.website) {
      return sendClientResponse(req, res, {
        ok: true,
        status: 200,
        title: "Application Received",
        message: "Application submitted.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    if (!payload.fullName || !payload.email || !payload.phone || !payload.jobTitle) {
      return sendClientResponse(req, res, {
        ok: false,
        status: 400,
        title: "Application Incomplete",
        message: "Please complete all required fields.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    if (!isValidEmail(payload.email)) {
      return sendClientResponse(req, res, {
        ok: false,
        status: 400,
        title: "Invalid Email Address",
        message: "Please enter a valid email address.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    if (!req.file) {
      return sendClientResponse(req, res, {
        ok: false,
        status: 400,
        title: "CV Required",
        message: "Please upload your CV in PDF or Word format.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    const transporter = getTransporter();
    if (!transporter) {
      return sendClientResponse(req, res, {
        ok: false,
        status: 500,
        title: "Service Configuration Required",
        message: "Email service is not configured. Please set SMTP_HOST, SMTP_USER and SMTP_PASS.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    const toAddress = process.env.APPLICATION_TO || process.env.CONTACT_TO || "info@aurmak.com";
    const fromAddress = process.env.CONTACT_FROM || process.env.SMTP_USER;
    if (!fromAddress) {
      return sendClientResponse(req, res, {
        ok: false,
        status: 500,
        title: "Service Configuration Required",
        message: "Sender address is not configured. Please set CONTACT_FROM.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }

    const cvMeta = `${req.file.originalname} (${Math.round(req.file.size / 1024)} KB)`;

    try {
      await transporter.sendMail({
        from: fromAddress,
        to: toAddress,
        replyTo: payload.email,
        subject: `AURMAK Application | ${payload.jobTitle} | ${payload.fullName}`,
        html: renderApplicationEmailHtml(payload, cvMeta),
        text: renderApplicationEmailText(payload, cvMeta),
        attachments: [
          {
            filename: req.file.originalname,
            content: req.file.buffer,
            contentType: req.file.mimetype,
          },
        ],
      });

      return sendClientResponse(req, res, {
        ok: true,
        status: 200,
        title: "Application Submitted",
        message: "Application submitted successfully. Our team will review your profile and respond shortly.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    } catch (error) {
      console.error("Application send error:", error);
      return sendClientResponse(req, res, {
        ok: false,
        status: 500,
        title: "Unable to Submit Application",
        message: "Unable to submit your application at the moment. Please try again shortly.",
        backHref: responseBackHref,
        backLabel: "Back to Careers",
      });
    }
  });
});

app.listen(PORT, () => {
  console.log(`AURMAK website server running on http://localhost:${PORT}`);
});
