import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const user = cookieStore.get("user");

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: JSON.parse(user.value),
    });
  } catch (err) {
    return NextResponse.json({ user: null });
  }
}