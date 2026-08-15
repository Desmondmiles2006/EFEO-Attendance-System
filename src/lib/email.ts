import nodemailer, { type Transporter } from "nodemailer";

/**
 * Email is optional. If SMTP env vars are not set, sends are skipped silently
 * so the app keeps working. Configure with (Gmail example):
 *   SMTP_HOST=smtp.gmail.com
 *   SMTP_PORT=465
 *   SMTP_USER=youradmin@gmail.com
 *   SMTP_PASS=<16-char app password>
 *   EMAIL_FROM="EFEO Attendance <youradmin@gmail.com>"   (optional; defaults to SMTP_USER)
 */

const ACCENT = "#a6192e";

let cached: Transporter | null = null;

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter(): Transporter | null {
  if (!isEmailConfigured()) return null;
  if (cached) return cached;
  const port = Number(process.env.SMTP_PORT) || 465;
  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return cached;
}

function fromAddress() {
  return process.env.EMAIL_FROM || `EFEO Attendance <${process.env.SMTP_USER}>`;
}

type SendArgs = { to: string | string[]; subject: string; heading: string; bodyHtml: string; bodyText: string };

async function send({ to, subject, heading, bodyHtml, bodyText }: SendArgs) {
  const transporter = getTransporter();
  if (!transporter) return; // email not configured — skip

  const html = `
  <div style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <div style="padding:16px 24px;border-bottom:1px solid #e2e8f0">
        <span style="font-weight:700;letter-spacing:.04em;color:${ACCENT}">EFEO</span>
        <span style="color:#64748b;font-size:12px"> — École française d'Extrême-Orient</span>
      </div>
      <div style="padding:24px">
        <h1 style="margin:0 0 12px;font-size:18px;color:#0f172a">${heading}</h1>
        ${bodyHtml}
      </div>
      <div style="padding:12px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px">
        This is an automated message from the EFEO Attendance System.
      </div>
    </div>
  </div>`;

  try {
    const info = await transporter.sendMail({ from: fromAddress(), to, subject, text: bodyText, html });
    const preview = nodemailer.getTestMessageUrl(info); // non-empty only for Ethereal test accounts
    console.info(`[email] sent "${subject}" to ${Array.isArray(to) ? to.join(", ") : to}${preview ? ` (preview: ${preview})` : ""}`);
  } catch (err) {
    // Never let email failures break the request flow.
    console.error("[email] send failed:", err instanceof Error ? err.message : err);
  }
}

function fmtRange(start: Date, end: Date) {
  const s = start.toLocaleDateString();
  const e = end.toLocaleDateString();
  return s === e ? s : `${s} – ${e}`;
}

type LeaveInfo = {
  memberName: string;
  leaveCode: string;
  leaveName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
};

function detailsHtml(info: LeaveInfo, extra?: { label: string; value: string }[]) {
  const rows = [
    ["Leave type", `${info.leaveCode} — ${info.leaveName}`],
    ["Dates", fmtRange(info.startDate, info.endDate)],
    ["Reason", info.reason],
    ...(extra ?? []).map((x) => [x.label, x.value] as [string, string]),
  ];
  return `<table style="border-collapse:collapse;font-size:14px">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 16px 4px 0;color:#64748b;vertical-align:top">${k}</td><td style="padding:4px 0;color:#0f172a">${v}</td></tr>`
    )
    .join("")}</table>`;
}

export async function sendLeaveSubmittedEmail(to: string, info: LeaveInfo) {
  await send({
    to,
    subject: "Your leave request is under review",
    heading: "Leave request received — under review",
    bodyHtml: `<p style="margin:0 0 16px;font-size:14px">Hello ${info.memberName}, your leave request has been submitted and is now awaiting an administrator's review. You'll get another email once it's approved or denied.</p>${detailsHtml(info)}`,
    bodyText: `Hello ${info.memberName}, your leave request is under review.\nLeave type: ${info.leaveCode} — ${info.leaveName}\nDates: ${fmtRange(info.startDate, info.endDate)}\nReason: ${info.reason}`,
  });
}

export async function sendLeaveDecisionEmail(
  to: string,
  info: LeaveInfo,
  decision: "APPROVED" | "REJECTED",
  note?: string | null
) {
  const approved = decision === "APPROVED";
  const extra = note ? [{ label: "Note from admin", value: note }] : undefined;
  await send({
    to,
    subject: approved ? "Your leave request was approved" : "Your leave request was denied",
    heading: approved ? "Leave request approved ✓" : "Leave request denied",
    bodyHtml: `<p style="margin:0 0 16px;font-size:14px">Hello ${info.memberName}, your leave request has been <strong>${approved ? "approved" : "denied"}</strong>.</p>${detailsHtml(info, extra)}`,
    bodyText: `Hello ${info.memberName}, your leave request was ${approved ? "APPROVED" : "DENIED"}.\nLeave type: ${info.leaveCode} — ${info.leaveName}\nDates: ${fmtRange(info.startDate, info.endDate)}${note ? `\nNote: ${note}` : ""}`,
  });
}

export async function sendAdminNewRequestEmail(adminEmails: string[], info: LeaveInfo) {
  if (adminEmails.length === 0) return;
  await send({
    to: adminEmails,
    subject: `New leave request from ${info.memberName}`,
    heading: "New leave request pending review",
    bodyHtml: `<p style="margin:0 0 16px;font-size:14px"><strong>${info.memberName}</strong> submitted a leave request that needs your review.</p>${detailsHtml(info)}`,
    bodyText: `${info.memberName} submitted a leave request pending review.\nLeave type: ${info.leaveCode} — ${info.leaveName}\nDates: ${fmtRange(info.startDate, info.endDate)}\nReason: ${info.reason}`,
  });
}
