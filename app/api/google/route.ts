export const runtime = "nodejs";

import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import db from "@/app/lib/db";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(req: Request) {
  try {
    const { credential, role } = await req.json();

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const email = payload?.email;
    const name = payload?.name;
    const picture = payload?.picture;

    if (!email) {
      return NextResponse.json({ message: "Invalid token" }, { status: 400 });
    }

    // check user
    const [rows]: any = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    let user: any;

    if (rows.length === 0) {
      const [result]: any = await db.query(
        "INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
        [email, name, role || "candidate", ""]
      );

      user = {
        id: result.insertId,
        email,
        role: role || "candidate",
        name,
      };
    } else {
      user = rows[0];
    }

    // track last login
    await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // fetch safe user shape for frontend/session
    const [userRows]: any = await db.query(
      "SELECT id, email, role, name, created_at, last_login FROM users WHERE id = ? LIMIT 1",
      [user.id],
    );
    const safeUser = userRows?.[0] ?? { id: user.id, email: user.email, role: user.role, name: user.name };

    // create token
    const token = jwt.sign(
      { id: safeUser.id, email: safeUser.email, role: safeUser.role, name: safeUser.name },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" }
    );

    const res = NextResponse.json({
      message: "Login successful",
      user: safeUser,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
    });

    return res;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}