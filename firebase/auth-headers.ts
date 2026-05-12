import type { User } from "firebase/auth";

export async function getAuthenticatedJsonHeaders(
  user: User | null
): Promise<Record<string, string>> {
  if (!user) {
    throw new Error("Login with Google before roasting a CV.");
  }

  const token = await user.getIdToken();

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}
