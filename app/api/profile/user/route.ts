export const runtime = "nodejs";

import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

async function getUser() {
  const cookieStore = await cookies();
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
    const user: any = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const [rows]: any = await db.query(
      "SELECT * FROM candidate_profiles WHERE user_id = ?",
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        user: null,
      });
    }

    return NextResponse.json({
      success: true,
      user: rows[0],
    });
  } catch {
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user: any = await getUser();

    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
    }

    const fields = {
      full_name: body.full_name ?? null,
      phone: body.phone ?? null,
      date_of_birth: body.date_of_birth ?? null,
      gender: body.gender ?? null,
      city: body.city ?? null,
      state: body.state ?? null,
      country: body.country ?? null,
      highest_qualification: body.highest_qualification ?? null,
      trade_stream: body.trade_stream ?? null,
      job_type: body.job_type ?? null,
      availability: body.availability ?? null,
      expected_salary: body.expected_salary ?? null,
      id_proof_available: body.id_proof_available ?? null,
      experience_years: body.experience_years ?? null,
      linkedin_url: body.linkedin_url ?? null,
      github_url: body.github_url ?? null,
      resume_path: body.resume_path ?? null,
    };

    const [existingRows]: any = await db.query(
      "SELECT user_id FROM candidate_profiles WHERE user_id = ?",
      [user.id],
    );

    const profileExists = existingRows && existingRows.length > 0;

    if (profileExists) {
      await db.query(
        `
        UPDATE candidate_profiles
        SET
          full_name = ?,
          phone = ?,
          date_of_birth = ?,
          gender = ?,
          city = ?,
          state = ?,
          country = ?,
          highest_qualification = ?,
          trade_stream = ?,
          job_type = ?,
          availability = ?,
          expected_salary = ?,
          id_proof_available = ?,
          experience_years = ?,
          linkedin_url = ?,
          github_url = ?,
          resume_path = ?,
          updated_at = NOW()
        WHERE user_id = ?
        `,
        [
          fields.full_name,
          fields.phone,
          fields.date_of_birth,
          fields.gender,
          fields.city,
          fields.state,
          fields.country,
          fields.highest_qualification,
          fields.trade_stream,
          fields.job_type,
          fields.availability,
          fields.expected_salary,
          fields.id_proof_available,
          fields.experience_years,
          fields.linkedin_url,
          fields.github_url,
          fields.resume_path,
          user.id,
        ],
      );
    } else {
      await db.query(
        `
        INSERT INTO candidate_profiles (
          user_id,
          full_name,
          phone,
          date_of_birth,
          gender,
          city,
          state,
          country,
          highest_qualification,
          trade_stream,
          job_type,
          availability,
          expected_salary,
          id_proof_available,
          experience_years,
          linkedin_url,
          github_url,
          resume_path,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `,
        [
          user.id,
          fields.full_name,
          fields.phone,
          fields.date_of_birth,
          fields.gender,
          fields.city,
          fields.state,
          fields.country,
          fields.highest_qualification,
          fields.trade_stream,
          fields.job_type,
          fields.availability,
          fields.expected_salary,
          fields.id_proof_available,
          fields.experience_years,
          fields.linkedin_url,
          fields.github_url,
          fields.resume_path,
        ],
      );
    }

    const [rows]: any = await db.query(
      "SELECT * FROM candidate_profiles WHERE user_id = ?",
      [user.id],
    );

    return NextResponse.json({
      success: true,
      user: rows?.[0] ?? null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}