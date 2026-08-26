"use client";

import { useActionState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const DEMO_EMAIL = "spravce@demo.clinic";
const DEMO_PASSWORD = "demo1234";

function LoginForm() {
  const params = useSearchParams();
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <Card className="w-full max-w-sm border-border bg-card shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-xl tracking-tight">
          Provize — demo.clinic
        </CardTitle>
        <CardDescription>Přihlaste se pro pokračování</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="from" value={params.get("from") ?? "/"} />

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={DEMO_EMAIL}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Heslo</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              defaultValue={DEMO_PASSWORD}
              required
            />
          </div>

          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Přihlašování…" : "Přihlásit se"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Demo: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
