import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// cookies() returns a promise in newer Next.js versions, so this helper
// must be async. Callers should "await" the result.
export async function getUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (token) {
      try {
        return jwt.verify(token, process.env.JWT_SECRET!);
      } catch {
        // fall through to legacy cookie parsing
      }
    }

    const user = cookieStore.get("user");
    if (!user) return null;

    return JSON.parse(user.value);
  } catch (err) {
    return null;
  }
}
