export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// ✅ make async
async function getUser() {
  const cookieStore = await cookies(); // FIX
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // ✅ await here
    const user: any = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM recruiter_profiles WHERE user_id = ?",
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      recruiter: rows[0],
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user: any = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const fields = {
      company_name: body.company_name ?? null,
      company_type: body.company_type ?? null,
      website: body.website ?? null,
      hr_name: body.hr_name ?? null,
      hr_mobile: body.hr_mobile ?? null,
      address_line_1: body.address_line_1 ?? null,
      address_line_2: body.address_line_2 ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? null,
      pincode: body.pincode ?? null,
    };

    // Update existing profile
    const [result]: any = await db.query(
      `
      UPDATE recruiter_profiles
      SET
        company_name = ?,
        company_type = ?,
        website = ?,
        hr_name = ?,
        hr_mobile = ?,
        address_line_1 = ?,
        address_line_2 = ?,
        city = ?,
        state = ?,
        country = ?,
        pincode = ?,
        updated_at = NOW()
      WHERE user_id = ?
      `,
      [
        fields.company_name,
        fields.company_type,
        fields.website,
        fields.hr_name,
        fields.hr_mobile,
        fields.address_line_1,
        fields.address_line_2,
        fields.city,
        fields.state,
        fields.country,
        fields.pincode,
        user.id,
      ],
    );

    if (!result || result.affectedRows === 0) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}