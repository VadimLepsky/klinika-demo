import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/session-cookie";

export { SESSION_COOKIE };

export type Role = "admin" | "viewer";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

/** Demo account — the sign-in screen is part of the product, so it stays. */
export const DEMO_EMAIL = "spravce@demo.clinic";
export const DEMO_PASSWORD = "demo1234";

export const DEMO_USERS: (SessionUser & { password: string })[] = [
  {
    id: "1",
    email: DEMO_EMAIL,
    full_name: "Petr Zeman",
    role: "admin",
    password: DEMO_PASSWORD,
  },
];

export const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

export function findUser(email: string): SessionUser | null {
  const found = DEMO_USERS.find((u) => u.email === email.trim().toLowerCase());
  if (!found) return null;
  const { password: _password, ...user } = found;
  return user;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const email = store.get(SESSION_COOKIE)?.value;
  if (!email) return null;
  return findUser(email);
}

/** Any signed-in user. */
export async function requireUser(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.email;
}

/** The email recorded in the audit log for every rule mutation. */
export async function getActorEmail(): Promise<string> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user.email;
}
