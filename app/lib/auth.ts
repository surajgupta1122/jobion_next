import { cookies } from "next/headers";

// cookies() returns a promise in newer Next.js versions, so this helper
// must be async. Callers should "await" the result.
export async function getUser() {
  try {
    const cookieStore = await cookies();
    const user = cookieStore.get("user");

    if (!user) return null;

    return JSON.parse(user.value);
  } catch (err) {
    return null;
  }
}
