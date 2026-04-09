import nodemailer from "nodemailer";

type SendEmailArgs = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
};

function isConfigured() {
  return Boolean(
    process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS,
  );
}

function getFrom() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || "no-reply@jobion.in";
}

export async function sendEmail(args: SendEmailArgs) {
  if (!isConfigured()) {
    throw new Error("Email is not configured (missing EMAIL_* env vars)");
  }

  const port = Number(process.env.EMAIL_PORT);
  const secure =
    String(process.env.EMAIL_SECURE || "").toLowerCase() === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  return transporter.sendMail({
    from: getFrom(),
    to: args.to,
    subject: args.subject,
    text: args.text,
    html: args.html,
  });
}

