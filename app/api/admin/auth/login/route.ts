export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, message: "Email and password are required" },
        { status: 400 },
      );
    }

    const configuredEmail = process.env.ADMIN_EMAIL;
    const configuredPassword = process.env.ADMIN_PASSWORD;

    const credsConfigured = !!(configuredEmail && configuredPassword);
    const valid =
      !credsConfigured ||
      (email === configuredEmail && password === configuredPassword);

    if (!valid) {
      return NextResponse.json(
        { ok: false, message: "Invalid admin credentials" },
        { status: 401 },
      );
    }

    const token = jwt.sign(
      { email, role: "admin" },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    const res = NextResponse.json({ ok: true, message: "Admin login successful" });
    res.cookies.set("admin_token", token, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    return res;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error" },
      { status: 500 },
    );
  }
}

