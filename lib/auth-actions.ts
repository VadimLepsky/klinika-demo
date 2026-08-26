"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_USERS, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/session";

// ---------- přihlášení / odhlášení ----------

export async function login(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Vyplňte obě pole" };

  const user = DEMO_USERS.find((u) => u.email === email && u.password === password);
  if (!user) return { error: "Nesprávný e-mail nebo heslo" };

  const store = await cookies();
  store.set(SESSION_COOKIE, user.email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  const from = String(formData.get("from") ?? "/");
  redirect(from.startsWith("/") ? from : "/");
}

export async function logout() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  redirect("/login");
}
