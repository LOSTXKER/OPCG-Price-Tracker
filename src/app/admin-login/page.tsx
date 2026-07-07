"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Eye, EyeOff, Loader2, Lock, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { adminFetch } from "@/lib/admin/admin-fetch"
import { createClient } from "@/lib/supabase/client"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email || !password) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signError) {
      setLoading(false)
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      return
    }

    try {
      await adminFetch("/api/admin/stats")
    } catch {
      setLoading(false)
      await supabase.auth.signOut()
      setError("บัญชีนี้ไม่มีสิทธิ์ Admin")
      return
    }

    router.push("/admin")
    router.refresh()
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-background px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[300px] w-[400px] rounded-full bg-primary/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-card ring-1 ring-hair">
            <Image
              src="/meecard.png"
              alt="Meecard"
              width={32}
              height={29}
              className="h-auto"
              style={{ width: 40, height: "auto" }}
              priority
            />
          </div>
          <div className="text-center">
            <h1 className="text-h1 text-foreground">
              Admin Panel
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Meecard Management System
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-hair bg-card p-6 shadow-2xl backdrop-blur-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="text-xs font-medium text-muted-foreground">
                อีเมล
              </label>
              <Input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@meecard.com"
                disabled={loading}
                className="h-10 border-hair bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-primary/30"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="text-xs font-medium text-muted-foreground">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-10 border-hair bg-muted pr-10 text-foreground focus-visible:ring-primary/30"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="status-danger flex items-center gap-2 rounded-lg border border-danger/20 px-3 py-2 text-sm">
                <ShieldCheck className="size-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="h-10 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Lock className="size-3.5" />
              )}
              {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ Admin"}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          เฉพาะผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  )
}
