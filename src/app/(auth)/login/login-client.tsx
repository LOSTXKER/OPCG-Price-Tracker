"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    authError === "auth_failed" ? "การเข้าสู่ระบบล้มเหลว ลองใหม่อีกครั้ง" : null
  );
  const [loading, setLoading] = useState(false);

  const oauthRedirect = () => {
    const origin = window.location.origin;
    return `${origin}/callback?redirect=${encodeURIComponent(redirect)}`;
  };

  const signInOAuth = async (provider: "google" | "facebook") => {
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: oauthRedirect() },
    });
    setLoading(false);
    if (oauthError) {
      setError(oauthError.message);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    setLoading(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <div className="bg-muted/30 flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
          <CardDescription>ใช้อีเมลหรือบัญชีโซเชียลเพื่อเข้าใช้งาน</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-2">
              <label htmlFor="login-email" className="text-sm font-medium">
                อีเมล
              </label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="login-password" className="text-sm font-medium">
                รหัสผ่าน
              </label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={loading}
              />
            </div>
            {error ? <p className="text-destructive text-sm">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card text-muted-foreground px-2">หรือ</span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void signInOAuth("google")}
            >
              Login with Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => void signInOAuth("facebook")}
            >
              Login with Facebook
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <p className="text-muted-foreground text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link
              href={`/register?redirect=${encodeURIComponent(redirect)}`}
              className="text-primary font-medium underline-offset-4 hover:underline"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
