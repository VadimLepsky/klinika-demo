import "server-only";

export type Role = "admin" | "viewer";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
};

/**
 * The demo has no sign-in step — the dashboard opens straight away and every
 * change is attributed to this single account in the audit log.
 */
export const DEMO_USER: SessionUser = {
  id: "1",
  email: "spravce@demo.clinic",
  full_name: "Petr Zeman",
  role: "admin",
};

export async function getSessionUser(): Promise<SessionUser | null> {
  return DEMO_USER;
}

export async function requireUser(): Promise<string> {
  return DEMO_USER.email;
}

/** The email recorded in the audit log for every rule mutation. */
export async function getActorEmail(): Promise<string> {
  return DEMO_USER.email;
}
